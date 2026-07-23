import { supabase } from "@/lib/supabase";
import { EMBEDDING_MODEL, embedQuery, rerank } from "@/lib/embed";
import { normalize, parseFacets, type GoalKey, type PoiQuery } from "@/lib/facets";
import { semanticCached } from "@/lib/semanticCache";
import { titleCase } from "@/lib/format";
import type { Poi } from "@/lib/types";
import { cached, rows, withRetry } from "./client";
import { getFilterOptions } from "./propertyList";
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

// POIs whose name matches the query, narrowed by category (soft). Acronyms are
// resolved by the backend, so a single name ILIKE is enough here. Queried by name
// so the 236k-row table is never loaded into memory.
async function searchPoisByName(q: PoiQuery): Promise<Poi[]> {
  const res = await withRetry(() =>
    supabase
      .from("pois")
      .select(POI_FIELDS)
      .ilike("name", `%${normalize(q.name)}%`)
      .limit(200),
  );
  const cands = rows<any>("pois-search", res).map(mapPoi);
  if (q.category) {
    const byCat = cands.filter((p) => p.category === q.category);
    if (byCat.length) return byCat;
  }
  return cands;
}

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
  return hits.sort((a, b) => b.score - a.score).slice(0, RESULT_LIMIT);
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
        .slice(0, RESULT_LIMIT);
    }
  }
  return pool.slice(0, RESULT_LIMIT).map((p, i) => ({ id: p.id, score: 1 - i / RESULT_LIMIT }));
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
        return ok(await goalRerank(pool, facets.goal));
      }

      return ok(await semanticRank(pool, facets.normalized, !!facets.type));
    },
  });
}

export const hybridSearch = cached(runHybridSearch, "hybrid-search");
