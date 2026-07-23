import { supabase } from "@/lib/supabase";
import type { ProfileKey, Scores } from "@/lib/types";
import { cached, rows } from "./client";

export type MarketBucket = { label: string; n: number; sub?: string };

export type MarketCity = {
  city: string;
  uf: string;
  n: number;
  sale_median: number | null;
  price_m2_median: number | null;
  discount_median: number | null;
  investment_median: number | null;
};

export type MarketUf = { uf: string; n: number };
export type MarketType = { label: string; n: number };

export type MarketOpp = {
  property_id: string;
  property_type: string;
  city: string;
  uf: string;
  area_m2: number | null;
  sale_value: number | null;
  appraised_value: number | null;
  discount: number | null;
  investment: number | null;
};

// Mirrors the `data` JSONB payload of public.market_dashboard_mv (single row,
// refreshed by the backend each batch run). Every aggregate is precomputed, so
// the page reads a few KB instead of scanning the whole listable base.
export type MarketDashboard = {
  kpi: {
    available: number;
    catalogued: number;
    discount_median: number;
    appraisal_sum: number;
    price_gap_sum: number;
  };
  insights: {
    discount_50plus: number;
    occupied_pct: number;
    fgts_pct: number;
    financing_pct: number;
  };
  disc: MarketBucket[];
  inv: MarketBucket[];
  cities: MarketCity[];
  uf: MarketUf[];
  types: MarketType[];
  dna: Partial<Record<keyof Scores, number>>;
  prof: Partial<Record<ProfileKey, number>>;
  timeline: { next7: number; scheduled: number; first_auction: number };
  occ: { occupied: number; vacant: number; unknown: number };
  beds: { b1: number; b2: number; b3: number; b4plus: number };
  opp: MarketOpp[];
  computedAt: string | null;
};

async function loadDashboard(): Promise<MarketDashboard | null> {
  const res = await supabase
    .from("market_dashboard_mv")
    .select("data,computed_at")
    .order("computed_at", { ascending: false })
    .limit(1);
  const row = rows<{ data: Omit<MarketDashboard, "computedAt">; computed_at: string | null }>(
    "market_dashboard_mv",
    res,
  )[0];
  if (!row?.data) return null;
  return { ...row.data, computedAt: row.computed_at ?? null };
}

export const getMarketDashboard = cached(loadDashboard, "market-dashboard");
