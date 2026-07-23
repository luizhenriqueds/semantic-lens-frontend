import type { Scores } from "@/lib/types";

// Histogram bucket edges for the analysis view; Infinity marks the open last bucket.
export const ANALYSIS_EDGES: Record<"price" | "discount" | "area" | "invest", number[]> = {
  price: [0, 100_000, 200_000, 300_000, 400_000, 500_000, 750_000, 1_000_000, Infinity],
  discount: [0, 10, 20, 30, 40, 50, 60, 70, Infinity],
  area: [0, 40, 60, 80, 100, 150, 200, 300, Infinity],
  invest: [0, 30, 40, 50, 60, 70, 80, 90, Infinity],
};

export type RankRow = { label: string; value: number };

export type AnalysisData = {
  count: number;
  medianPrice: number | null;
  p25Price: number | null;
  p75Price: number | null;
  medianDiscount: number | null;
  medianArea: number | null;
  medianM2: number | null;
  avgScore: number | null;
  scoredCount: number;
  financing: number;
  fgts: number;
  scoreAvgs: { dim: keyof Scores; avg: number }[];
  hist: { price: number[]; discount: number[]; area: number[]; invest: number[] };
  topCities: RankRow[];
  topTypes: RankRow[];
  topHoods: RankRow[];
  scatter: { x: number; y: number; d: number }[];
};
