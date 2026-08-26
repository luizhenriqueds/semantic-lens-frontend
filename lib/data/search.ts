import { supabase } from "@/lib/supabase";
import { EMBEDDING_MODEL, embedQuery, rerank } from "@/lib/embed";
import {
  canonicalQuery,
  escapeLike,
  FACET_LABEL,
  isPoiCategoryOnly,
  isPureGoal,
  isStructural,
  normalize,
  parseFacets,
  simplifyFacets,
  type Facets,
  type GoalKey,
  type PoiQuery,
} from "@/lib/facets";
import { semanticCached } from "@/lib/semanticCache";
import { requireQuota } from "@/lib/ratelimit/guards";
import { poiPlaceLabel } from "@/lib/pois";
import type { Poi, Property } from "@/lib/types";
import { cached, rows, SEARCH_REVALIDATE, ttlCached, withRetry } from "./client";
import {
  getFilterOptionsRaw,
  getGoalTop,
  getPropertiesByIds,
  getPropertiesPage,
  getStructuralList,
  isListable,
} from "./propertyList";
import { mapPoi, POI_FIELDS } from "./pois";

export type SearchHit = { id: string; score: number };

// Ranked hits plus a best-effort flag + message when part of the query (e.g. a
// place we couldn't match nearby) wasn't honoured.
export type SearchResult = {
  hits: SearchHit[];
  // Branches that rank from property rows hand them over instead of ids to re-fetch.
  items: Property[] | null;
  fallback: boolean;
  fallbackNote: string | null;
};

// A ranked slice plus the rows it was ranked from, in hit order.
type Ranked = { hits: SearchHit[]; items: Property[] };

const rank = (items: Property[], score: (p: Property, i: number) => number): Ranked => ({
  hits: items.map((p, i) => ({ id: p.id, score: score(p, i) })),
  items,
});

// Not `getFilterOptionsRaw()` directly: this runs nested inside `cachedSearch`'s unstable_cache
// (every search calls it), and unstable_cache skips the read when nested inside another
// unstable_cache. Without this, "five full scans of the MV" reran on every search.
const getCities = ttlCached(async () => {
  const { cities } = await getFilterOptionsRaw();
  const names = [...new Set(cities.map((c) => c.city).filter(Boolean))];
  // The catalogue already carries the uf, so parseFacets can read "corumba ms" as one place.
  const uf = new Map(cities.filter((c) => c.city && c.uf).map((c) => [normalize(c.city), c.uf]));
  return { names, uf };
}, 3600 * 1000);

const parse = async (query: string): Promise<Facets> => {
  const { names, uf } = await getCities();
  return parseFacets(query, names, uf);
};

export async function parseQuery(query: string): Promise<Facets> {
  return parse(canonicalQuery(query));
}

const SEARCH_INSTRUCTION =
  "Given a Portuguese real-estate search, retrieve auction property listings that best match the described property type, location and characteristics.";
// filter_type already guarantees type precedence, so the reranker is aimed at features instead.
const RERANK_INSTRUCTION =
  "Rank higher the listings that explicitly contain every feature, room count and amenity the query asks for. A listing that does not mention a requested feature does not have it.";
// Hybrid retrieval (embedding + reranker) is the default; ENABLE_HYBRID_SEARCH=0 falls back
// to ftsSearch below, trading semantic recall on paraphrases for two fewer inference hops.
const HYBRID_ENABLED = !["0", "false"].includes(
  (process.env.ENABLE_HYBRID_SEARCH ?? "").trim().toLowerCase(),
);

const MIN_POOL = 10;
// Matches the semantic pool, so the reranked path returns everything above the floor.
export const RESULT_LIMIT = 60;
const RERANK_ACTIVATE = 0.5;
// Relative, not absolute: the score scale swings by an order of magnitude between queries, so a
// fixed floor kept 60 results for one and 2 for another that had 31 genuine matches.
const RERANK_MIN_RATIO = 0.15;
const POI_NEAR_M = 5000;

type Filters = {
  type: string | null;
  city: string | null;
  bedroomsMin: number | null;
  parkingMin: number | null;
  bathroomsMin: number | null;
  priceMax: number | null;
};
type PoolRow = { id: string; docText: string };

// Distinguishes a failed pool query from a genuinely empty one: relaxing filters cannot help a
// query that timed out, and the cascade would just re-issue it.
class PoolError extends Error {}

const NO_FILTERS: Filters = {
  type: null,
  city: null,
  bedroomsMin: null,
  parkingMin: null,
  bathroomsMin: null,
  priceMax: null,
};

// A null embedding makes the RPC answer from full-text search alone.
async function runHybrid(
  embedding: number[] | null,
  normalized: string,
  f: Filters,
  matchCount = 60,
  withDocs = true,
): Promise<PoolRow[]> {
  const res = await withRetry(() => {
    const q = supabase.rpc("hybrid_search", {
      query_text: normalized,
      query_embedding: embedding,
      model_name: EMBEDDING_MODEL,
      match_count: matchCount,
      filter_type: f.type ?? undefined,
      filter_city: f.city ?? undefined,
      filter_bedrooms_min: f.bedroomsMin ?? undefined,
      filter_parking_min: f.parkingMin ?? undefined,
      filter_bathrooms_min: f.bathroomsMin ?? undefined,
      filter_price_max: f.priceMax ?? undefined,
    });
    // doc_text is ~1.3 KB a row and only the reranker reads it.
    return withDocs ? q : (q.select("property_id") as unknown as typeof q);
  });
  if (res.error) throw new PoolError(res.error.message);
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
const POI_FANOUT = 40;

// resolve_pois handles accents, acronyms and same-named places (via city)
// server-side, so the frontend just relaxes its hints and reads the result.
export async function searchPoisByName(q: PoiQuery, city: string | null): Promise<Poi[]> {
  const name = normalize(q.name);

  // The category is a pure conjunct in resolve_pois, so the uncategorised result is a superset of
  // the categorised one - derive it here rather than buy a second round trip. Only relaxing the
  // city costs one, and only when the city-scoped lookup came back empty.
  let rpcErrored = false;
  const attempt = async (c: string | null): Promise<Poi[] | null> => {
    const res = await withRetry(() =>
      supabase.rpc("resolve_pois", { p_name: name, p_city: c ?? undefined, p_limit: POI_LIMIT }),
    );
    if (res.error) {
      rpcErrored = true;
      return null;
    }
    const pois = rows<any>("resolve_pois", res).map(mapPoi);
    if (!pois.length) return null;
    const byCat = q.category ? pois.filter((p) => p.category === q.category) : [];
    return byCat.length ? byCat : pois;
  };

  for (const c of city ? [city, null] : [null]) {
    const pois = await attempt(c);
    if (pois) return pois;
    if (rpcErrored) break;
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

// The centre page is capped at CATEGORY_LIMIT and ordered by discount, so a wide radius makes it a
// sample of the whole city. Tighten until the eligible set fits.
const CATEGORY_LIMIT = 200;
const CENTER_LADDER = [1000, 2000, 5000, 15000];

function proximityFilters(facets: Facets) {
  return {
    type: facets.type ?? undefined,
    city: facets.city ?? undefined,
    minBedrooms: facets.bedroomsMin ?? undefined,
    maxPrice: facets.priceMax ?? undefined,
  };
}

// Closest to the centre wins, but not at any price: the very closest listings are
// materially worse deals, so distance and discount weigh the same.
async function centerProximityHits(facets: Facets): Promise<Ranked> {
  const base = proximityFilters(facets);
  // Walked with the page itself: `total` is the same count(*) separate probes were buying, so the
  // dense case picks the same rung in one read instead of four.
  let radius = CENTER_LADDER[CENTER_LADDER.length - 1];
  let items: Property[] = [];
  for (const r of CENTER_LADDER) {
    const page = await getPropertiesPage({
      filters: { ...base, maxCenterM: r },
      sort: "desconto",
      pageSize: CATEGORY_LIMIT,
    });
    radius = r;
    items = page.items;
    if (page.total >= CATEGORY_LIMIT) break;
  }
  const score = (p: Property) =>
    0.5 * (1 - Math.min(1, p.centerProximity! / radius)) +
    0.5 * Math.min(1, (p.discount ?? 0) / 90);
  const ranked = items
    .filter((p) => p.centerProximity != null)
    .sort((a, b) => score(b) - score(a))
    .slice(0, RESULT_LIMIT);
  return rank(ranked, score);
}

// 83-92% of the corpus is within 5 km of a school/hospital/supermarket, so the category filter
// alone is nearly a no-op: distance has to drive the ranking. `proximidade` does that server-side,
// which leaves one page as the whole answer. `poiRadiusM` is explicit - toRpcFilters would
// otherwise default it to a tighter 2 km.
async function categoryProximityHits(facets: Facets): Promise<Ranked> {
  const cat = facets.poi!.category!;
  const { items } = await getPropertiesPage({
    filters: { ...proximityFilters(facets), poiCats: [cat], poiRadiusM: POI_NEAR_M },
    sort: "proximidade",
    pageSize: RESULT_LIMIT,
  });
  return rank(items, (_p, i) => 1 - i / Math.max(1, items.length));
}

// property_id → distance to the nearest of the given POIs, within POI_NEAR_M,
// via the spatial properties_near_pois RPC.
async function nearestByPoi(poiIds: number[]): Promise<Map<string, number>> {
  if (!poiIds.length) return new Map();
  // The RPC has no limit of its own, and the caller discards everything past NEAR_SCAN anyway.
  const res = await withRetry(() =>
    supabase
      .rpc("properties_near_pois", { p_poi_ids: poiIds, p_radius_m: POI_NEAR_M })
      .order("dist_m", { ascending: true })
      .limit(NEAR_SCAN),
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
    (facets.parkingMin == null || (p.parkingSpots ?? 0) >= facets.parkingMin) &&
    (facets.priceMax == null || (p.saleValue ?? Infinity) <= facets.priceMax)
  );
}

const NEAR_SCAN = 500;
const NEAR_BATCH = 200;

// All properties near the resolved POIs, distance-ranked - not gated by the pool.
// Walked in distance order, so a later batch can never displace an earlier
// survivor: same list as the full 500-id scan, usually in one round trip.
async function nearProximityHits(near: Map<string, number>, facets: Facets): Promise<Ranked> {
  const ids = [...near.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, NEAR_SCAN)
    .map(([id]) => id);

  const found: Property[] = [];
  for (let i = 0; i < ids.length && found.length < RESULT_LIMIT; i += NEAR_BATCH) {
    const props = await getPropertiesByIds(ids.slice(i, i + NEAR_BATCH));
    found.push(
      ...props
        .filter((p) => matchesFacets(p, facets))
        .sort((a, b) => (near.get(a.id) ?? Infinity) - (near.get(b.id) ?? Infinity)),
    );
  }
  const ranked = found.slice(0, RESULT_LIMIT);
  return rank(ranked, (_p, i) => 1 - i / Math.max(1, ranked.length));
}

// A weak best match means the reranker found nothing it recognises, so recall order stands.
function rankBy(pool: PoolRow[], scores: number[] | null): SearchHit[] {
  const top = scores?.length ? Math.max(...scores) : 0;
  if (scores && top >= RERANK_ACTIVATE) {
    return pool
      .map((p, i) => ({ id: p.id, score: scores[i] ?? 0 }))
      .filter((h) => h.score >= top * RERANK_MIN_RATIO)
      .sort((a, b) => b.score - a.score)
      .slice(0, RESULT_LIMIT);
  }
  return pool.slice(0, RESULT_LIMIT).map((p, i) => ({ id: p.id, score: 1 - i / RESULT_LIMIT }));
}

async function semanticRank(pool: PoolRow[], normalized: string, useType: boolean) {
  return rankBy(pool, useType ? await rerankScores(pool, normalized) : null);
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

// Exact matches lead even when the reranker disagrees - they are what was asked for.
function exactFirst(hits: SearchHit[], exact: Set<string>): SearchHit[] {
  if (!exact.size) return hits;
  return [...hits.filter((h) => exact.has(h.id)), ...hits.filter((h) => !exact.has(h.id))];
}

const EMPTY: SearchResult = { hits: [], items: [], fallback: false, fallbackNote: null };

const proximity = (r: Ranked): SearchResult => ({
  hits: r.hits,
  items: r.items,
  fallback: false,
  fallbackNote: null,
});

function noIntent(f: Facets): boolean {
  return (
    !f.type &&
    !f.city &&
    !f.goal &&
    !f.poi &&
    f.bedroomsMin == null &&
    f.parkingMin == null &&
    f.bathroomsMin == null &&
    f.priceMax == null
  );
}

/** "a, b e c" - a note should read as a sentence, not as a list of keys. */
function listPt(parts: string[]): string {
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

// Names the constraints the widening step actually dropped, so the note can't
// blame the city when it was the price cap that gave way.
function relaxedNote(f: Facets, keptType: boolean): string {
  const dropped = [
    f.city && FACET_LABEL.city,
    f.priceMax != null && FACET_LABEL.priceMax,
    f.bedroomsMin != null && FACET_LABEL.bedroomsMin,
    f.parkingMin != null && FACET_LABEL.parkingMin,
    f.bathroomsMin != null && FACET_LABEL.bathroomsMin,
    !keptType && f.type && FACET_LABEL.type,
  ].filter((s): s is string => Boolean(s));

  if (!dropped.length) return "Poucos imóveis para esta busca. Incluímos resultados aproximados.";
  return `Poucos imóveis atendem a tudo que você pediu. Incluímos resultados fora de: ${listPt(dropped)}.`;
}

const VAGUE_NOTE =
  "Não encontramos imóveis muito parecidos com a sua busca. Mostrando os mais próximos do que você descreveu.";

// Probed in parallel, so extra rungs cost no wall-clock - they just widen the range of facet
// combinations that find a workable floor instead of falling through to the pool.
// 1, not 0: toRpcFilters drops scoreMin on a falsy check, so 0 would mean no floor at all.
// property_goal_pct holds the percentiles precomputed, so this is one ordered read.
// Null when nothing matched - or when the read failed - so the caller can fall through the rest.
async function goalDirectHits(facets: Facets): Promise<Ranked | null> {
  const found = await getGoalTop(facets.goal!, proximityFilters(facets), RESULT_LIMIT).catch(
    () => [],
  );
  const items = found.filter(isListable);
  if (!items.length) return null;
  return rank(items, (_p, i) => 1 - i / items.length);
}

// Null when nothing matched - or when the read failed - so the caller can still widen through FTS.
async function structuralHits(facets: Facets): Promise<Ranked | null> {
  const found = await getStructuralList(
    { ...proximityFilters(facets), minParking: facets.parkingMin ?? undefined },
    RESULT_LIMIT,
  ).catch(() => []);
  if (!found.length) return null;
  return rank(found, (_p, i) => 1 - i / found.length);
}

// Answers from the spatial index alone. Null = didn't resolve.
async function poiProximityHits(facets: Facets): Promise<Ranked | null> {
  const cands = await searchPoisByName(facets.poi!, facets.city);
  // A generic name ("praia") matches hundreds of places and the spatial join is per-POI.
  // resolve_pois orders by name similarity, so the head is the closest-named set.
  const near = await nearestByPoi(cands.slice(0, POI_FANOUT).map((p) => p.id));
  if (near.size) {
    const r = await nearProximityHits(near, facets);
    if (r.hits.length) return r;
  }
  // The place didn't resolve, but "perto de um hospital" still does.
  if (facets.poi!.category) {
    const r = await categoryProximityHits(facets);
    if (r.hits.length) return r;
  }
  return null;
}

type BuiltPool = {
  pool: PoolRow[];
  exact: Set<string>;
  keptType: boolean;
  widened: boolean;
  withDocs: boolean;
};

// Relaxes the query text first and the filters only after, and never drops what it already
// found: results matching every stated constraint stay in, ahead of the widened ones.
async function buildPool(embedding: number[] | null, facets: Facets): Promise<BuiltPool> {
  const full: Filters = {
    type: facets.type,
    city: facets.city,
    bedroomsMin: facets.bedroomsMin,
    parkingMin: facets.parkingMin,
    bathroomsMin: facets.bathroomsMin,
    priceMax: facets.priceMax,
  };
  const hasExtra =
    !!facets.city ||
    facets.bedroomsMin != null ||
    facets.parkingMin != null ||
    facets.bathroomsMin != null ||
    facets.priceMax != null;
  // Only the goal blend ranks off the whole pool and so needs a deep one.
  const matchCount = facets.goal ? 200 : 60;

  // A goal query is re-ranked entirely by the goal score, so the FTS arm is wasted work -
  // and the goal word ("liquidez") only matches score-explanation text anyway. Skip it: the
  // embedding alone gives the candidate pool. Without an embedding the text is all there is.
  const poolText = facets.goal && embedding ? "" : facets.lexical;

  // Only the branches that re-rank on the row text pay for it.
  const withDocs = embedding
    ? facets.poi
      ? !!facets.type
      : !facets.goal && (!!facets.type || noIntent(facets))
    : !facets.goal;

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

  add(await runHybrid(embedding, poolText, full, matchCount, withDocs));

  // Past this point the pool is usable; a failed widening step just means it stays narrow.
  const probe = async (text: string, f: Filters): Promise<PoolRow[]> => {
    try {
      return await runHybrid(embedding, text, f, matchCount, withDocs);
    } catch (err) {
      if (err instanceof PoolError) return [];
      throw err;
    }
  };

  // The text arm ranks but never gates, so a short pool means the filters exhausted the corpus
  // and only a rung that drops one can help. The two filtered rungs are probed together; the
  // unfiltered one scans the whole corpus, so it stays behind its guard.
  const [core, byType] =
    pool.length < MIN_POOL
      ? await Promise.all([
          facets.lexicalCore && facets.lexicalCore !== poolText
            ? probe(facets.lexicalCore, full)
            : null,
          facets.type && hasExtra ? probe(poolText, { ...NO_FILTERS, type: facets.type }) : null,
        ])
      : [null, null];

  if (core) add(core);
  const exact = new Set(seen);
  let keptType = true;

  if (byType && pool.length < MIN_POOL) add(byType);
  // Not for a POI query: that caller reads only `pool` and writes its own note, so the corpus-wide
  // rung buys nothing but noisier reranker input.
  if (pool.length < MIN_POOL && !facets.poi && (facets.type || hasExtra)) {
    const before = pool.length;
    add(await probe(poolText, NO_FILTERS));
    keptType = pool.length === before;
  }

  return { pool, exact, keptType, widened: pool.length > exact.size, withDocs };
}

// A ranked slice of a pool, carrying that pool's widening state into the result.
function pooled(
  built: BuiltPool,
  facets: Facets,
  hits: SearchHit[],
  items: Property[] | null = null,
): SearchResult {
  return {
    hits: exactFirst(hits, built.exact),
    items,
    fallback: built.widened,
    fallbackNote: built.widened ? relaxedNote(facets, built.keptType) : null,
  };
}

// Short tokens are filler and would flatten the coverage term.
const COVERAGE_MIN_LEN = 4;

// Stand-in for the cross-encoder when it is off: how much of what was asked for the listing
// text actually mentions. Free - the rows are already in memory.
function lexicalRank(pool: PoolRow[], facets: Facets): SearchHit[] {
  const terms = [
    ...new Set(
      normalize(facets.lexical)
        .split(" ")
        .filter((t) => t.length >= COVERAGE_MIN_LEN),
    ),
  ];
  const n = pool.length;
  return pool
    .map((p, i) => {
      const doc = normalize(p.docText);
      const hit = terms.length ? terms.filter((t) => doc.includes(t)).length / terms.length : 0;
      return { id: p.id, score: 0.65 * rankNorm(i, n) + 0.35 * hit };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_LIMIT);
}

// Full-text only: no embedding, no reranker, no semantic cache. The facet parser still
// supplies the hard filters, so type/city/bedroom precision is unaffected.
async function ftsSearch(facets: Facets): Promise<SearchResult> {
  const built = await buildPool(null, facets);
  if (!built.pool.length) return EMPTY;
  const hits = facets.goal
    ? await goalRerank(built.pool, facets.goal)
    : lexicalRank(built.pool, facets);
  return pooled(built, facets, hits);
}

const SIMPLIFIED_NOTE = (dropped: string[]) =>
  `Mostramos resultados sem ${listPt(dropped)} que você pediu.`;

// Nothing an embedding or a pool could match, so neither is worth buying.
const searchable = (f: Facets): boolean =>
  (f.normalized.match(/\p{L}/gu) ?? []).length >= 2 &&
  f.lexical.split(" ").some((t) => t.length >= 2);

async function runHybridSearch(query: string): Promise<SearchResult> {
  const { facets, dropped } = simplifyFacets(await parse(query));
  if (!searchable(facets)) return EMPTY;
  const res = await runBranches(facets);
  if (!dropped.length) return res;
  return { ...res, fallback: true, fallbackNote: SIMPLIFIED_NOTE(dropped) };
}

async function runBranches(facets: Facets): Promise<SearchResult> {
  // Proximity queries are filters (comprehensive), not ranked semantic searches.
  if (facets.center) {
    return proximity(await centerProximityHits(facets));
  }
  if (facets.poi?.category && isPoiCategoryOnly(facets.poi.name)) {
    return proximity(await categoryProximityHits(facets));
  }
  // Both resolve without a vector, so they run before the embedding.
  if (facets.poi) {
    const r = await poiProximityHits(facets);
    if (r) return proximity(r);
  }
  if (isPureGoal(facets)) {
    const r = await goalDirectHits(facets);
    if (r) return proximity(r);
  }

  // Hard filters answer it outright; never worth an embedding or a cross-encoder pass.
  if (isStructural(facets)) {
    const r = await structuralHits(facets);
    return r ? proximity(r) : ftsSearch(facets);
  }

  if (!HYBRID_ENABLED) return ftsSearch(facets);

  const embedding = await embedQuery(facets.normalized, SEARCH_INSTRUCTION);

  return semanticCached<SearchResult>({
    namespace: "search",
    vector: embedding,
    text: facets.normalized,
    facets: {
      type: facets.type,
      city: facets.city,
      bedroomsMin: facets.bedroomsMin,
      parkingMin: facets.parkingMin,
      bathroomsMin: facets.bathroomsMin,
      priceMax: facets.priceMax,
      goal: facets.goal,
      poi: facets.poi ? `${facets.poi.fullName}|${facets.poi.category ?? ""}` : null,
    },
    isCacheable: (r) => r.hits.length > 0,
    // The rows come back from their own cache on a hit; keeping them here would blow the 48 KB
    // metadata cap and silently disable the whole layer.
    toCache: (r) => ({ ...r, items: null }),
    compute: async () => {
      // Only reached when the place didn't resolve - the spatial branch already ran.
      if (facets.poi) {
        const { pool } = await buildPool(embedding, facets);
        if (!pool.length) return EMPTY;
        return {
          hits: await semanticRank(pool, facets.normalized, !!facets.type),
          items: null,
          fallback: true,
          fallbackNote: `Não encontramos imóveis próximos a “${poiPlaceLabel(facets.poi.name)}”. Mostrando os resultados mais relevantes para o restante da sua busca.`,
        };
      }

      const built = await buildPool(embedding, facets);
      const { pool, widened, withDocs } = built;
      if (!pool.length) return EMPTY;

      if (facets.goal) return pooled(built, facets, await goalRerank(pool, facets.goal));

      // One rerank call serves both the ranking and the "too vague" check. The rows are read
      // alongside it: the pool ids are known already, so that read costs no wall clock.
      const [scores, props] = await Promise.all([
        withDocs ? rerankScores(pool, facets.normalized) : Promise.resolve(null),
        getPropertiesByIds(pool.map((p) => p.id)),
      ]);
      const byId = new Map(props.map((p) => [p.id, p]));
      const rows = (hits: SearchHit[]) =>
        hits.map((h) => byId.get(h.id)).filter((p): p is Property => p != null);

      const hits = rankBy(pool, scores);
      const weak = !!scores && Math.max(...scores) < RERANK_ACTIVATE;
      if (!widened && noIntent(facets) && weak) {
        return { hits, items: rows(hits), fallback: true, fallbackNote: VAGUE_NOTE };
      }
      const res = pooled(built, facets, hits);
      return { ...res, items: rows(res.hits) };
    },
  });
}

const cachedSearch = cached(runHybridSearch, "hybrid-search", SEARCH_REVALIDATE);

// Canonicalise outside `cached`, which keys on the raw arguments. The quota is charged here rather
// than inside, so replaying popular queries off the cache still counts against the caller.
export async function hybridSearch(query: string): Promise<SearchResult> {
  await requireQuota("search");
  return cachedSearch(canonicalQuery(query));
}
