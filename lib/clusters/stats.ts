export type ClusterStats = {
  count: number;
  medianPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  medianDiscount: number | null;
  avgScore: number | null;
  avgAge: number | null;
  topCity: string | null;
  cityCount: number;
  sampleImages: string[];
};
