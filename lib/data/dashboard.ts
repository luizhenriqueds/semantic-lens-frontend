import { cache } from "react";
import { supabase } from "@/lib/supabase";
import { titleCase } from "@/lib/format";
import type { ProfileKey, Scores } from "@/lib/types";
import { cached, num, rows, withRetry } from "./client";

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
  image?: string | null;
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

// The MV picks `opp` on nota + deságio alone, so a bad facade photo can lead the
// section. Same selection, plus a floor on the visual score — re-queried rather
// than filtered so the grid still fills eight cards.
const OPP_MIN_VISUAL_SCORE = 70;
const OPP_MIN_DISCOUNT = 50;
const OPP_LIMIT = 8;

const OPP_COLS =
  "property_id,property_type,city,uf,area_m2,sale_value,appraised_value,discount,investment,image_url";

async function loadTopOpps(): Promise<MarketOpp[]> {
  const res = await withRetry(() =>
    supabase
      .from("property_list_mv")
      .select(OPP_COLS)
      .eq("is_listable", true)
      .gte("discount", OPP_MIN_DISCOUNT)
      .gte("visual_score", OPP_MIN_VISUAL_SCORE)
      .order("investment", { ascending: false })
      .limit(OPP_LIMIT),
  );
  return rows<any>("property_list_mv", res).map((r) => ({
    property_id: r.property_id,
    property_type: r.property_type ?? "Imóvel",
    city: titleCase(r.city ?? ""),
    uf: r.uf ?? "",
    area_m2: num(r.area_m2),
    sale_value: num(r.sale_value),
    appraised_value: num(r.appraised_value),
    discount: num(r.discount),
    investment: num(r.investment),
    image: r.image_url || null,
  }));
}

async function loadDashboard(): Promise<MarketDashboard | null> {
  const [res, opp] = await Promise.all([
    supabase
      .from("market_dashboard_mv")
      .select("data,computed_at")
      .order("computed_at", { ascending: false })
      .limit(1),
    loadTopOpps(),
  ]);
  const row = rows<{ data: Omit<MarketDashboard, "computedAt">; computed_at: string | null }>(
    "market_dashboard_mv",
    res,
  )[0];
  if (!row?.data) return null;
  // Fall back to the MV's own picks if the filtered query came back empty.
  return { ...row.data, opp: opp.length ? opp : row.data.opp, computedAt: row.computed_at ?? null };
}

// Two dashboard sections read this; `cache` keeps it to one lookup per request.
export const getMarketDashboard = cache(cached(loadDashboard, "market-dashboard"));
