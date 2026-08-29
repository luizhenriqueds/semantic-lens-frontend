import type { RangeFilter } from "@/lib/facets/range";
import type { Scores } from "./property";

export type PropertySort = "leilao" | "investimento" | "desconto" | "score" | "menor" | "maior";

export const CHANGE_KINDS = ["modality", "payment", "price_drop", "relisted"] as const;

export type PropertyChangeKind = (typeof CHANGE_KINDS)[number];

// Mirrors the jsonb filter contract of the backend's property_list_matched() function.
export type PropertyFilters = {
  q?: string;
  uf?: string;
  city?: string;
  type?: string;
  modalities?: string[];
  clusterId?: number;
  h3?: string;
  range?: RangeFilter;
  minBedrooms?: number;
  maxPrice?: number;
  minArea?: number;
  poiCats?: string[];
  /** Named places, by `pois.id` - within `poiRadiusM` of any of them. */
  poiIds?: number[];
  poiRadiusM?: number;
  maxCenterM?: number;
  minDiscount?: number;
  minInvestment?: number;
  /** Facade grade from the vision model, 0-100. Needs `min_visual_score` on the RPC. */
  minVisualScore?: number;
  /** OR across kinds: a property matching any of them matches. */
  changeKinds?: PropertyChangeKind[];
  changedWithinDays?: number;
  scoreKey?: keyof Scores;
  scoreMin?: number;
  financing?: boolean;
  fgts?: boolean;
  auctionWithinDays?: number;
  /** Days since the property was first offered for sale. */
  firstSeenWithinDays?: number;
  includeInactive?: boolean;
  ids?: string[];
};

export type FilterOptions = {
  ufs: string[];
  cities: { uf: string; city: string }[];
  types: string[];
  modalities: string[];
  poiCategories: string[];
  /** Whether the list RPC honours `min_visual_score` - probed, see getFilterOptions. */
  visualScore: boolean;
};

/** For callers that would rather render a reduced surface than fail. */
export const EMPTY_FILTER_OPTIONS: FilterOptions = {
  ufs: [],
  cities: [],
  types: [],
  modalities: [],
  poiCategories: [],
  visualScore: false,
};

export type MapPoint = {
  id: string;
  lat: number;
  lon: number;
  propertyType: string;
  neighborhood: string;
  city: string;
  uf: string;
  area: number | null;
  bedrooms: number | null;
  parkingSpots: number | null;
  saleValue: number | null;
  discount: number | null;
  modality: string | null;
  auctionDate: string | null;
  occupancyStatus: string | null;
  investment: number | null;
};
