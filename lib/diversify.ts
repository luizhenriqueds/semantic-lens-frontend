import type { Property } from "@/lib/types";

const byNeighborhood = (p: Property) => `${p.city}|${p.neighborhood}`;

// One subdivision's near-identical listings can fill a whole page. Anything past
// the cap for its locality moves behind the rest; relative order is kept.
// `keyOf` widens the unit of "locality" - the discovery rails cap by city,
// because Rio de Janeiro alone is a third of the base.
export function spreadByLocality(
  items: Property[],
  cap = 2,
  keyOf: (p: Property) => string = byNeighborhood,
): Property[] {
  const kept: Property[] = [];
  const deferred: Property[] = [];
  const seen = new Map<string, number>();

  for (const p of items) {
    const key = keyOf(p);
    const n = seen.get(key) ?? 0;
    if (n < cap) {
      kept.push(p);
      seen.set(key, n + 1);
    } else {
      deferred.push(p);
    }
  }
  return [...kept, ...deferred];
}
