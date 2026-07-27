import { spreadByLocality } from "@/lib/diversify";
import type { Property } from "@/lib/types";
import { railSeed, seededShuffle } from "./seed";

const byCity = (p: Property) => p.city;

// Shuffle first - the pool arrives sorted, so its head would be the same every day.
// `spreadByLocality` defers a city's surplus instead of dropping it, so a pool that is
// all Rio still fills the rail, it just leads with two.
export function seededPick(
  pool: readonly Property[],
  n: number,
  rail: string,
  seed: number,
  { exclude, maxPerCity = 2 }: { exclude?: ReadonlySet<string>; maxPerCity?: number } = {},
): Property[] {
  const candidates = exclude?.size ? pool.filter((p) => !exclude.has(p.id)) : pool.slice();
  const shuffled = seededShuffle(candidates, railSeed(seed, rail));
  return spreadByLocality(shuffled, maxPerCity, byCity).slice(0, n);
}
