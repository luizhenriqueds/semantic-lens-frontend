import { unstable_cache } from "next/cache";

export const CLUSTER_RUN = "property-v1";
export const REVALIDATE = 120;
// The corpus is rebuilt by one nightly batch, so search results outlive the shared 120s.
export const SEARCH_REVALIDATE = 900;

export function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

const TRANSIENT =
  /statement timeout|canceling statement|timeout|fetch failed|ECONN|socket hang up/i;

const TIMEOUT = /timeout|canceling/i;
const MAX_RETRIES = 3;

// Retries transient failures, but not a `statement timeout` - retrying an already-heavy query only
// piles more load onto a struggling DB. `timeoutRetries` opts back in, and caps how far.
export async function withRetry<T>(
  build: () => PromiseLike<QueryResult<T>>,
  { timeoutRetries = 0 }: { timeoutRetries?: number } = {},
): Promise<QueryResult<T>> {
  const canRetry = (msg: string, done: number) =>
    TRANSIENT.test(msg) && (!TIMEOUT.test(msg) || done < timeoutRetries);
  let res = await build();
  for (let i = 0; i < MAX_RETRIES && res.error && canRetry(res.error.message, i); i++) {
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    res = await build();
  }
  return res;
}

// Opts a cheap, indexed lookup back into retrying a `statement timeout` - see `withRetry`.
export const withRetryTimeouts = <T>(build: () => PromiseLike<QueryResult<T>>) =>
  withRetry(build, { timeoutRetries: MAX_RETRIES });

export function rows<T>(name: string, res: QueryResult<T>): T[] {
  if (res.error) {
    console.error(`[data] query "${name}" failed: ${res.error.message}`);
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

// Wraps a loader in next's request cache. Extra args become part of the cache key.
export function cached<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  prefix: string,
  revalidate = REVALIDATE,
): (...args: A) => Promise<T> {
  return (...args: A) =>
    unstable_cache(() => fn(...args), [prefix, ...args.map(String)], { revalidate })();
}
