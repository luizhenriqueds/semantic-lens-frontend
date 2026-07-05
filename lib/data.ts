import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { analyzeDeeds, EMBEDDING_MODEL, embedQuery, rerank } from "@/lib/embed";
import { parseFacets } from "@/lib/facets";
import { semanticCached } from "@/lib/semanticCache";
import { deriveTitle, titleCase } from "@/lib/format";
import type {
  Cluster,
  MarketHistoryPoint,
  MarketStats,
  Poi,
  PriceHistoryPoint,
  ProfileKey,
  Property,
  Recommendation,
  Region,
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

function pickImage(p: {
  image_source_url?: string | null;
  image_path?: string | null;
}): string | null {
  if (p.image_source_url) return p.image_source_url;
  if (p.image_path && p.image_path.startsWith("http")) return p.image_path;
  return null;
}

function pickDeed(p: {
  deed_source_url?: string | null;
  deed_path?: string | null;
}): string | null {
  if (p.deed_source_url) return p.deed_source_url; // CAIXA-hosted matrícula PDF
  if (p.deed_path && p.deed_path.startsWith("http")) return p.deed_path;
  return null;
}

function parseVisualDetails(v: unknown): Property["visualDetails"] {
  if (!v || typeof v !== "object") return null;
  const d = v as Record<string, unknown>;
  return {
    note: typeof d.note === "string" ? d.note : null,
    facade: num(d.facade),
    standard: num(d.standard),
    condition: num(d.condition),
    surroundings: num(d.surroundings),
    needsRenovation: d.needs_renovation === true,
    isPropertyPhoto: d.is_property_photo === true,
  };
}

async function loadProperties(): Promise<Property[]> {
  const [propsRes, listingsRes, scoresRes, profilesRes, pclRes, clustersRes] = await Promise.all([
    withRetry(() =>
      supabase
        .from("properties")
        .select(
          "property_id,property_type,uf,city,neighborhood,area_m2,bedrooms,parking_spots,year_built,occupancy_status,canonical_description,h3_r8,image_path,image_source_url,deed_path,deed_source_url,lat,lon,is_active,visual_score,visual_details,price_rank,size_rank",
        ),
    ),
    withRetry(() =>
      supabase
        .from("listings")
        .select(
          "property_id,appraised_value,sale_value,discount,modality,auction_date,link,snapshot_date,accepts_financing,accepts_fgts",
        ),
    ),
    withRetry(() =>
      supabase
        .from("property_scores")
        .select(
          "property_id,flip,liquidity,airbnb,student,family,commercial,convenience,investment",
        )
        .eq("score_version", 1),
    ),
    withRetry(() =>
      supabase
        .from("property_profiles")
        .select("property_id,profile,score,is_primary")
        .eq("is_primary", true),
    ),
    withRetry(() =>
      supabase
        .from("property_clusters")
        .select("property_id,cluster_id")
        .eq("cluster_run_id", CLUSTER_RUN),
    ),
    withRetry(() =>
      supabase
        .from("clusters")
        .select("cluster_id,label,profile")
        .eq("cluster_run_id", CLUSTER_RUN),
    ),
  ]);

  const props = rows("properties", propsRes);
  const listingMap = new Map<string, any>();
  for (const l of rows<any>("listings", listingsRes)) {
    const cur = listingMap.get(l.property_id);
    if (!cur || (l.snapshot_date ?? "") > (cur.snapshot_date ?? "")) {
      listingMap.set(l.property_id, l);
    }
  }
  const scoreMap = new Map(rows<any>("property_scores", scoresRes).map((s) => [s.property_id, s]));
  const profileMap = new Map(
    rows<any>("property_profiles", profilesRes).map((p) => [p.property_id, p]),
  );
  const pclMap = new Map(
    rows<any>("property_clusters", pclRes).map((c) => [c.property_id, c.cluster_id]),
  );
  const clusterMap = new Map(rows<any>("clusters", clustersRes).map((c) => [c.cluster_id, c]));

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
      area: num(p.area_m2),
      bedrooms: num(p.bedrooms),
      parkingSpots: num(p.parking_spots),
      yearBuilt: num(p.year_built),
      occupancyStatus: p.occupancy_status || null,
      title: deriveTitle(p.property_type ?? "Imóvel", num(p.bedrooms), p.neighborhood ?? ""),
      description: p.canonical_description || null,
      image: pickImage(p),
      deed: pickDeed(p),
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
      visualDetails: parseVisualDetails(p.visual_details),
      priceRank: num(p.price_rank),
      sizeRank: num(p.size_rank),
    };
  });
}

async function loadPois(): Promise<Poi[]> {
  // ~3k rows for the whole coverage area — cheap to load once and filter by
  // distance in JS when a property page needs its neighbours.
  const res = await withRetry(() =>
    supabase
      .from("pois")
      .select("id,category,name,lat,lon")
      .not("lat", "is", null)
      .not("lon", "is", null),
  );
  return rows<any>("pois", res).map((r) => ({
    id: r.id,
    category: r.category ?? "",
    name: r.name || null,
    lat: Number(r.lat),
    lon: Number(r.lon),
  }));
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
  const [cellsRes, scoresRes, dnaRes, featuresRes, neighborsRes] = await Promise.all([
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
  ]);

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

  return cells
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
        numProps: c.num_properties ?? 0,
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
export const getPois = unstable_cache(loadPois, ["pois"], {
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

export type SearchHit = { id: string; score: number };

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

async function runHybrid(embedding: number[], normalized: string, f: Filters): Promise<PoolRow[]> {
  const res = await withRetry(() =>
    supabase.rpc("hybrid_search", {
      query_text: normalized,
      query_embedding: embedding,
      model_name: EMBEDDING_MODEL,
      match_count: 60,
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

async function runHybridSearch(query: string): Promise<SearchHit[]> {
  const cities = await getCities();
  const facets = parseFacets(query, cities);
  const embedding = await embedQuery(facets.normalized, SEARCH_INSTRUCTION);

  return semanticCached<SearchHit[]>({
    namespace: "search",
    vector: embedding,
    text: facets.normalized,
    facets: {
      type: facets.type,
      city: facets.city,
      bedroomsMin: facets.bedroomsMin,
      priceMax: facets.priceMax,
    },
    isCacheable: (r) => r.length > 0,
    compute: async () => {
      const full: Filters = {
        type: facets.type,
        city: facets.city,
        bedroomsMin: facets.bedroomsMin,
        priceMax: facets.priceMax,
      };
      const hasExtra = !!facets.city || facets.bedroomsMin != null || facets.priceMax != null;

      let pool = await runHybrid(embedding, facets.normalized, full);
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
      if (!pool.length) return [];

      // The reranker reads only the physical doc_text, so it only helps type/keyword
      // queries; for objective queries (flip, family, revenda — encoded in the
      // embedding) it scores ~0 and we'd discard it, so skip the call entirely.
      if (facets.type) {
        let scores: number[] | null = null;
        try {
          scores = await rerank(
            facets.normalized,
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
    },
  });
}

export function hybridSearch(query: string): Promise<SearchHit[]> {
  return unstable_cache(() => runHybridSearch(query), ["hybrid-search", query], {
    revalidate: REVALIDATE,
  })();
}

export type DeedResult = { id: string; excerpt: string; relevance: number; reason: string };

const DEED_INSTRUCTION =
  "Analise matrículas de imóveis como documentos jurídicos. Recupere matrículas em que a condição, gravame, ônus ou restrição descrita na consulta realmente se aplica ao imóvel, considerando negações, baixas e cancelamentos.";

async function runDeedSearch(query: string): Promise<DeedResult[]> {
  const embedding = await embedQuery(query, DEED_INSTRUCTION);

  return semanticCached<DeedResult[]>({
    namespace: "deed",
    vector: embedding,
    text: query,
    facets: {},
    isCacheable: (r) => r.length > 0,
    compute: async () => {
      const res = await withRetry(() =>
        supabase.rpc("hybrid_deed_search", {
          query_text: query,
          query_embedding: embedding,
          model_name: EMBEDDING_MODEL,
          match_count: 40,
          full_text_weight: 0.3,
          semantic_weight: 1.0,
        }),
      );
      const candidates = rows<any>("hybrid_deed_search", res)
        .map((r) => ({ id: String(r.property_id), text: String(r.deed_text ?? "") }))
        .slice(0, 12);
      if (!candidates.length) return [];

      const verdicts = await analyzeDeeds(
        query,
        candidates.map((c) => c.text),
      );
      const byIndex = new Map(verdicts.map((v) => [v.index, v]));
      return candidates
        .map((c, i) => ({ candidate: c, verdict: byIndex.get(i) }))
        .filter(({ verdict }) => verdict?.matches !== false)
        .map(({ candidate, verdict }) => ({
          id: candidate.id,
          excerpt: candidate.text,
          relevance: verdict?.relevance ?? 50,
          reason: verdict?.reason ?? "",
        }))
        .sort((a, b) => b.relevance - a.relevance);
    },
  });
}

export function deedSearch(query: string): Promise<DeedResult[]> {
  return unstable_cache(() => runDeedSearch(query), ["deed-search", query], {
    revalidate: REVALIDATE,
  })();
}

export async function getRegion(h3: string): Promise<Region | null> {
  const all = await getRegions();
  return all.find((r) => r.h3 === h3) ?? null;
}
