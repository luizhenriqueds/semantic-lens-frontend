import { POI_RADIUS_M } from "@/lib/pois";
import type { AlertCriteriaSet, PropertyFilters } from "@/lib/types";

/** `p_filters` as the list RPCs read it. `ids`/`include_inactive` are query-only:
 *  they narrow a single read and are never persisted as alert criteria. */
export type RpcFilters = AlertCriteriaSet & { ids?: string[]; include_inactive?: boolean };

export function toRpcFilters(f: PropertyFilters = {}): RpcFilters {
  const out: RpcFilters = {};
  if (f.q?.trim()) out.q = f.q.trim();
  if (f.uf) out.uf = f.uf;
  if (f.city) out.city = f.city;
  if (f.type) out.type = f.type;
  if (f.modalities?.length) out.modalities = f.modalities;
  if (f.clusterId != null) out.cluster_id = f.clusterId;
  if (f.h3) out.h3 = f.h3;
  if (f.range) {
    out.range_dim = f.range.dim;
    out.range_from = f.range.from;
    if (f.range.to !== Infinity) out.range_to = f.range.to;
  }
  if (f.minBedrooms) out.min_bedrooms = f.minBedrooms;
  if (f.maxPrice) out.max_price = f.maxPrice;
  if (f.minArea) out.min_area = f.minArea;
  if (f.poiCats?.length) {
    out.poi_cats = f.poiCats;
    out.poi_radius_m = f.poiRadiusM ?? POI_RADIUS_M;
  }
  if (f.poiIds?.length) {
    out.poi_ids = f.poiIds;
    out.poi_radius_m = f.poiRadiusM ?? POI_RADIUS_M;
  }
  if (f.maxCenterM) out.max_center_m = f.maxCenterM;
  if (f.minDiscount) out.min_discount = f.minDiscount;
  if (f.minInvestment) out.min_investment = f.minInvestment;
  if (f.minVisualScore) out.min_visual_score = f.minVisualScore;
  if (f.changeKind) {
    out.change_kind = f.changeKind;
    if (f.changedWithinDays) out.changed_within_days = f.changedWithinDays;
  }
  if (f.scoreKey) out.score_key = f.scoreKey;
  if (f.scoreMin) out.score_min = f.scoreMin;
  if (f.financing) out.financing = true;
  if (f.fgts) out.fgts = true;
  if (f.auctionWithinDays) out.auction_within_days = f.auctionWithinDays;
  if (f.includeInactive) out.include_inactive = true;
  if (f.ids) out.ids = f.ids;
  return out;
}
