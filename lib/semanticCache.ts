import { Index } from "@upstash/vector";
import { after } from "next/server";
import { fnv1a } from "@/lib/hash";

// Semantic cache in front of the search pipeline. On a near-duplicate query
// (same hard facets + cosine similarity >= threshold) we return the cached
// result and skip the embedding-driven DB query and reranker. Vectors are our
// own Qwen3 embeddings, so the cache lives in the same embedding space as
// retrieval (Upstash index is created with model "None", 1024 dims, cosine).

export type Namespace = "search";

type NsConfig = { threshold: number; ttlMs: number };

const NS_CONFIG: Record<Namespace, NsConfig> = {
  search: {
    threshold: envNum("SEMCACHE_SEARCH_MIN", 0.9),
    ttlMs: envNum("SEMCACHE_SEARCH_TTL_MS", 15 * 60_000),
  },
};

function envNum(key: string, fallback: number): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

// enabled → serve hits; shadow → look up and log a hit/miss diff but still run
// the real pipeline (for threshold calibration with zero user impact).
const isEnabled = () => process.env.SEMCACHE_ENABLED === "true";
const isShadow = () => process.env.SEMCACHE_SHADOW === "true";

// In-process hit-rate counters. Reset on server restart and are per-instance
// (serverless may fragment them across lambdas) - good enough for calibration.
type Tally = { hit: number; miss: number; shadowHit: number; shadowMatch: number };
const stats: Record<Namespace, Tally> = {
  search: { hit: 0, miss: 0, shadowHit: 0, shadowMatch: 0 },
};

function pct(n: number, d: number): number {
  return d ? Math.round((n / d) * 1000) / 10 : 0;
}

export function getSemanticCacheStats() {
  const per = (t: Tally) => {
    const lookups = t.hit + t.shadowHit + t.miss;
    const found = t.hit + t.shadowHit;
    return {
      ...t,
      lookups,
      hitRatePct: pct(found, lookups),
      shadowMatchRatePct: pct(t.shadowMatch, t.shadowHit),
    };
  };
  return {
    mode: isEnabled() ? "enabled" : isShadow() ? "shadow" : "disabled",
    search: per(stats.search),
  };
}

function tallyLog(ns: Namespace): string {
  const t = stats[ns];
  const found = t.hit + t.shadowHit;
  return `[cumulative ${ns}: ${found}/${found + t.miss} lookups=${pct(found, found + t.miss)}%]`;
}

let index: Index | null | undefined;
function getIndex(): Index | null {
  if (index !== undefined) return index;
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  index = url && token ? new Index({ url, token }) : null;
  return index;
}

// Hex, for collision-safe quote-free ids and the facet bucket key that isolates
// entries with identical hard filters.
const hash = (s: string): string => fnv1a(s).toString(16);

type Facets = Record<string, string | number | null>;

function bucketOf(ns: Namespace, facets: Facets): string {
  const sig = Object.keys(facets)
    .sort()
    .map((k) => `${k}=${facets[k] ?? ""}`)
    .join("|");
  return hash(`${ns}|${sig}`);
}

type CacheMeta = { bucket: string; payload: string; createdAt: number; text: string };

async function lookup<T>(
  ns: Namespace,
  vector: number[],
  facets: Facets,
  cfg: NsConfig,
): Promise<{ payload: T; score: number } | null> {
  const idx = getIndex();
  if (!idx) return null;
  try {
    const bucket = bucketOf(ns, facets);
    const res = await idx.query({
      vector,
      topK: 1,
      includeMetadata: true,
      filter: `bucket = '${bucket}'`,
    });
    const top = res[0];
    if (!top || top.score < cfg.threshold) return null;
    const md = top.metadata as CacheMeta | undefined;
    if (!md?.payload || typeof md.createdAt !== "number") return null;
    if (Date.now() - md.createdAt > cfg.ttlMs) return null;
    return { payload: JSON.parse(md.payload) as T, score: top.score };
  } catch (err) {
    console.warn(`[semcache] lookup failed (${ns})`, err);
    return null;
  }
}

async function store<T>(
  ns: Namespace,
  vector: number[],
  text: string,
  facets: Facets,
  payload: T,
): Promise<void> {
  const idx = getIndex();
  if (!idx) return;
  try {
    const bucket = bucketOf(ns, facets);
    const meta: CacheMeta = {
      bucket,
      payload: JSON.stringify(payload),
      createdAt: Date.now(),
      text: text.slice(0, 200),
    };
    await idx.upsert({ id: `${ns}:${bucket}:${hash(text)}`, vector, metadata: meta });
  } catch (err) {
    console.warn(`[semcache] store failed (${ns})`, err);
  }
}

// Only the next query needs the write; `after` keeps it alive past the response.
function writeBack(p: Promise<void>): void {
  try {
    after(() => p);
  } catch {
    void p;
  }
}

export async function semanticCached<T>({
  namespace,
  vector,
  text,
  facets,
  compute,
  isCacheable,
  toCache,
}: {
  namespace: Namespace;
  vector: number[];
  text: string;
  facets: Facets;
  compute: () => Promise<T>;
  isCacheable?: (result: T) => boolean;
  // Drop anything cheap to rebuild: the payload rides in metadata, capped at 48 KB.
  toCache?: (result: T) => T;
}): Promise<T> {
  // Fully disabled → zero overhead, no Upstash round-trip.
  if (!isEnabled() && !isShadow()) return compute();

  const cfg = NS_CONFIG[namespace];
  const pending = lookup<T>(namespace, vector, facets, cfg);

  const finish = (hit: { payload: T; score: number } | null, result: T): T => {
    if (hit) {
      const same = JSON.stringify(hit.payload) === JSON.stringify(result);
      stats[namespace].shadowHit++;
      if (same) stats[namespace].shadowMatch++;
      console.info(
        `[semcache] ${namespace} SHADOW score=${hit.score.toFixed(3)} match=${same} (not served) ${tallyLog(namespace)}`,
      );
    } else {
      stats[namespace].miss++;
      console.info(`[semcache] ${namespace} MISS ${tallyLog(namespace)}`);
    }
    if (!isCacheable || isCacheable(result)) {
      writeBack(store(namespace, vector, text, facets, toCache ? toCache(result) : result));
    }
    return result;
  };

  // Shadow never serves, so its lookup runs alongside compute, not before it.
  if (!isEnabled()) {
    const [hit, result] = await Promise.all([pending, compute()]);
    return finish(hit, result);
  }

  const hit = await pending;
  if (hit) {
    stats[namespace].hit++;
    console.info(
      `[semcache] ${namespace} HIT score=${hit.score.toFixed(3)} (served) ${tallyLog(namespace)}`,
    );
    return hit.payload;
  }

  return finish(null, await compute());
}
