import { cache as requestCache } from "react";
import { unstable_cache } from "next/cache";

export const CLUSTER_RUN = "property-v1";
export const REVALIDATE = 120;
// Not one nightly batch: `crawl-followups` refreshes property_list_mv hourly from 09:00 to 19:00
// (America/Campo_Grande). Still, a rebuild reorders far less than it changes.
export const SEARCH_REVALIDATE = 900;
// Prices ISR writes now, not Postgres reads: /property/[id] is cached, and next takes the shortest
// revalidate in a route's tree, so this value is what the page's TTL actually resolves to. At 1800s
// a crawled corpus rewrote all ~30k documents up to 48x a day; 6h caps that at 4.
export const DETAIL_REVALIDATE = 21_600;
// app/not-found.tsx renders SeoLinks, and next renders that boundary into every route's payload -
// so this catalogue TTL is a floor on every page's ISR TTL, not just on its own reads. The
// catalogue is cities and ranges: it moves far slower than the listings do.
export const CATALOGUE_REVALIDATE = 21_600;

export function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export type QueryError = { message: string; code?: string };
export type QueryResult<T> = { data: T[] | null; error: QueryError | null; status?: number };

// Status and SQLSTATE, not just the message: a HEAD request (`count: "exact"`) carries no body, so
// postgrest reports an empty message and a timed-out landing count read as permanent.
const TIMEOUT_CODE = "57014";
const TIMEOUT_TEXT = /timeout|canceling/i;
const NETWORK_TEXT = /fetch failed|ECONN|socket hang up|network|db queue timeout/i;
// 503 is deliberately absent: postgrest answers it when the pool is exhausted, so retrying spends
// a connection the database does not have and saturation outlives the load that caused it. The
// rest stay - those are edge and socket blips, where a second attempt is the right answer.
const RETRYABLE_STATUS = new Set([502, 504, 520, 522, 524]);
const MAX_RETRIES = 3;

type Failure = "timeout" | "transient" | "permanent";

function classify({ error, status }: QueryResult<unknown>): Failure {
  if (!error) return "permanent";
  if (error.code === TIMEOUT_CODE || TIMEOUT_TEXT.test(error.message)) return "timeout";
  if (NETWORK_TEXT.test(error.message)) return "transient";
  if (status != null && RETRYABLE_STATUS.has(status)) return "transient";
  // Bodyless HEAD count: on this data layer that is overwhelmingly a statement timeout.
  if (status === 500 && !error.message) return "timeout";
  return "permanent";
}

// Retries transient failures, but not a `statement timeout` - retrying an already-heavy query only
// piles more load onto a struggling DB. `timeoutRetries` opts back in, and caps how far.
export async function withRetry<T>(
  build: () => PromiseLike<QueryResult<T>>,
  { timeoutRetries = 0 }: { timeoutRetries?: number } = {},
): Promise<QueryResult<T>> {
  let res = await build();
  for (let i = 0; i < MAX_RETRIES && res.error; i++) {
    const failure = classify(res);
    if (failure === "permanent") break;
    if (failure === "timeout" && i >= timeoutRetries) break;
    // Jittered: several deployments backing off in lockstep is a thundering herd.
    await new Promise((r) => setTimeout(r, 250 * (i + 1) + Math.random() * 250));
    res = await build();
  }
  return res;
}

// Bounded fan-out. A caller that issues more reads at once than dbFetch has permits times its own
// tail out at QUEUE_MS and starves everything else sharing the lambda.
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export function rows<T>(name: string, res: QueryResult<T>): T[] {
  if (res.error) {
    console.error(`[data] query "${name}" failed: ${res.error.message}`);
  }
  return res.data ?? [];
}

// The `rpcJson({ required: true })` rule for plain table reads: `rows` hands a failure back as `[]`
// and `cached` memoises that emptiness, blanking the page long after the database recovered.
export function requiredRows<T>(name: string, res: QueryResult<T>): T[] {
  if (res.error) {
    // Logged as well as thrown: callers that degrade gracefully swallow the throw.
    console.error(`[data] query "${name}" failed: ${res.error.message}`);
    throw new Error(`query "${name}" failed: ${res.error.message}`);
  }
  return res.data ?? [];
}

// Pages past PostgREST's 1000-row cap. `build` must apply a stable `.order(...)`.
export async function fetchAllRows<T>(
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

// Plain TTL cache for a value with no key, not `cached`: unstable_cache skips the read when it
// runs nested inside another unstable_cache (see propertyList.ts's dayIdsCache for the keyed
// version of the same workaround).
export function ttlCached<T>(load: () => Promise<T>, ttlMs: number): () => Promise<T> {
  let slot: { at: number; promise: Promise<T> } | null = null;
  return () => {
    const now = Date.now();
    if (slot && now - slot.at <= ttlMs) return slot.promise;
    const promise = load().catch((e) => {
      slot = null;
      throw e;
    });
    slot = { at: now, promise };
    return promise;
  };
}

// unstable_cache does not coalesce in flight, so the two Suspense slots that both call
// getScoreExplain(id) each missed a cold key and each hit Postgres.
const inFlight = requestCache(() => new Map<string, Promise<unknown>>());

// Wraps a loader in next's request cache. Extra args become part of the cache key.
export function cached<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  prefix: string,
  revalidate = REVALIDATE,
): (...args: A) => Promise<T> {
  return (...args: A) => {
    const parts = [prefix, ...args.map(String)];
    // NUL, not a space: ("a b") and ("a", "b") must not collide.
    const key = parts.join("\u0000");
    const store = inFlight();
    const open = store.get(key) as Promise<T> | undefined;
    if (open) return open;
    const p = unstable_cache(() => fn(...args), parts, { revalidate })();
    store.set(key, p);
    return p;
  };
}
