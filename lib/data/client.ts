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

// Retries transient failures, but not a `statement timeout` by default - retrying an already-
// heavy query only piles more load onto a struggling DB. `retryTimeouts: true` opts back in for
// cheap, indexed lookups where a timeout is more likely a blip than real query cost.
export async function withRetry<T>(
  build: () => PromiseLike<QueryResult<T>>,
  { retryTimeouts = false }: { retryTimeouts?: boolean } = {},
): Promise<QueryResult<T>> {
  const canRetry = (msg: string) =>
    TRANSIENT.test(msg) && (retryTimeouts || !/timeout|canceling/i.test(msg));
  let res = await build();
  for (let i = 0; i < 3 && res.error && canRetry(res.error.message); i++) {
    await new Promise((r) => setTimeout(r, 250 * (i + 1)));
    res = await build();
  }
  return res;
}

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

// Wraps a loader in next's request cache. Extra args become part of the cache key.
export function cached<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  prefix: string,
  revalidate = REVALIDATE,
): (...args: A) => Promise<T> {
  return (...args: A) =>
    unstable_cache(() => fn(...args), [prefix, ...args.map(String)], { revalidate })();
}
