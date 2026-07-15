export type RecommendationKind = "similar" | "visual";

export type Recommendation = {
  recId: string;
  kind: RecommendationKind;
  rank: number;
  similarity: number | null;
};
