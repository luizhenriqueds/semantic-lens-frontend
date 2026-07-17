import type { Scores } from "./property";

export type Alert = {
  id: string;
  name: string;
  freq: string;
  on: boolean;
  filters?: AlertFilters;
};

// `filters: null` clears the filters (switches to "by description"); `undefined`
// leaves them unchanged.
export type AlertPatch = {
  name?: string;
  freq?: string;
  filters?: AlertFilters | null;
  on?: boolean;
};

export type AlertFilters = {
  q?: string;
  scoreKey?: keyof Scores;
  minScore?: number;
  uf?: string;
  city?: string;
  propertyType?: string;
  modalities?: string[];
  minDiscount?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  poiCats?: string[];
  poiRadius?: number;
  maxCenter?: number;
};
