import type { NearbyPoi, Poi } from "@/lib/types";

export const POI_LABEL: Record<string, string> = {
  university: "Universidade",
  hospital: "Hospital",
  supermarket: "Supermercado",
  shopping_center: "Shopping",
  park: "Parque",
  restaurant: "Restaurante",
  hotel: "Hotel",
  school: "Escola",
  bank: "Banco",
  pharmacy: "Farmácia",
};

// Order used for legends / listings — everyday essentials first.
export const POI_ORDER = [
  "supermarket",
  "school",
  "university",
  "hospital",
  "pharmacy",
  "park",
  "restaurant",
  "shopping_center",
  "bank",
  "hotel",
];

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Returns POIs within `radius` metres of a point, sorted nearest-first and
// capped at `limit`. Also guarantees the single nearest POI of each category is
// kept even if it sits just beyond the radius (up to `fallbackRadius`), so the
// map/legend always has context for amenities that exist in the wider area
// without dragging in far-flung outliers hundreds of km away.
export function nearbyPois(
  pois: Poi[],
  lat: number,
  lon: number,
  {
    radius = 2500,
    limit = 60,
    fallbackRadius = 15000,
  }: { radius?: number; limit?: number; fallbackRadius?: number } = {},
): NearbyPoi[] {
  const withDist = pois
    .map((p) => ({ ...p, distance: haversine(lat, lon, p.lat, p.lon) }))
    .sort((a, b) => a.distance - b.distance);

  const within = withDist.filter((p) => p.distance <= radius).slice(0, limit);
  const seen = new Set(within.map((p) => p.id));

  const nearestByCat = new Map<string, NearbyPoi>();
  for (const p of withDist) {
    if (!nearestByCat.has(p.category)) nearestByCat.set(p.category, p);
  }
  for (const p of nearestByCat.values()) {
    if (!seen.has(p.id) && p.distance <= fallbackRadius) {
      within.push(p);
      seen.add(p.id);
    }
  }
  return within.sort((a, b) => a.distance - b.distance);
}
