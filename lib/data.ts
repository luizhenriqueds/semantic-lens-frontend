import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { EMBEDDING_MODEL, embedQuery, rerank } from "@/lib/embed";
import { normalize, parseFacets, type GoalKey, type PoiQuery } from "@/lib/facets";
import { semanticCached } from "@/lib/semanticCache";
import { deriveTitle, titleCase } from "@/lib/format";
import { dominantStreet } from "@/lib/geo";
import type {
  Cluster,
  MarketHistoryPoint,
  MarketStats,
  NearbyPoi,
  Poi,
  PriceHistoryPoint,
  ProfileKey,
  Property,
  Recommendation,
  Region,
  ScoreExplain,
  ScoreTerm,
} from "@/lib/types";

const CLUSTER_RUN = "property-v1";
const REVALIDATE = 120;

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

const TRANSIENT =
  /statement timeout|canceling statement|timeout|fetch failed|ECONN|socket hang up/i;

// Retries transient failures (e.g. Postgres `statement timeout` under load).
// The queries are normally sub-100ms, so a couple of short backoffs recover
// from load spikes without poisoning the request cache with an empty result.
async function withRetry<T>(build: () => PromiseLike<QueryResult<T>>): Promise<QueryResult<T>> {
  let res = await build();
  for (let i = 0; i < 3 && res.error && TRANSIENT.test(res.error.message); i++) {
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    res = await build();
  }
  return res;
}

function rows<T>(name: string, res: QueryResult<T>): T[] {
  if (res.error) {
    console.error(`[data] query "${name}" failed: ${res.error.message}`);
  }
  return res.data ?? [];
}

// Pages past PostgREST's 1000-row cap. `build` must apply a stable `.order(...)`.
async function fetchAllRows<T>(
  name: string,
  build: (from: number, to: number) => PromiseLike<QueryResult<T>>,
): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const res = await withRetry(() => build(from, from + PAGE - 1));
    const batch = rows<T>(name, res);
    out.push(...batch);
    if (batch.length < PAGE) break;
  }
  return out;
}

// property_id -> { category: nearest distance in metres }, aggregated in Postgres.
async function loadNearestPoi(): Promise<Map<string, Record<string, number>>> {
  const list = await fetchAllRows<{ property_id: string; nearest: Record<string, number> | null }>(
    "property_nearest_poi",
    (from, to) => supabase.rpc("property_nearest_poi").order("property_id").range(from, to),
  );
  return new Map(list.map((r) => [r.property_id, r.nearest ?? {}]));
}

function pickImage(p: {
  image_source_url?: string | null;
  image_path?: string | null;
}): string | null {
  if (p.image_source_url) return p.image_source_url;
  if (p.image_path && p.image_path.startsWith("http")) return p.image_path;
  return null;
}

async function loadProperties(): Promise<Property[]> {
  const [props, listingRows, scoreRows, profileRows, pclRows, clusterRows, nearestPoiMap] =
    await Promise.all([
      fetchAllRows<any>("properties", (f, t) =>
        supabase
          .from("properties")
          .select(
            "property_id,property_type,uf,city,neighborhood,raw_address,area_m2,bedrooms,parking_spots,year_built,occupancy_status,canonical_description,h3_r8,image_path,image_source_url,lat,lon,is_active,visual_score,visual_note,visual_age,price_rank,size_rank,center_proximity_m",
          )
          .order("property_id")
          .range(f, t),
      ),
      fetchAllRows<any>("listings", (f, t) =>
        supabase
          .from("listings")
          .select(
            "property_id,appraised_value,sale_value,discount,modality,auction_date,link,snapshot_date,accepts_financing,accepts_fgts",
          )
          .order("id")
          .range(f, t),
      ),
      fetchAllRows<any>("property_scores", (f, t) =>
        supabase
          .from("property_scores")
          .select(
            "property_id,flip,liquidity,airbnb,student,family,commercial,convenience,investment",
          )
          .eq("score_version", 1)
          .order("property_id")
          .range(f, t),
      ),
      fetchAllRows<any>("property_profiles", (f, t) =>
        supabase
          .from("property_profiles")
          .select("property_id,profile,score,is_primary")
          .eq("is_primary", true)
          .order("property_id")
          .range(f, t),
      ),
      fetchAllRows<any>("property_clusters", (f, t) =>
        supabase
          .from("property_clusters")
          .select("property_id,cluster_id")
          .eq("cluster_run_id", CLUSTER_RUN)
          .order("property_id")
          .range(f, t),
      ),
      fetchAllRows<any>("clusters", (f, t) =>
        supabase
          .from("clusters")
          .select("cluster_id,label,profile")
          .eq("cluster_run_id", CLUSTER_RUN)
          .order("cluster_id")
          .range(f, t),
      ),
      loadNearestPoi(),
    ]);

  const listingMap = new Map<string, any>();
  for (const l of listingRows) {
    const cur = listingMap.get(l.property_id);
    if (!cur || (l.snapshot_date ?? "") > (cur.snapshot_date ?? "")) {
      listingMap.set(l.property_id, l);
    }
  }
  const scoreMap = new Map(scoreRows.map((s) => [s.property_id, s]));
  const profileMap = new Map(profileRows.map((p) => [p.property_id, p]));
  const pclMap = new Map(pclRows.map((c) => [c.property_id, c.cluster_id]));
  const clusterMap = new Map(clusterRows.map((c) => [c.cluster_id, c]));

  return (props as any[]).map((p): Property => {
    const l = listingMap.get(p.property_id);
    const s = scoreMap.get(p.property_id);
    const prof = profileMap.get(p.property_id);
    const cid = pclMap.get(p.property_id);
    const cl = cid != null && cid !== -1 ? clusterMap.get(cid) : undefined;
    const city = titleCase(p.city ?? "");
    return {
      id: p.property_id,
      propertyType: p.property_type ?? "Imóvel",
      uf: p.uf ?? "",
      city,
      neighborhood: p.neighborhood ?? "",
      rawAddress: p.raw_address || null,
      area: num(p.area_m2),
      bedrooms: num(p.bedrooms),
      parkingSpots: num(p.parking_spots),
      yearBuilt: num(p.year_built),
      occupancyStatus: p.occupancy_status || null,
      title: deriveTitle(p.property_type ?? "Imóvel", num(p.bedrooms), p.neighborhood ?? ""),
      description: p.canonical_description || null,
      image: pickImage(p),
      appraisedValue: num(l?.appraised_value),
      saleValue: num(l?.sale_value),
      discount: num(l?.discount),
      modality: l?.modality || null,
      auctionDate: l?.auction_date || null,
      link: l?.link || null,
      inactive: p.is_active === false,
      acceptsFinancing: l?.accepts_financing === true,
      acceptsFgts: l?.accepts_fgts === true,
      scores: {
        flip: num(s?.flip),
        liquidity: num(s?.liquidity),
        airbnb: num(s?.airbnb),
        student: num(s?.student),
        family: num(s?.family),
        commercial: num(s?.commercial),
        convenience: num(s?.convenience),
        investment: num(s?.investment),
      },
      profile: (prof?.profile as ProfileKey) ?? null,
      profileScore: num(prof?.score),
      clusterId: cid != null && cid !== -1 ? cid : null,
      clusterLabel: cl?.label ?? null,
      h3: p.h3_r8 || null,
      lat: num(p.lat),
      lon: num(p.lon),
      visualScore: num(p.visual_score),
      visualNote: p.visual_note || null,
      visualAge: (["novo", "intermediario", "antigo"].includes(p.visual_age)
        ? p.visual_age
        : null) as Property["visualAge"],
      priceRank: num(p.price_rank),
      sizeRank: num(p.size_rank),
      centerProximity: num(p.center_proximity_m),
      nearestPoi: nearestPoiMap.get(p.property_id) ?? {},
    };
  });
}

// The pois table is large (~236k rows), so it is never loaded whole — callers
// fetch only the POIs they need by id, by bounding box, or by name.
const POI_FIELDS = "id,category,name,lat,lon";
const mapPoi = (r: any): Poi => ({
  id: r.id,
  category: r.category ?? "",
  name: r.name || null,
  lat: Number(r.lat),
  lon: Number(r.lon),
});

async function loadPoisByIds(ids: number[]): Promise<Poi[]> {
  const out: Poi[] = [];
  for (let i = 0; i < ids.length; i += 500) {
    const res = await withRetry(() =>
      supabase
        .from("pois")
        .select(POI_FIELDS)
        .in("id", ids.slice(i, i + 500)),
    );
    out.push(...rows<any>("pois-by-id", res).map(mapPoi));
  }
  return out;
}

async function loadPoisNear(lat: number, lon: number, radiusM: number): Promise<Poi[]> {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180) || 1);
  const res = await withRetry(() =>
    supabase
      .from("pois")
      .select(POI_FIELDS)
      .gte("lat", lat - dLat)
      .lte("lat", lat + dLat)
      .gte("lon", lon - dLon)
      .lte("lon", lon + dLon)
      .limit(3000),
  );
  return rows<any>("pois-near", res).map(mapPoi);
}

export function getPoisNear(lat: number, lon: number, radiusM: number): Promise<Poi[]> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)},${radiusM}`;
  return unstable_cache(() => loadPoisNear(lat, lon, radiusM), ["pois-near", key], {
    revalidate: REVALIDATE,
  })();
}

async function loadMarketHistory(addressKey: string): Promise<MarketHistoryPoint[]> {
  const res = await withRetry(() =>
    supabase
      .from("market_address_stat_history")
      .select("address_key,computed_at,price_median,price_m2_median,sample_size")
      .eq("address_key", addressKey)
      .order("computed_at", { ascending: true }),
  );
  return rows<any>("market-history", res)
    .filter((r) => r.computed_at)
    .map((r) => ({
      date: String(r.computed_at),
      priceMedian: num(r.price_median),
      priceM2Median: num(r.price_m2_median),
      sampleSize: num(r.sample_size),
    }));
}

async function loadMarketStats(): Promise<MarketStats[]> {
  const res = await withRetry(() =>
    supabase
      .from("market_address_stats")
      .select(
        "address_key,uf,city,neighborhood,property_type,sample_size,price_median,area_median,price_m2_median,price_m2_p25,price_m2_p75,computed_at",
      ),
  );
  return rows<any>("market_address_stats", res).map((r) => ({
    addressKey: r.address_key,
    uf: r.uf ?? null,
    city: r.city ?? null,
    neighborhood: r.neighborhood ?? null,
    propertyType: r.property_type ?? null,
    sampleSize: num(r.sample_size),
    priceMedian: num(r.price_median),
    areaMedian: num(r.area_median),
    priceM2Median: num(r.price_m2_median),
    priceM2P25: num(r.price_m2_p25),
    priceM2P75: num(r.price_m2_p75),
    computedAt: r.computed_at ?? null,
  }));
}

async function loadClusters(): Promise<Cluster[]> {
  const res = await withRetry(() =>
    supabase
      .from("clusters")
      .select("cluster_id,label,description,profile,size")
      .eq("cluster_run_id", CLUSTER_RUN)
      .neq("cluster_id", -1)
      .order("size", { ascending: false }),
  );
  return rows<any>("clusters", res).map((c) => ({
    clusterId: c.cluster_id,
    label: c.label ?? "Grupo",
    description: c.description ?? null,
    profile: (c.profile as ProfileKey) || null,
    size: c.size ?? 0,
    sampleIds: [],
  }));
}

async function loadRegions(): Promise<Region[]> {
  const [props, [cellsRes, scoresRes, dnaRes, featuresRes, neighborsRes]] = await Promise.all([
    getProperties(),
    Promise.all([
      withRetry(() =>
        supabase.from("region_cells").select("h3,city,neighborhood_label,num_properties"),
      ),
      withRetry(() =>
        supabase
          .from("region_scores")
          .select("h3,convenience,walkability,commercial,airbnb,student,family")
          .eq("score_version", 1),
      ),
      withRetry(() => supabase.from("region_dna").select("h3,dna,top_tags,summary_text")),
      withRetry(() =>
        supabase.from("region_features").select("h3,features").eq("feature_version", 1),
      ),
      withRetry(() => supabase.from("region_neighbors").select("h3,neighbor_h3,similarity,rank")),
    ]),
  ]);

  // region_cells.num_properties is a pipeline snapshot that drifts from the live listings, so
  // count the active properties actually joined to each cell instead.
  const liveCount = new Map<string, number>();
  const propsByH3 = new Map<string, Property[]>();
  for (const p of props) {
    if (!p.h3 || p.inactive) continue;
    liveCount.set(p.h3, (liveCount.get(p.h3) ?? 0) + 1);
    const g = propsByH3.get(p.h3);
    if (g) g.push(p);
    else propsByH3.set(p.h3, [p]);
  }

  const cells = rows<any>("region_cells", cellsRes);
  const cellMap = new Map(cells.map((c) => [c.h3, c]));
  const scoreMap = new Map(rows<any>("region_scores", scoresRes).map((s) => [s.h3, s]));
  const dnaMap = new Map(rows<any>("region_dna", dnaRes).map((d) => [d.h3, d]));
  const featMap = new Map(rows<any>("region_features", featuresRes).map((f) => [f.h3, f.features]));
  const neighborMap = new Map<string, any[]>();
  for (const n of rows<any>("region_neighbors", neighborsRes)) {
    if (!neighborMap.has(n.h3)) neighborMap.set(n.h3, []);
    neighborMap.get(n.h3)!.push(n);
  }

  const nameOf = (h3: string) => {
    const c = cellMap.get(h3);
    return {
      name: c?.neighborhood_label ?? "Região",
      city: titleCase(c?.city ?? ""),
    };
  };

  const regions = cells
    .filter((c) => scoreMap.has(c.h3))
    .map((c): Region => {
      const s = scoreMap.get(c.h3);
      const d = dnaMap.get(c.h3);
      const feat = (featMap.get(c.h3) ?? {}) as {
        counts?: Record<string, number>;
        nearest_m?: Record<string, number>;
      };
      const nb = (neighborMap.get(c.h3) ?? [])
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 3)
        .map((n) => ({ h3: n.neighbor_h3, similarity: n.similarity, ...nameOf(n.neighbor_h3) }));
      return {
        h3: c.h3,
        name: c.neighborhood_label ?? "Região",
        city: titleCase(c.city ?? ""),
        subLabel: null,
        numProps: liveCount.get(c.h3) ?? 0,
        scores: {
          convenience: num(s?.convenience),
          walkability: num(s?.walkability),
          commercial: num(s?.commercial),
          airbnb: num(s?.airbnb),
          student: num(s?.student),
          family: num(s?.family),
        },
        dna: (d?.dna as Region["dna"]) ?? null,
        topTags: (d?.top_tags as string[]) ?? [],
        summary: d?.summary_text ?? null,
        counts: feat.counts ?? {},
        nearest: feat.nearest_m ?? {},
        neighbors: nb,
      };
    });

  const byName = new Map<string, Region[]>();
  for (const r of regions) {
    const key = `${r.city}||${r.name}`;
    const group = byName.get(key);
    if (group) group.push(r);
    else byName.set(key, [r]);
  }
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    for (const r of group) r.subLabel = dominantStreet(propsByH3.get(r.h3) ?? []);
  }

  return regions;
}

export const getProperties = unstable_cache(loadProperties, ["properties"], {
  revalidate: REVALIDATE,
});
export const getClusters = unstable_cache(loadClusters, ["clusters"], {
  revalidate: REVALIDATE,
});
export const getRegions = unstable_cache(loadRegions, ["regions"], {
  revalidate: REVALIDATE,
});
export const getMarketStats = unstable_cache(loadMarketStats, ["market-stats"], {
  revalidate: REVALIDATE,
});
export function getMarketHistory(addressKey: string): Promise<MarketHistoryPoint[]> {
  return unstable_cache(() => loadMarketHistory(addressKey), ["market-history", addressKey], {
    revalidate: REVALIDATE,
  })();
}

export async function getProperty(id: string): Promise<Property | null> {
  const all = await getProperties();
  return all.find((p) => p.id === id) ?? null;
}

// The `components` JSONB is heavy, so it is fetched per-property rather than
// joined into the bulk `loadProperties` result.
async function loadScoreExplain(id: string): Promise<ScoreExplain | null> {
  const res = await withRetry(() =>
    supabase
      .from("property_scores")
      .select("components")
      .eq("property_id", id)
      .eq("score_version", 1)
      .limit(1),
  );
  const inv = rows<any>("property-score-explain", res)[0]?.components?.investment;
  if (!Array.isArray(inv)) return null;

  const IMPACTS = ["ajuda", "neutro", "pesa"];
  const dashless = (s: string) => s.replace(/[—–]/g, "-");
  let summary: string | null = null;
  const terms: ScoreTerm[] = [];
  for (const c of inv) {
    if (!c || c.available === false) continue;
    if (c.feature === "resumo") {
      summary = c.text ? dashless(c.text) : null;
    } else if (c.label && IMPACTS.includes(c.impact)) {
      terms.push({
        feature: String(c.feature ?? ""),
        label: String(c.label),
        detail: c.detail ? dashless(c.detail) : null,
        impact: c.impact,
        weight: num(c.weight),
        contribution: num(c.contribution),
      });
    }
  }
  if (!summary && !terms.length) return null;
  terms.sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0));
  return { summary, terms };
}

export function getScoreExplain(id: string): Promise<ScoreExplain | null> {
  return unstable_cache(() => loadScoreExplain(id), ["property-score-explain", id], {
    revalidate: REVALIDATE,
  })();
}

async function loadPriceHistory(id: string): Promise<PriceHistoryPoint[]> {
  const res = await withRetry(() =>
    supabase
      .from("listings")
      .select("appraised_value,sale_value,discount,modality,auction_date,snapshot_date")
      .eq("property_id", id)
      .order("snapshot_date", { ascending: true }),
  );

  const raw = rows<any>("price-history", res)
    .filter((l) => l.snapshot_date && l.sale_value != null)
    .map((l) => ({
      date: String(l.snapshot_date),
      saleValue: num(l.sale_value),
      appraisedValue: num(l.appraised_value),
      discount: num(l.discount),
      modality: l.modality || null,
    }));

  // Drop only *interior* snapshots whose price didn't change, so the chart
  // shows price movements rather than scraping cadence — but always keep the
  // first and last snapshot so a property listed twice at a stable price still
  // renders its two anchor points.
  const out: PriceHistoryPoint[] = [];
  for (let i = 0; i < raw.length; i++) {
    const prev = out[out.length - 1];
    const isLast = i === raw.length - 1;
    if (prev && prev.saleValue === raw[i].saleValue && !isLast) continue;
    out.push(raw[i]);
  }
  return out;
}

export function getPriceHistory(id: string): Promise<PriceHistoryPoint[]> {
  return unstable_cache(() => loadPriceHistory(id), ["price-history", id], {
    revalidate: REVALIDATE,
  })();
}

async function loadRecommendations(id: string): Promise<Recommendation[]> {
  const res = await withRetry(() =>
    supabase
      .from("property_recommendations")
      .select("kind,rank,similarity,rec_property_id")
      .eq("property_id", id)
      .order("rank", { ascending: true }),
  );
  return rows<any>("property-recommendations", res)
    .filter((r) => r.kind === "similar" || r.kind === "visual")
    .map((r) => ({
      recId: String(r.rec_property_id),
      kind: r.kind as Recommendation["kind"],
      rank: num(r.rank) ?? 0,
      similarity: num(r.similarity),
    }));
}

export function getRecommendations(id: string): Promise<Recommendation[]> {
  return unstable_cache(() => loadRecommendations(id), ["property-recommendations", id], {
    revalidate: REVALIDATE,
  })();
}

// Precomputed nearest POIs for a property (property_poi.dist_m), resolved to the
// full POI record and sorted nearest-first.
async function loadPropertyPois(id: string): Promise<NearbyPoi[]> {
  const res = await withRetry(() =>
    supabase.from("property_poi").select("poi_id,dist_m").eq("property_id", id),
  );
  const links = rows<any>("property_poi", res);
  const pois = await loadPoisByIds(links.map((r) => Number(r.poi_id)));
  const poiById = new Map(pois.map((p) => [p.id, p]));
  return links
    .map((r) => {
      const poi = poiById.get(Number(r.poi_id));
      return poi ? { ...poi, distance: Number(r.dist_m) } : null;
    })
    .filter((p): p is NearbyPoi => p !== null)
    .sort((a, b) => a.distance - b.distance);
}

export function getPropertyPois(id: string): Promise<NearbyPoi[]> {
  return unstable_cache(() => loadPropertyPois(id), ["property-poi", id], {
    revalidate: REVALIDATE,
  })();
}

export type SearchHit = { id: string; score: number };

// Ranked hits plus a best-effort flag + message when part of the query (e.g. a
// place we couldn't match nearby) wasn't honoured.
export type SearchResult = { hits: SearchHit[]; fallback: boolean; fallbackNote: string | null };

async function loadCities(): Promise<string[]> {
  const res = await withRetry(() =>
    supabase.from("properties").select("city").eq("is_active", true),
  );
  return [
    ...new Set(
      rows<any>("cities", res)
        .map((r) => r.city)
        .filter(Boolean),
    ),
  ];
}
export const getCities = unstable_cache(loadCities, ["cities"], { revalidate: REVALIDATE });

const SEARCH_INSTRUCTION =
  "Given a Portuguese real-estate search, retrieve auction property listings that best match the described property type, location and characteristics.";
const RERANK_INSTRUCTION =
  "If the query names a property type, listings of that exact type must rank above any other type; each listing begins with its property type.";
const MIN_POOL = 10;
const RERANK_ACTIVATE = 0.5;
const RERANK_MIN = 0.3;

type Filters = {
  type: string | null;
  city: string | null;
  bedroomsMin: number | null;
  priceMax: number | null;
};
type PoolRow = { id: string; docText: string };

async function runHybrid(
  embedding: number[],
  normalized: string,
  f: Filters,
  matchCount = 60,
): Promise<PoolRow[]> {
  const res = await withRetry(() =>
    supabase.rpc("hybrid_search", {
      query_text: normalized,
      query_embedding: embedding,
      model_name: EMBEDDING_MODEL,
      match_count: matchCount,
      filter_type: f.type ?? undefined,
      filter_city: f.city ?? undefined,
      filter_bedrooms_min: f.bedroomsMin ?? undefined,
      filter_price_max: f.priceMax ?? undefined,
    }),
  );
  return rows<any>("hybrid_search", res).map((r) => ({
    id: String(r.property_id),
    docText: String(r.doc_text ?? ""),
  }));
}

// Recall rank normalized to [0,1] (top of the pool = 1) — the semantic term of
// the goal/POI blends.
function rankNorm(i: number, n: number): number {
  return n > 1 ? (n - 1 - i) / (n - 1) : 1;
}

// Re-rank by 0.4·recall + 0.6·(corpus percentile of the goal score).
function goalRerank(pool: PoolRow[], props: Property[], goal: GoalKey): SearchHit[] {
  const scoreOf = new Map(props.map((p) => [p.id, p.scores[goal]]));
  const values = props
    .map((p) => p.scores[goal])
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  const percentile = (v: number | null | undefined): number => {
    if (v == null || !values.length) return 0;
    let lo = 0;
    let hi = values.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (values[mid] <= v) lo = mid + 1;
      else hi = mid;
    }
    return lo / values.length;
  };

  const n = pool.length;
  return pool
    .map((p, i) => ({
      id: p.id,
      score: 0.4 * rankNorm(i, n) + 0.6 * percentile(scoreOf.get(p.id)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

// Acronyms whose POIs are stored spelled out (a name match on "ufms" misses
// "Universidade Federal de Mato Grosso do Sul"). Each entry expands to token
// sets; a name matches if it contains every token of a set.
const POI_ALIASES: Record<string, string[][]> = {
  ufms: [["universidade federal", "mato grosso do sul"]],
  ufgd: [["universidade federal", "grande dourados"]],
  uems: [["universidade estadual", "mato grosso do sul"]],
  ifms: [["instituto federal", "mato grosso do sul"]],
  ucdb: [["universidade catolica dom bosco"]],
  uniderp: [["uniderp"]],
};

// POIs whose name matches the query (with acronym aliases), narrowed by category
// (soft). Queried by name so the 236k-row table is never loaded into memory.
async function searchPoisByName(q: PoiQuery): Promise<Poi[]> {
  const name = normalize(q.name);
  const seen = new Map<number, Poi>();
  const run = async (build: () => PromiseLike<QueryResult<any>>) => {
    for (const p of rows<any>("pois-search", await withRetry(build)).map(mapPoi)) seen.set(p.id, p);
  };

  await run(() => supabase.from("pois").select(POI_FIELDS).ilike("name", `%${name}%`).limit(200));
  for (const set of POI_ALIASES[name] ?? []) {
    await run(() => {
      let b = supabase.from("pois").select(POI_FIELDS).not("name", "is", null).limit(200);
      for (const tok of set) b = b.ilike("name", `%${tok}%`);
      return b;
    });
  }

  const cands = [...seen.values()];
  if (q.category) {
    const byCat = cands.filter((p) => p.category === q.category);
    if (byCat.length) return byCat;
  }
  return cands;
}

const POI_NEAR_M = 5000;

// property_id → min dist_m over the given POIs (from property_poi, the same
// "nearby" source the detail page uses), within POI_NEAR_M.
async function nearestByPoi(poiIds: number[]): Promise<Map<string, number>> {
  if (!poiIds.length) return new Map();
  const res = await withRetry(() =>
    supabase
      .from("property_poi")
      .select("property_id,dist_m")
      .in("poi_id", poiIds)
      .lte("dist_m", POI_NEAR_M),
  );
  const near = new Map<string, number>();
  for (const r of rows<any>("property_poi", res)) {
    const id = String(r.property_id);
    const d = Number(r.dist_m);
    if (!near.has(id) || d < near.get(id)!) near.set(id, d);
  }
  return near;
}

// Re-rank by 0.4·recall + 0.6·exp(-dist/2500), keeping only pooled properties
// that list the POI among their precomputed neighbours.
function poiRerank(pool: PoolRow[], near: Map<string, number>): SearchHit[] {
  const n = pool.length;
  const hits: SearchHit[] = [];
  pool.forEach((p, i) => {
    const dist = near.get(p.id);
    if (dist == null) return;
    hits.push({ id: p.id, score: 0.4 * rankNorm(i, n) + 0.6 * Math.exp(-dist / 2500) });
  });
  return hits.sort((a, b) => b.score - a.score).slice(0, 20);
}

async function semanticRank(
  pool: PoolRow[],
  normalized: string,
  useType: boolean,
): Promise<SearchHit[]> {
  if (useType) {
    let scores: number[] | null = null;
    try {
      scores = await rerank(
        normalized,
        pool.map((p) => p.docText),
        RERANK_INSTRUCTION,
      );
    } catch {
      scores = null;
    }
    if (scores && Math.max(...scores) >= RERANK_ACTIVATE) {
      return pool
        .map((p, i) => ({ id: p.id, score: scores![i] ?? 0 }))
        .filter((h) => h.score >= RERANK_MIN)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);
    }
  }
  return pool.slice(0, 20).map((p, i) => ({ id: p.id, score: 1 - i / 20 }));
}

function poiPlaceLabel(poi: PoiQuery): string {
  return poi.name.length <= 5 && !poi.name.includes(" ")
    ? poi.name.toUpperCase()
    : titleCase(poi.name);
}

async function runHybridSearch(query: string): Promise<SearchResult> {
  const cities = await getCities();
  const facets = parseFacets(query, cities);
  const embedding = await embedQuery(facets.normalized, SEARCH_INSTRUCTION);

  return semanticCached<SearchResult>({
    namespace: "search",
    vector: embedding,
    text: facets.normalized,
    facets: {
      type: facets.type,
      city: facets.city,
      bedroomsMin: facets.bedroomsMin,
      priceMax: facets.priceMax,
      goal: facets.goal,
      poi: facets.poi ? `${facets.poi.name}|${facets.poi.category ?? ""}` : null,
    },
    isCacheable: (r) => r.hits.length > 0,
    compute: async () => {
      const ok = (hits: SearchHit[]): SearchResult => ({
        hits,
        fallback: false,
        fallbackNote: null,
      });
      const full: Filters = {
        type: facets.type,
        city: facets.city,
        bedroomsMin: facets.bedroomsMin,
        priceMax: facets.priceMax,
      };
      const hasExtra = !!facets.city || facets.bedroomsMin != null || facets.priceMax != null;
      const matchCount = facets.poi || facets.goal ? 200 : 60;

      let pool = await runHybrid(embedding, facets.normalized, full, matchCount);
      if (pool.length < MIN_POOL && facets.type && hasExtra) {
        pool = await runHybrid(embedding, facets.normalized, {
          type: facets.type,
          city: null,
          bedroomsMin: null,
          priceMax: null,
        });
      }
      if (pool.length < MIN_POOL && (facets.type || hasExtra)) {
        pool = await runHybrid(embedding, facets.normalized, {
          type: null,
          city: null,
          bedroomsMin: null,
          priceMax: null,
        });
      }
      if (!pool.length) return ok([]);

      if (facets.poi) {
        const cands = await searchPoisByName(facets.poi);
        const near = poiRerank(pool, await nearestByPoi(cands.map((p) => p.id)));
        if (near.length) return ok(near);
        return {
          hits: await semanticRank(pool, facets.normalized, !!facets.type),
          fallback: true,
          fallbackNote: `Não encontramos imóveis próximos a “${poiPlaceLabel(facets.poi)}”. Mostrando os resultados mais relevantes para o restante da sua busca.`,
        };
      }

      if (facets.goal) {
        const props = await getProperties();
        return ok(goalRerank(pool, props, facets.goal));
      }

      return ok(await semanticRank(pool, facets.normalized, !!facets.type));
    },
  });
}

export function hybridSearch(query: string): Promise<SearchResult> {
  return unstable_cache(() => runHybridSearch(query), ["hybrid-search", query], {
    revalidate: REVALIDATE,
  })();
}

export async function getRegion(h3: string): Promise<Region | null> {
  const all = await getRegions();
  return all.find((r) => r.h3 === h3) ?? null;
}
