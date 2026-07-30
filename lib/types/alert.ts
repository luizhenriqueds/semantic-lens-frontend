import type { PropertyChangeKind } from "./propertyFilters";
import type { RangeFilter } from "@/lib/facets/range";
import type { Scores } from "./property";

export type Alert = {
  id: string;
  name: string;
  freq: string;
  on: boolean;
  criteria?: AlertCriteria;
};

// `criteria: null` clears them; `undefined` leaves them unchanged.
export type AlertPatch = {
  name?: string;
  freq?: string;
  criteria?: AlertCriteria | null;
  on?: boolean;
};

/** The jsonb shape `property_list_matched()` reads from `p_filters`. */
export type AlertCriteriaSet = {
  q?: string;
  uf?: string;
  city?: string;
  type?: string;
  modalities?: string[];
  cluster_id?: number;
  h3?: string;
  range_dim?: RangeFilter["dim"];
  range_from?: number;
  range_to?: number;
  min_bedrooms?: number;
  max_price?: number;
  min_area?: number;
  min_discount?: number;
  min_investment?: number;
  min_visual_score?: number;
  /** Places, by `pois.id`: within `poi_radius_m` of any listed id. */
  poi_ids?: number[];
  /** Categories, AND across them: the radius has to hold for each one. */
  poi_cats?: string[];
  poi_radius_m?: number;
  max_center_m?: number;
  change_kind?: PropertyChangeKind;
  changed_within_days?: number;
  score_key?: keyof Scores;
  score_min?: number;
  financing?: boolean;
  fgts?: boolean;
  auction_within_days?: number;
};

/** OR-of-ANDs: a property matching any branch matches the alert. */
export type AlertCriteriaAny = { any: AlertCriteriaSet[] };

export type AlertCriteria = AlertCriteriaSet | AlertCriteriaAny;

/** `criteria` is null when nothing in the phrase maps to the contract. */
export type ResolvedAlertQuery = { criteria: AlertCriteriaSet | null; dropped: string[] };
