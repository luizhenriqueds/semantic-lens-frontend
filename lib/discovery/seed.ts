import { fnv1a } from "@/lib/hash";

// Rails sample from a pool, so the sample must be deterministic - sections stream from
// independent Suspense boundaries and would otherwise disagree on what the hero used.
// A (user, day) seed is stable all day and different tomorrow, and never reaches a
// query's cache key, so every underlying read stays shared across users.

const TZ = "America/Sao_Paulo";

export function localDay(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function daySeed(userId: string | null, now: Date = new Date()): number {
  return fnv1a(`${userId ?? "anon"}|${localDay(now)}`);
}

// mulberry32
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(xs: readonly T[], seed: number): T[] {
  const out = xs.slice();
  const next = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Own stream per rail, so two rails over the same pool don't land on the same order.
export function railSeed(seed: number, rail: string): number {
  return fnv1a(`${seed}|${rail}`);
}
