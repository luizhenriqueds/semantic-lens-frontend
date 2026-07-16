import type { Scores } from "./property";

export type AlertFilters = {
  scoreKey?: keyof Scores;
  minScore?: number;
  uf?: string;
  city?: string;
  propertyType?: string;
  minDiscount?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  poiCats?: string[];
  poiRadius?: number;
  maxCenter?: number;
};
