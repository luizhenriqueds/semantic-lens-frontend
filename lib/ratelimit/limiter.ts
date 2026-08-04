import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { policyFor, type Bucket, type Tier, type Window } from "./policy";

// enabled → block; shadow → check and log what it would have blocked, but let everything through.
// Neither → zero Redis round trips. Mirrors SEMCACHE_ENABLED / SEMCACHE_SHADOW.
const isEnabled = () => process.env.RATELIMIT_ENABLED === "true";
const isShadow = () => process.env.RATELIMIT_SHADOW === "true";

export type LimitDecision = { success: boolean; limit: number; remaining: number; reset: number };
export type LimitBackend = (prefix: string, key: string, window: Window) => Promise<LimitDecision>;

let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token, enableAutoPipelining: true }) : null;
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function limiterFor(prefix: string, window: Window): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const id = `${prefix}:${window.limit}/${window.windowMs}`;
  const existing = limiters.get(id);
  if (existing) return existing;

  const timeout = Number(process.env.RATELIMIT_TIMEOUT_MS);
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(window.limit, `${window.windowMs} ms`),
    prefix: `rl:${id}`,
    // Keyed on the bare identifier, so limiters must not share one. Caps a bot at one Redis
    // command per window rather than one per request.
    ephemeralCache: new Map(),
    timeout: Number.isFinite(timeout) && timeout > 0 ? timeout : 800,
  });
  limiters.set(id, limiter);
  return limiter;
}

const allow = (window: Window): LimitDecision => ({
  success: true,
  limit: window.limit,
  remaining: window.limit,
  reset: Date.now() + window.windowMs,
});

const upstash: LimitBackend = async (prefix, key, window) => {
  const limiter = limiterFor(prefix, window);
  if (!limiter) return allow(window);
  const { success, limit, remaining, reset } = await limiter.limit(key);
  return { success, limit, remaining, reset };
};

// Per-instance and reset on restart, like the semantic cache counters - enough to calibrate the
// thresholds from the shadow-mode logs.
const tally: Partial<Record<Bucket, { checks: number; blocks: number }>> = {};

function tallyLog(bucket: Bucket, blocked: boolean): string {
  const t = (tally[bucket] ??= { checks: 0, blocks: 0 });
  t.checks++;
  if (blocked) t.blocks++;
  return `[cumulative ${bucket}: ${t.blocks}/${t.checks}]`;
}

export async function checkLimit(
  bucket: Bucket,
  identity: string,
  tier: Tier,
  backend: LimitBackend = upstash,
): Promise<LimitDecision> {
  const policy = policyFor(bucket, tier);
  if (!isEnabled() && !isShadow()) return allow(policy.primary);

  const windows = policy.secondary ? [policy.primary, policy.secondary] : [policy.primary];
  let decision: LimitDecision;
  try {
    const results = await Promise.all(
      windows.map((window) => backend(`${bucket}:${tier}`, identity, window)),
    );
    const denied = results.filter((r) => !r.success);
    // Both windows must pass, so the furthest reset is the honest Retry-After.
    decision = denied.length ? denied.reduce((a, b) => (b.reset > a.reset ? b : a)) : results[0];
  } catch (err) {
    console.warn(`[ratelimit] ${bucket} check failed, allowing`, err);
    return allow(policy.primary);
  }

  const cumulative = tallyLog(bucket, !decision.success);
  if (decision.success) return decision;

  const context = `key=${identity} tier=${tier} limit=${decision.limit} ${cumulative}`;
  if (!isEnabled()) {
    console.info(`[ratelimit] ${bucket} WOULD BLOCK ${context}`);
    return { ...decision, success: true };
  }
  console.warn(`[ratelimit] ${bucket} BLOCK ${context}`);
  return decision;
}

export const retryAfterSeconds = (decision: LimitDecision): number =>
  Math.max(1, Math.ceil((decision.reset - Date.now()) / 1000));

export function rateLimitHeaders(decision: LimitDecision): Record<string, string> {
  return {
    "Retry-After": String(retryAfterSeconds(decision)),
    "X-RateLimit-Limit": String(decision.limit),
    "X-RateLimit-Remaining": String(Math.max(0, decision.remaining)),
    "X-RateLimit-Reset": String(decision.reset),
    "Cache-Control": "no-store",
  };
}
