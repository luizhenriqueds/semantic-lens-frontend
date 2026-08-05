import type { Role } from "@/lib/entitlements/plans";

export type Bucket = "page" | "search" | "export" | "image" | "checkout";
export type Tier = Role | "authed";

export type Window = { limit: number; windowMs: number };
/** Both must pass: the short window absorbs bursts, the long one stops the patient scraper
 *  sitting just under the per-minute ceiling all day. */
export type Policy = { primary: Window; secondary?: Window };

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const w = (limit: number, windowMs: number): Window => ({ limit, windowMs });

type BucketPolicy = { byTier: Partial<Record<Tier, Policy>>; fallback: Policy };

// Middleware can only tell anon from authed - reading the plan there costs a second round trip per
// request - so `page` is coarse and the per-plan numbers live on the buckets enforced deeper.
const DEFAULTS: Record<Bucket, BucketPolicy> = {
  // Generous because <Link> prefetch counts (see isCountable): one list view can cost ~25 requests.
  // A flood guard - the buckets below are what actually protect the dataset.
  page: {
    byTier: { authed: { primary: w(600, MINUTE), secondary: w(12_000, HOUR) } },
    fallback: { primary: w(300, MINUTE), secondary: w(3_000, HOUR) },
  },
  // Each miss is a DeepInfra embedding plus a reranker pass: the bucket that costs money.
  search: {
    byTier: {
      basic: { primary: w(20, MINUTE), secondary: w(200, HOUR) },
      investor: { primary: w(40, MINUTE), secondary: w(600, HOUR) },
      professional: { primary: w(80, MINUTE), secondary: w(1_200, HOUR) },
      platform: { primary: w(80, MINUTE), secondary: w(1_200, HOUR) },
    },
    fallback: { primary: w(8, MINUTE), secondary: w(60, HOUR) },
  },
  // Against EXPORT_ROW_CAP = 1000, the daily window is a 60k-row/day ceiling on the corpus.
  export: {
    byTier: {},
    fallback: { primary: w(5, MINUTE), secondary: w(60, DAY) },
  },
  image: {
    byTier: { authed: { primary: w(200, MINUTE) } },
    fallback: { primary: w(60, MINUTE) },
  },
  // Each attempt opens a real billing object in our provider account, so a loop would litter
  // their dashboard and trip their own abuse controls before it ever costs us compute.
  checkout: {
    byTier: {},
    fallback: { primary: w(5, MINUTE), secondary: w(20, HOUR) },
  },
};

/** `RATELIMIT_SEARCH_ANON="8/60"` or `"8/60,60/3600"` - limit/seconds pairs, primary first. */
function parseOverride(raw: string | undefined): Policy | null {
  if (!raw) return null;
  const windows: Window[] = [];
  for (const part of raw.split(",")) {
    const [limit, seconds] = part.split("/").map(Number);
    if (!Number.isFinite(limit) || !Number.isFinite(seconds) || limit <= 0 || seconds <= 0) {
      return null;
    }
    windows.push(w(limit, seconds * 1000));
  }
  return windows.length ? { primary: windows[0], secondary: windows[1] } : null;
}

// Read at call time, never at module load: CI builds with placeholder env.
export function policyFor(bucket: Bucket, tier: Tier): Policy {
  const override = parseOverride(process.env[`RATELIMIT_${bucket}_${tier}`.toUpperCase()]);
  if (override) return override;
  const { byTier, fallback } = DEFAULTS[bucket];
  // A named plan inherits the generic "authed" budget unless the bucket prices it separately.
  return byTier[tier] ?? (tier === "anon" ? undefined : byTier.authed) ?? fallback;
}
