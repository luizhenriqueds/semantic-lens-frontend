export type ProfileKey = "airbnb" | "flip" | "student" | "family" | "high_liquidity" | "commercial";

export type Scores = {
  flip: number | null;
  liquidity: number | null;
  airbnb: number | null;
  student: number | null;
  family: number | null;
  commercial: number | null;
  convenience: number | null;
  investment: number | null;
};

export type Property = {
  id: string;
  propertyType: string;
  uf: string;
  city: string;
  neighborhood: string;
  area: number | null;
  bedrooms: number | null;
  parkingSpots: number | null;
  yearBuilt: number | null;
  occupancyStatus: string | null;
  title: string;
  description: string | null;
  image: string | null;
  appraisedValue: number | null;
  saleValue: number | null;
  discount: number | null;
  modality: string | null;
  auctionDate: string | null;
  link: string | null;
  inactive: boolean;
  acceptsFinancing: boolean;
  acceptsFgts: boolean;
  scores: Scores;
  profile: ProfileKey | null;
  profileScore: number | null;
  clusterId: number | null;
  clusterLabel: string | null;
  h3: string | null;
  lat: number | null;
  lon: number | null;
  visualScore: number | null;
  visualNote: string | null;
  visualAge: VisualAge | null;
  priceRank: number | null;
  sizeRank: number | null;
  centerProximity: number | null;
  // Distance in metres to the nearest POI of each category (from property_poi,
  // capped at the batch pipeline's ~5 km radius). Empty when no POIs are linked.
  nearestPoi: Record<string, number>;
};

export type VisualAge = "novo" | "intermediario" | "antigo";

export type ScoreImpact = "ajuda" | "neutro" | "pesa";

export type ScoreTerm = {
  feature: string;
  label: string;
  detail: string | null;
  impact: ScoreImpact | null;
  weight: number | null;
  contribution: number | null;
};

export type ScoreExplain = {
  summary: string | null;
  terms: ScoreTerm[];
};

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

export type MarketStats = {
  addressKey: string;
  uf: string | null;
  city: string | null;
  neighborhood: string | null;
  propertyType: string | null;
  sampleSize: number | null;
  priceMedian: number | null;
  areaMedian: number | null;
  priceM2Median: number | null;
  priceM2P25: number | null;
  priceM2P75: number | null;
  computedAt: string | null;
};

export type PriceHistoryPoint = {
  date: string;
  saleValue: number | null;
  appraisedValue: number | null;
  discount: number | null;
  modality: string | null;
};

export type RecommendationKind = "similar" | "visual";

export type Recommendation = {
  recId: string;
  kind: RecommendationKind;
  rank: number;
  similarity: number | null;
};

export type Poi = {
  id: number;
  category: string;
  name: string | null;
  lat: number;
  lon: number;
};

export type NearbyPoi = Poi & { distance: number };

export type MarketHistoryPoint = {
  date: string;
  priceMedian: number | null;
  priceM2Median: number | null;
  sampleSize: number | null;
};

export type Cluster = {
  clusterId: number;
  label: string;
  description: string | null;
  profile: ProfileKey | null;
  size: number;
  sampleIds: string[];
};

export type RegionDna = {
  conveniencia: number;
  perfilFamiliar: number;
  caminhabilidade: number;
  potencialAirbnb: number;
  demandaEstudantil: number;
  densidadeComercial: number;
};

export type Region = {
  h3: string;
  name: string;
  city: string;
  numProps: number;
  scores: {
    convenience: number | null;
    walkability: number | null;
    commercial: number | null;
    airbnb: number | null;
    student: number | null;
    family: number | null;
  };
  dna: RegionDna | null;
  topTags: string[];
  summary: string | null;
  counts: Record<string, number>;
  nearest: Record<string, number>;
  neighbors: { h3: string; similarity: number; name: string; city: string }[];
};
