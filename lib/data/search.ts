import { supabase } from "@/lib/supabase";
import { EMBEDDING_MODEL, embedQuery, rerank } from "@/lib/embed";
import {
  escapeLike,
  isPoiCategoryOnly,
  normalize,
  parseFacets,
  type Facets,
  type GoalKey,
  type PoiQuery,
} from "@/lib/facets";
import { semanticCached } from "@/lib/semanticCache";
import { titleCase } from "@/lib/format";
import type { Poi, Property } from "@/lib/types";
import { cached, rows, withRetry, type QueryResult } from "./client";
import {
  countProperties,
  getFilterOptions,
  getPropertiesByIds,
  getPropertiesPage,
  isListable,
} from "./propertyList";
import { mapPoi, POI_FIELDS } from "./pois";

export type SearchHit = { id: string; score: number };

// Ranked hits plus a best-effort flag + message when part of the query (e.g. a
// place we couldn't match nearby) wasn't honoured.
export type SearchResult = { hits: SearchHit[]; fallback: boolean; fallbackNote: string | null };

async function getCities(): Promise<string[]> {
  const { cities } = await getFilterOptions();
  return [...new Set(cities.map((c) => c.city).filter(Boolean))];
}

const SEARCH_INSTRUCTION =
  "Given a Portuguese real-estate search, retrieve auction property listings that best match the described property type, location and characteristics.";
const RERANK_INSTRUCTION =
  "If the query names a property type, listings of that exact type must rank above any other type; each listing begins with its property type.";
const MIN_POOL = 10;
export const RESULT_LIMIT = 20;
const RERANK_ACTIVATE = 0.5;
const RERANK_MIN = 0.3;
const POI_NEAR_M = 5000;

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
  const res = await withRetry(
    () =>
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
    // A timeout here means the query is too heavy, not that the DB is busy;
    // the widening cascade already re-issues it, so don't also retry-storm.
    { retryTimeouts: false },
  );
  return rows<any>("hybrid_search", res).map((r) => ({
    id: String(r.property_id),
    docText: String(r.doc_text ?? ""),
  }));
}

// Recall rank normalized to [0,1] (top of the pool = 1) - the semantic term of
// the goal/POI blends.
function rankNorm(i: number, n: number): number {
  return n > 1 ? (n - 1 - i) / (n - 1) : 1;
}

// Re-rank by 0.4·recall + 0.6·(corpus percentile of the goal score).
async function goalRerank(pool: PoolRow[], goal: GoalKey): Promise<SearchHit[]> {
  const res = await withRetry(() =>
    supabase.rpc("goal_percentiles", { p_goal: goal, p_ids: pool.map((p) => p.id) }),
  );
  const pct = new Map(
    rows<any>("goal_percentiles", res).map((r) => [String(r.property_id), Number(r.pct)]),
  );

  const n = pool.length;
  return pool
    .map((p, i) => ({
      id: p.id,
      score: 0.4 * rankNorm(i, n) + 0.6 * (pct.get(p.id) ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_LIMIT);
}

const POI_LIMIT = 200;

// resolve_pois handles accents, acronyms and same-named places (via city)
// server-side, so the frontend just relaxes its hints and reads the result.
async function searchPoisByName(q: PoiQuery, city: string | null): Promise<Poi[]> {
  const name = normalize(q.name);

  // Relax the guessed category first, then the city, keeping the strongest
  // disambiguating signal (the city) longest.
  const attempts: [string | null, string | null][] = [];
  for (const [cat, c] of [
    [q.category, city],
    [null, city],
    [q.category, null],
    [null, null],
  ] as const) {
    if (!attempts.some(([a, b]) => a === cat && b === c)) attempts.push([cat, c]);
  }

  let rpcErrored = false;
  for (const [cat, c] of attempts) {
    const res = await withRetry(() =>
      supabase.rpc("resolve_pois", {
        p_name: name,
        p_category: cat ?? undefined,
        p_city: c ?? undefined,
        p_limit: POI_LIMIT,
      }),
    );
    if (res.error) {
      rpcErrored = true;
      break;
    }
    const pois = rows<any>("resolve_pois", res).map(mapPoi);
    if (pois.length) return pois;
  }
  // Genuine miss (no error) → let the caller fall back to category/semantic.
  if (!rpcErrored) return [];

  // resolve_pois unavailable (e.g. mid-rollback): plain accent-stripped ILIKE.
  const res = await withRetry(() =>
    supabase
      .from("pois")
      .select(POI_FIELDS)
      .ilike("name", `%${escapeLike(name)}%`)
      .limit(POI_LIMIT),
  );
  const pois = rows<any>("pois-search", res).map(mapPoi);
  if (q.category) {
    const byCat = pois.filter((p) => p.category === q.category);
    if (byCat.length) return byCat;
  }
  return pois;
}

const CATEGORY_LIMIT = 200;
const CENTER_LADDER = [1000, 2000, 5000, 15000];
const POI_LADDER = [500, 1000, 2000, POI_NEAR_M];

function proximityFilters(facets: Facets) {
  return {
    type: facets.type ?? undefined,
    city: facets.city ?? undefined,
    minBedrooms: facets.bedroomsMin ?? undefined,
    maxPrice: facets.priceMax ?? undefined,
  };
}

// The page is capped at CATEGORY_LIMIT and ordered by discount, so a wide radius
// makes it a sample of the whole city. Tighten until the eligible set fits.
async function tightestRadius(
  ladder: number[],
  filters: (r: number) => Parameters<typeof countProperties>[0],
): Promise<number> {
  const probes = ladder.slice(0, -1);
  const counts = await Promise.all(probes.map((r) => countProperties(filters(r))));
  const i = counts.findIndex((c) => c >= CATEGORY_LIMIT);
  return i === -1 ? ladder[ladder.length - 1] : probes[i];
}

// Closest to the centre wins, but not at any price: the very closest listings are
// materially worse deals, so distance and discount weigh the same.
async function centerProximityHits(facets: Facets): Promise<SearchHit[]> {
  const base = proximityFilters(facets);
  const radius = await tightestRadius(CENTER_LADDER, (maxCenterM) => ({ ...base, maxCenterM }));
  const { items } = await getPropertiesPage({
    filters: { ...base, maxCenterM: radius },
    sort: "desconto",
    pageSize: CATEGORY_LIMIT,
  });
  const scored = items
    .filter((p) => p.centerProximity != null)
    .map((p) => ({
      id: p.id,
      score:
        0.5 * (1 - Math.min(1, p.centerProximity! / radius)) +
        0.5 * Math.min(1, (p.discount ?? 0) / 90),
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, CATEGORY_LIMIT);
}

// 83-92% of the corpus is within 5 km of a school/hospital/supermarket, so the
// category filter alone is nearly a no-op: distance has to drive the ranking.
async function categoryProximityHits(facets: Facets): Promise<SearchHit[]> {
  const cat = facets.poi!.category!;
  const base = proximityFilters(facets);
  const radius = await tightestRadius(POI_LADDER, (poiRadiusM) => ({
    ...base,
    poiCats: [cat],
    poiRadiusM,
  }));
  const { items } = await getPropertiesPage({
    filters: { ...base, poiCats: [cat], poiRadiusM: radius },
    sort: "desconto",
    pageSize: CATEGORY_LIMIT,
  });
  // Copy: `items` may be a cached array.
  const ranked = [...items].sort(
    (a, b) => (a.nearestPoi[cat] ?? Infinity) - (b.nearestPoi[cat] ?? Infinity),
  );
  return ranked.map((p, i) => ({ id: p.id, score: 1 - i / Math.max(1, ranked.length) }));
}

// property_id → distance to the nearest of the given POIs, within POI_NEAR_M,
// via the spatial properties_near_pois RPC.
async function nearestByPoi(poiIds: number[]): Promise<Map<string, number>> {
  if (!poiIds.length) return new Map();
  const res = await withRetry(() =>
    supabase.rpc("properties_near_pois", { p_poi_ids: poiIds, p_radius_m: POI_NEAR_M }),
  );
  const near = new Map<string, number>();
  for (const r of rows<any>("properties_near_pois", res)) {
    const id = String(r.property_id);
    const d = Number(r.dist_m);
    if (!near.has(id) || d < near.get(id)!) near.set(id, d);
  }
  return near;
}

// The facets the RPC branches apply as filters, applied here in memory.
function matchesFacets(p: Property, facets: Facets): boolean {
  return (
    isListable(p) &&
    (!facets.type || p.propertyType === facets.type) &&
    (!facets.city || normalize(p.city) === normalize(facets.city)) &&
    (facets.bedroomsMin == null || (p.bedrooms ?? 0) >= facets.bedroomsMin) &&
    (facets.priceMax == null || (p.saleValue ?? Infinity) <= facets.priceMax)
  );
}

// All properties near the resolved POIs, distance-ranked - not gated by the pool.
async function nearProximityHits(near: Map<string, number>, facets: Facets): Promise<SearchHit[]> {
  const ids = [...near.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 500)
    .map(([id]) => id);
  const props = await getPropertiesByIds(ids);
  const ranked = props
    .filter((p) => matchesFacets(p, facets))
    .sort((a, b) => (near.get(a.id) ?? Infinity) - (near.get(b.id) ?? Infinity))
    .slice(0, CATEGORY_LIMIT);
  return ranked.map((p, i) => ({ id: p.id, score: 1 - i / Math.max(1, ranked.length) }));
}

async function semanticRank(pool: PoolRow[], normalized: string, useType: boolean) {
  if (useType) {
    const scores = await rerankScores(pool, normalized);
    if (scores && Math.max(...scores) >= RERANK_ACTIVATE) {
      return pool
        .map((p, i) => ({ id: p.id, score: scores[i] ?? 0 }))
        .filter((h) => h.score >= RERANK_MIN)
        .sort((a, b) => b.score - a.score)
        .slice(0, RESULT_LIMIT);
    }
  }
  return pool.slice(0, RESULT_LIMIT).map((p, i) => ({ id: p.id, score: 1 - i / RESULT_LIMIT }));
}

async function rerankScores(pool: PoolRow[], normalized: string): Promise<number[] | null> {
  try {
    return await rerank(
      normalized,
      pool.map((p) => p.docText),
      RERANK_INSTRUCTION,
    );
  } catch {
    return null;
  }
}

// The reranker can't reliably tell gibberish from a niche-but-real search, so a
// weak best match downgrades a no-facet result to "approximate", never to none.
async function looksIrrelevant(pool: PoolRow[], normalized: string): Promise<boolean> {
  const scores = await rerankScores(pool, normalized);
  return !!scores && Math.max(...scores) < RERANK_ACTIVATE;
}

// Exact matches lead even when the reranker disagrees - they are what was asked for.
function exactFirst(hits: SearchHit[], exact: Set<string>): SearchHit[] {
  if (!exact.size) return hits;
  return [...hits.filter((h) => exact.has(h.id)), ...hits.filter((h) => !exact.has(h.id))];
}

function poiPlaceLabel(poi: PoiQuery): string {
  return poi.name.length <= 5 && !poi.name.includes(" ")
    ? poi.name.toUpperCase()
    : titleCase(poi.name);
}

const proximity = (hits: SearchHit[]): SearchResult => ({
  hits,
  fallback: false,
  fallbackNote: null,
});

function noIntent(f: Facets): boolean {
  return !f.type && !f.city && !f.goal && !f.poi && f.bedroomsMin == null && f.priceMax == null;
}

// Names the constraints the widening step actually dropped, so the note can't
// blame the city when it was the price cap that gave way.
function relaxedNote(f: Facets, keptType: boolean): string {
  const dropped = [
    f.city && "cidade",
    f.priceMax != null && "preço máximo",
    f.bedroomsMin != null && "número de quartos",
    !keptType && f.type && "tipo de imóvel",
  ].filter(Boolean);

  if (!dropped.length) return "Poucos imóveis para esta busca. Incluímos resultados aproximados.";
  return `Poucos imóveis atendem a tudo que você pediu. Incluímos resultados fora de: ${dropped.join(", ")}.`;
}

const VAGUE_NOTE =
  "Não encontramos imóveis muito parecidos com a sua busca. Mostrando os mais próximos do que você descreveu.";

async function runHybridSearch(query: string): Promise<SearchResult> {
  const cities = await getCities();
  const facets = parseFacets(query, cities);

  // Proximity queries are filters (comprehensive), not ranked semantic searches.
  if (facets.center) {
    return proximity(await centerProximityHits(facets));
  }
  if (facets.poi?.category && isPoiCategoryOnly(facets.poi.name)) {
    return proximity(await categoryProximityHits(facets));
  }

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
      poi: facets.poi ? `${facets.poi.fullName}|${facets.poi.category ?? ""}` : null,
    },
    isCacheable: (r) => r.hits.length > 0,
    compute: async () => {
      const full: Filters = {
        type: facets.type,
        city: facets.city,
        bedroomsMin: facets.bedroomsMin,
        priceMax: facets.priceMax,
      };
      const hasExtra = !!facets.city || facets.bedroomsMin != null || facets.priceMax != null;
      const matchCount = facets.poi || facets.goal ? 200 : 60;

      // A goal query is re-ranked entirely by the goal score, so the FTS arm is
      // wasted work - and the goal word ("liquidez") only matches score-explanation
      // text anyway. Skip it: the embedding alone gives the candidate pool.
      const poolText = facets.goal ? "" : facets.lexical;

      // Pool building relaxes the query text first and the filters only after,
      // and never drops what it already found: results matching every stated
      // constraint stay in, ahead of the widened ones.
      const pool: PoolRow[] = [];
      const seen = new Set<string>();
      const add = (batch: PoolRow[]) => {
        for (const r of batch) {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            pool.push(r);
          }
        }
      };

      add(await runHybrid(embedding, poolText, full, matchCount));
      if (pool.length < MIN_POOL && facets.lexicalCore && facets.lexicalCore !== poolText) {
        add(await runHybrid(embedding, facets.lexicalCore, full, matchCount));
      }
      const exact = new Set(seen);
      let keptType = true;

      if (pool.length < MIN_POOL && facets.type && hasExtra) {
        add(
          await runHybrid(
            embedding,
            poolText,
            { type: facets.type, city: null, bedroomsMin: null, priceMax: null },
            matchCount,
          ),
        );
      }
      if (pool.length < MIN_POOL && (facets.type || hasExtra)) {
        const before = pool.length;
        add(
          await runHybrid(
            embedding,
            poolText,
            { type: null, city: null, bedroomsMin: null, priceMax: null },
            matchCount,
          ),
        );
        keptType = pool.length === before;
      }
      if (!pool.length) return proximity([]);

      const widened = pool.length > exact.size;
      const ok = (hits: SearchHit[]): SearchResult => ({
        hits: exactFirst(hits, exact),
        fallback: widened,
        fallbackNote: widened ? relaxedNote(facets, keptType) : null,
      });

      if (facets.poi) {
        const cands = await searchPoisByName(facets.poi, facets.city);
        const near = await nearestByPoi(cands.map((p) => p.id));
        if (near.size) {
          const hits = await nearProximityHits(near, facets);
          if (hits.length) return proximity(hits);
        }
        // The place didn't resolve, but "perto de um hospital" still does.
        if (facets.poi.category) {
          const hits = await categoryProximityHits(facets);
          if (hits.length) return proximity(hits);
        }
        return {
          hits: await semanticRank(pool, facets.normalized, !!facets.type),
          fallback: true,
          fallbackNote: `Não encontramos imóveis próximos a “${poiPlaceLabel(facets.poi)}”. Mostrando os resultados mais relevantes para o restante da sua busca.`,
        };
      }

      if (facets.goal) return ok(await goalRerank(pool, facets.goal));

      const hits = await semanticRank(pool, facets.normalized, !!facets.type);
      if (!widened && noIntent(facets) && (await looksIrrelevant(pool, facets.normalized))) {
        return { hits, fallback: true, fallbackNote: VAGUE_NOTE };
      }
      return ok(hits);
    },
  });
}

export const hybridSearch = cached(runHybridSearch, "hybrid-search");
