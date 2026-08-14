// A single render fans out hard - the landing alone issues ~40 reads - and one unbounded burst is
// what turns a slow query into a page of statement timeouts. The permit queue bounds that. The
// deadline only frees the function; the statement runs on until Postgres' own timeout fires.

function envNum(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Previews share the production database, so they get a much smaller share of it.
const LIMIT = envNum(process.env.DB_MAX_CONCURRENCY, process.env.VERCEL_ENV === "preview" ? 2 : 8);
const QUEUE_MS = envNum(process.env.DB_QUEUE_TIMEOUT_MS, 3_000);
const REQUEST_MS = envNum(process.env.DB_TIMEOUT_MS, 8_000);
const SLOW_MS = envNum(process.env.DB_SLOW_MS, 1_000);

type Waiter = {
  resolve: () => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

let inFlight = 0;
const waiting: Waiter[] = [];

// The permit queue bounds one render's fan-out, not the fleet's. A 503 means postgrest's pool is
// already gone, so consecutive saturation trips a breaker and gives it a window to drain.
const TRIP_AFTER = envNum(process.env.DB_TRIP_AFTER, 5);
const COOLDOWN_MS = envNum(process.env.DB_COOLDOWN_MS, 5_000);

let saturation = 0;
let openedAt = 0;

function isOpen(): boolean {
  if (!openedAt) return false;
  if (Date.now() - openedAt < COOLDOWN_MS) return true;
  // Half-open: let one request through, and re-trip on a single further failure.
  openedAt = 0;
  saturation = TRIP_AFTER - 1;
  return false;
}

function record(saturated: boolean): void {
  if (!saturated) {
    saturation = 0;
    openedAt = 0;
    return;
  }
  if (++saturation >= TRIP_AFTER && !openedAt) {
    openedAt = Date.now();
    console.warn(`[db] breaker open for ${COOLDOWN_MS}ms after ${saturation} saturated responses`);
  }
}

function acquire(): Promise<void> {
  if (inFlight < LIMIT) {
    inFlight++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const waiter: Waiter = {
      resolve,
      reject,
      // Failing fast beats joining a queue longer than the request's own budget.
      timer: setTimeout(() => {
        waiting.splice(waiting.indexOf(waiter), 1);
        reject(new Error(`db queue timeout after ${QUEUE_MS}ms`));
      }, QUEUE_MS),
    };
    waiting.push(waiter);
  });
}

// Handed to the next waiter rather than released and re-taken, so a burst cannot starve the queue.
function release(): void {
  const next = waiting.shift();
  if (!next) {
    inFlight--;
    return;
  }
  clearTimeout(next.timer);
  next.resolve();
}

function label(input: RequestInfo | URL): string {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  try {
    return new URL(raw).pathname;
  } catch {
    return raw;
  }
}

// Queue depth is the leading indicator: it rises before anything times out.
function log(input: RequestInfo | URL, startedAt: number, status: string, quiet: boolean): void {
  const ms = Date.now() - startedAt;
  if (quiet && ms < SLOW_MS) return;
  console.warn(
    `[db] ${label(input)} ${ms}ms ${status} inflight=${inFlight} queued=${waiting.length}`,
  );
}

export async function dbFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Before the permit, not after: a queued request is a connection this database cannot spare.
  if (isOpen()) throw new Error("db unavailable: breaker open");
  await acquire();
  const startedAt = Date.now();
  // Composed, not replaced: an `.abortSignal()` passed at a call site has to keep working.
  const deadline = AbortSignal.timeout(REQUEST_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline;
  try {
    const res = await fetch(input, { ...init, signal });
    log(input, startedAt, String(res.status), res.ok);
    // 503 is pool exhaustion; 504 is the gateway giving up on a query still holding a connection.
    record(res.status === 503 || res.status === 504);
    return res;
  } catch (e) {
    log(input, startedAt, e instanceof Error ? e.name : "error", false);
    // A deadline abort means the statement outlived its budget and is still running on the server.
    record(e instanceof Error && e.name === "TimeoutError");
    throw e;
  } finally {
    release();
  }
}

export const dbPoolStats = () => ({
  limit: LIMIT,
  inFlight,
  queued: waiting.length,
  breakerOpen: Boolean(openedAt),
});
