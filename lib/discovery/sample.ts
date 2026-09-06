import { spreadByLocality } from "@/lib/diversify";
import { investmentScore } from "@/lib/format";
import type { Property } from "@/lib/types";
import { railSeed, seededShuffle } from "./seed";

const byCity = (p: Property) => p.city;
const hasPhoto = (p: Property) => Boolean(p.image);

type PickOptions = {
  exclude?: ReadonlySet<string>;
  maxPerCity?: number;
  preferImages?: boolean;
};

// Shuffle first - the pool arrives sorted, so its head would be the same every day.
// `spreadByLocality` defers a city's surplus instead of dropping it, so a pool that is
// all Rio still fills the rail, it just leads with two.
export function seededPick(
  pool: readonly Property[],
  n: number,
  rail: string,
  seed: number,
  { exclude, maxPerCity = 2, preferImages = false }: PickOptions = {},
): Property[] {
  const candidates = exclude?.size ? pool.filter((p) => !exclude.has(p.id)) : pool.slice();
  const shuffled = seededShuffle(candidates, railSeed(seed, rail));
  // Partition, not filter: photoless listings stay on as filler so a thin pool still fills the rail.
  const ordered = preferImages
    ? [...shuffled.filter(hasPhoto), ...shuffled.filter((p) => !hasPhoto(p))]
    : shuffled;
  return spreadByLocality(ordered, maxPerCity, byCity).slice(0, n);
}

// After the pick, so the seed and the diversity cap still choose *which* listings appear.
export function byInvestment(items: Property[]): Property[] {
  return [...items].sort((a, b) => (investmentScore(b) ?? -1) - (investmentScore(a) ?? -1));
}
