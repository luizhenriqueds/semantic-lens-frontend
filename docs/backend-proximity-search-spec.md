# Backend spec — POI proximity search

## Problem

Query: `apartamento proximo a UCDB` returns property `1555538900096`.

- Straight-line (haversine) distance property → UCDB campus (`pois#7805`): **4.68 km**.
- Actual road distance: **~8 km** (Vila Margarida → Av. Tamandaré).

The frontend gates POI-proximity results with a **straight-line** radius (`POI_NEAR_M = 5 km`
in `lib/data.ts`), so a property that is 8 km by road but 4.68 km as-the-crow-flies passes the
gate and looks "próximo" when it is not.

This is a **distance-semantics / data** problem owned by the backend, not a frontend ranking bug.
The frontend correctly returns everything within its straight-line definition (validated below);
it just lacks a travel-distance signal to do better.

## Evidence (validation experiment)

Generated 8 queries from real `property_poi` pairs plus 2 curated probes (`UCDB`, `UFMS`), then ran
them through the live search and measured each returned property's distance to a name-matching POI.

- After fixing a POI truncation bug in the frontend (see below), **precision@5 km (straight-line) = 100%**
  (72/72 returned properties within 5 km of a matching POI).
- The only residual defect is straight-line ≠ travel distance (the UCDB case), which no frontend
  change can fix correctly without a travel-distance signal.

## Already done on the frontend

- `getPois()` was truncating at PostgREST's 1000-row cap (3,317 POIs total), dropping high-id POIs
  such as the Campo Grande UFMS/UCDB campuses — so they were never resolution candidates. Now paginated.
- POI proximity now uses **`property_poi` membership** instead of a client-side haversine gate
  (`poiRerank` + `nearestByPoi` in `lib/data.ts`): resolve the POI name → candidate `poi_id`s, then keep
  only pooled properties that list one of those POIs in `property_poi` within `POI_NEAR_M`, ranked by
  `dist_m`. This makes search consistent with the detail page and removes the UCDB false positive
  (UCDB is not among that property's precomputed neighbours). Empty → "resultados aproximados" fallback.
  **This now depends entirely on `property_poi` coverage** (item 1 below) — uncovered properties never
  match a proximity query.

## The authoritative "nearby" signal already exists — but is incomplete

`property_poi (property_id, poi_id, dist_m, source)` precomputes each property's nearest POIs.
Observed shape in the current DB:

- Capped at **~60 nearest POIs per property**, all with `dist_m <= ~5000`.
- For `1555538900096`, the 60 nearest all fall within **2.2 km**, and **UCDB is not among them** —
  i.e. this table already encodes the correct answer (UCDB is not "nearby" for this property).
- **Coverage is only ~18% of properties** in the current DB (18 of 100). The frontend cannot rely on it
  as the proximity source of truth until coverage is complete.

The property detail page already renders "Pontos de interesse próximos" from `property_poi`. Search and
the detail page should share one definition of "nearby"; today they don't.

## Requested backend work

1. **Complete `property_poi` coverage** for every active property (not a sampled subset).
2. **Define and document `dist_m` semantics.** Preferred: **road/network distance** (or walking isochrone),
   not straight-line. If straight-line is kept, expose an additional `travel_m` column. The product notion
   of "próximo" is travel-based.
3. **Expose a proximity search RPC** (preferred) so ranking stays server-side and consistent:
   `search_properties_near_poi(poi_ids int[], filters..., max_dist_m) -> (property_id, dist_m)`
   returning only properties whose `property_poi` contains one of `poi_ids` within `max_dist_m`,
   ordered by `dist_m`. If an RPC is out of scope, guaranteeing (1) + (2) is enough for the frontend
   to query `property_poi` directly.
4. **POI name → id resolution** (optional but valuable): a normalized `search_key` / alias table so
   acronyms resolve server-side (`ufms` → "Universidade Federal de Mato Grosso do Sul",
   `ucdb` → "Universidade Católica Dom Bosco"). The frontend currently hardcodes a small alias map.

## Frontend integration — done

Implemented (see "Already done" above). The remaining blocker is backend item 1: with partial
`property_poi` coverage, proximity queries for uncovered properties fall back to approximate results
even when a property is genuinely near the POI. Full coverage makes the integration correct end-to-end.
An RPC (item 3) would additionally let ranking/paging happen server-side.
