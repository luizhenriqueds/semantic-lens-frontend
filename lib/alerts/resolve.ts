import { parseQuery, searchPoisByName } from "@/lib/data";
import { isPoiCategoryOnly, normalize, type Facets, type PoiQuery } from "@/lib/facets";
import { poiPlaceLabel, POI_RADIUS_M } from "@/lib/pois";
import type { AlertCriteriaSet, ResolvedAlertQuery } from "@/lib/types";
import { sanitizeCriteria } from "./criteria";

const CENTER_RADIUS_M = 2000;
// A generic name ("praia") resolves to hundreds of places.
const POI_ID_LIMIT = 40;

function facetsToCriteria(f: Facets): { criteria: AlertCriteriaSet; dropped: string[] } {
  const c: AlertCriteriaSet = {};
  const dropped: string[] = [];
  if (f.type) c.type = f.type;
  if (f.city) c.city = f.city;
  if (f.bedroomsMin != null) c.min_bedrooms = f.bedroomsMin;
  if (f.priceMax != null) c.max_price = f.priceMax;
  if (f.goal) c.score_key = f.goal;
  if (f.center) c.max_center_m = CENTER_RADIUS_M;
  // No contract key for either, and an unapplied constraint would widen the alert.
  if (f.parkingMin != null) dropped.push("vagas de garagem");
  if (f.bathroomsMin != null) dropped.push("banheiros");
  return { criteria: c, dropped };
}

// Every place carrying the phrase ("ufms" → all campuses), else the best candidate.
async function resolvePlaceIds(poi: PoiQuery, city: string | null): Promise<number[]> {
  const cands = await searchPoisByName(poi, city);
  if (!cands.length) return [];
  const terms = normalize(poi.name)
    .split(" ")
    .filter((w) => w.length >= 3 && !isPoiCategoryOnly(w));
  const named = terms.length
    ? cands.filter((p) => {
        const name = normalize(p.name ?? "");
        return terms.every((t) => name.includes(t));
      })
    : [];
  return (named.length ? named : cands.slice(0, 1)).slice(0, POI_ID_LIMIT).map((p) => p.id);
}

/** Free text no contract key expresses is dropped, never passed through as `q`. */
export async function resolveQueryCriteria(query: string): Promise<ResolvedAlertQuery> {
  const q = query.trim();
  if (!q) return { criteria: null, dropped: [] };

  const facets = await parseQuery(q);
  const { criteria: c, dropped } = facetsToCriteria(facets);
  const poi = facets.poi;

  if (poi) {
    const categoryOnly = !!poi.category && isPoiCategoryOnly(poi.name);
    const ids = categoryOnly ? [] : await resolvePlaceIds(poi, facets.city);
    if (ids.length) {
      c.poi_ids = ids;
      c.poi_radius_m = POI_RADIUS_M;
    } else if (poi.category) {
      // A place that didn't resolve still leaves "perto de uma universidade".
      if (!categoryOnly) dropped.push(`o local “${poiPlaceLabel(poi.name)}”`);
      c.poi_cats = [poi.category];
      c.poi_radius_m = POI_RADIUS_M;
    } else {
      dropped.push(`“perto de ${poiPlaceLabel(poi.name)}”`);
    }
  }

  return { criteria: sanitizeCriteria(c) as AlertCriteriaSet | null, dropped };
}
