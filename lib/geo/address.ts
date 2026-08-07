import type { Property } from "@/lib/types";

export function centroid(points: { lat: number | null; lon: number | null }[]): {
  lat: number;
  lon: number;
} {
  return {
    lat: points.reduce((s, p) => s + p.lat!, 0) / points.length,
    lon: points.reduce((s, p) => s + p.lon!, 0) / points.length,
  };
}

function groupByCoord(properties: Property[], precision: number): Property[][] {
  const groups = new Map<string, Property[]>();
  for (const p of properties) {
    if (p.lat == null || p.lon == null) continue;
    const key = `${p.lat.toFixed(precision)},${p.lon.toFixed(precision)}`;
    const g = groups.get(key);
    if (g) g.push(p);
    else groups.set(key, [p]);
  }
  return [...groups.values()];
}

// Groups properties that sit at the same coordinate (same address/building).
// Rounding to 5 decimals is ~1m, so only genuinely co-located listings merge.
export function groupByAddress(properties: Property[]): Property[][] {
  return groupByCoord(properties, 5);
}

// Coarser buckets (~1km) for grouping properties into sub-areas of a region.
export function clusterByProximity(properties: Property[]): Property[][] {
  return groupByCoord(properties, 2);
}
