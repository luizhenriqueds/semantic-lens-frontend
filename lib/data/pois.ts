import { supabase } from "@/lib/supabase";
import type { NearbyPoi, Poi } from "@/lib/types";
import { cached, rows, withRetry } from "./client";

// The pois table is large, so it is never loaded whole - callers
// fetch only the POIs they need by id, by bounding box, or by name.
export const POI_FIELDS = "id,category,name,lat,lon";

export const mapPoi = (r: any): Poi => ({
  id: r.id,
  category: r.category ?? "",
  name: r.name || null,
  lat: Number(r.lat),
  lon: Number(r.lon),
});

export async function loadPoisByIds(ids: number[]): Promise<Poi[]> {
  const out: Poi[] = [];
  for (let i = 0; i < ids.length; i += 500) {
    const res = await withRetry(() =>
      supabase
        .from("pois")
        .select(POI_FIELDS)
        .in("id", ids.slice(i, i + 500)),
    );
    out.push(...rows<any>("pois-by-id", res).map(mapPoi));
  }
  return out;
}

async function loadPoisNear(lat: number, lon: number, radiusM: number): Promise<Poi[]> {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180) || 1);
  const res = await withRetry(() =>
    supabase
      .from("pois")
      .select(POI_FIELDS)
      .gte("lat", lat - dLat)
      .lte("lat", lat + dLat)
      .gte("lon", lon - dLon)
      .lte("lon", lon + dLon)
      .limit(3000),
  );
  return rows<any>("pois-near", res).map(mapPoi);
}

// Coordinates are bucketed to ~100m so nearby lookups share a cache entry.
export function getPoisNear(lat: number, lon: number, radiusM: number): Promise<Poi[]> {
  return cached(loadPoisNear, "pois-near")(Number(lat.toFixed(3)), Number(lon.toFixed(3)), radiusM);
}

// Named POIs whose H3 res-8 cell is this region (region_cells.h3 is res-8), used
// to surface the actual establishments in the area.
async function loadRegionPois(h3: string): Promise<Poi[]> {
  const res = await withRetry(() =>
    supabase.from("pois").select(POI_FIELDS).eq("h3_r8", h3).not("name", "is", null).limit(500),
  );
  return rows<any>("region-pois", res).map(mapPoi);
}
export const getRegionPois = cached(loadRegionPois, "region-pois");

// Precomputed nearest POIs for a property (property_poi.dist_m), resolved to the
// full POI record and sorted nearest-first.
async function loadPropertyPois(id: string): Promise<NearbyPoi[]> {
  const res = await withRetry(() =>
    supabase.from("property_poi").select("poi_id,dist_m").eq("property_id", id),
  );
  const links = rows<any>("property_poi", res);
  const pois = await loadPoisByIds(links.map((r) => Number(r.poi_id)));
  const poiById = new Map(pois.map((p) => [p.id, p]));
  return links
    .map((r) => {
      const poi = poiById.get(Number(r.poi_id));
      return poi ? { ...poi, distance: Number(r.dist_m) } : null;
    })
    .filter((p): p is NearbyPoi => p !== null)
    .sort((a, b) => a.distance - b.distance);
}

export const getPropertyPois = cached(loadPropertyPois, "property-poi");
