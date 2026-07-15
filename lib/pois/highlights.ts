import type { Poi } from "@/lib/types";

// Notable "anchor" categories, most recognizable first.
const HIGHLIGHT_ORDER = [
  "shopping_center",
  "university",
  "hospital",
  "supermarket",
  "bank",
  "school",
  "park",
  "restaurant",
  "hotel",
  "pharmacy",
];

// Picks a diverse, deduplicated set of named POIs to headline a region: at most
// `perCat` per category, round-robined across categories so no single one
// dominates, capped at `total`.
export function regionHighlights(
  pois: Poi[],
  { total = 12, perCat = 3 }: { total?: number; perCat?: number } = {},
): Poi[] {
  const groups = new Map<string, Poi[]>();
  for (const p of pois) {
    if (!p.name || !HIGHLIGHT_ORDER.includes(p.category)) continue;
    const arr = groups.get(p.category) ?? [];
    if (arr.length >= perCat) continue;
    if (arr.some((q) => q.name!.toLowerCase() === p.name!.toLowerCase())) continue;
    arr.push(p);
    groups.set(p.category, arr);
  }

  const cats = HIGHLIGHT_ORDER.filter((c) => groups.has(c));
  const out: Poi[] = [];
  for (let round = 0; round < perCat; round++) {
    for (const c of cats) {
      const p = groups.get(c)![round];
      if (p) out.push(p);
      if (out.length >= total) return out;
    }
  }
  return out;
}
