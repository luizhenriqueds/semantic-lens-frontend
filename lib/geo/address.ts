import type { Property } from "@/lib/types";

// Groups properties that sit at the same coordinate (same address/building).
// Rounding to 5 decimals is ~1m, so only genuinely co-located listings merge.
export function groupByAddress(properties: Property[]): Property[][] {
  const groups = new Map<string, Property[]>();
  for (const p of properties) {
    if (p.lat == null || p.lon == null) continue;
    const key = `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
    const g = groups.get(key);
    if (g) g.push(p);
    else groups.set(key, [p]);
  }
  return [...groups.values()];
}
