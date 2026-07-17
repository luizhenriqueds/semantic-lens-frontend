export type ProfileKey = "airbnb" | "flip" | "student" | "family" | "high_liquidity" | "commercial";

export type VisualAge = "novo" | "intermediario" | "antigo";

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
  rawAddress: string | null;
  area: number | null;
  bedrooms: number | null;
  parkingSpots: number | null;
  yearBuilt: number | null;
  occupancyStatus: string | null;
  condoPaymentRule: string | null;
  taxPaymentRule: string | null;
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
