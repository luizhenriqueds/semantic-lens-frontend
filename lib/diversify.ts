import type { Property } from "@/lib/types";

// One subdivision's near-identical listings can fill a whole page. Anything past
// the cap for its locality moves behind the rest; relative order is kept.
export function spreadByLocality(items: Property[], cap = 2): Property[] {
  const kept: Property[] = [];
  const deferred: Property[] = [];
  const seen = new Map<string, number>();

  for (const p of items) {
    const key = `${p.city}|${p.neighborhood}`;
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
