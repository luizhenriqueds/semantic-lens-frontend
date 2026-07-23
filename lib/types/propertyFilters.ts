import type { RangeFilter } from "@/lib/facets/range";
import type { Scores } from "./property";

export type PropertySort = "leilao" | "investimento" | "desconto" | "score" | "menor" | "maior";

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
  poiRadiusM?: number;
  maxCenterM?: number;
  minDiscount?: number;
  minInvestment?: number;
  scoreKey?: keyof Scores;
  scoreMin?: number;
  financing?: boolean;
  fgts?: boolean;
  auctionWithinDays?: number;
  auctionOn?: string;
  includeInactive?: boolean;
  // Past-auction properties are hidden by default; set to true to keep them.
  includePastAuctions?: boolean;
  ids?: string[];
};

export type FilterOptions = {
  ufs: string[];
  cities: { uf: string; city: string }[];
  types: string[];
  modalities: string[];
  poiCategories: string[];
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
