import { supabase } from "@/lib/supabase";
import type { MarketHistoryPoint, MarketStats } from "@/lib/types";
import { cached, num, rows, withRetry } from "./client";

const HISTORY_COLS = "address_key,computed_at,price_median,price_m2_median,sample_size";

const STATS_COLS = [
  "address_key,uf,city,neighborhood,property_type,sample_size",
  "price_median,area_median,price_m2_median,price_m2_p25,price_m2_p75,computed_at",
].join(",");

async function loadMarketHistory(addressKey: string): Promise<MarketHistoryPoint[]> {
  const res = await withRetry(() =>
    supabase
      .from("market_address_stat_history")
      .select(HISTORY_COLS)
      .eq("address_key", addressKey)
      .order("computed_at", { ascending: true }),
  );
  return rows<any>("market-history", res)
    .filter((r) => r.computed_at)
    .map((r) => ({
      date: String(r.computed_at),
      priceMedian: num(r.price_median),
      priceM2Median: num(r.price_m2_median),
      sampleSize: num(r.sample_size),
    }));
}

async function loadMarketStats(): Promise<MarketStats[]> {
  const res = await withRetry(() => supabase.from("market_address_stats").select(STATS_COLS));
  return rows<any>("market_address_stats", res).map((r) => ({
    addressKey: r.address_key,
    uf: r.uf ?? null,
    city: r.city ?? null,
    neighborhood: r.neighborhood ?? null,
    propertyType: r.property_type ?? null,
    sampleSize: num(r.sample_size),
    priceMedian: num(r.price_median),
    areaMedian: num(r.area_median),
    priceM2Median: num(r.price_m2_median),
    priceM2P25: num(r.price_m2_p25),
    priceM2P75: num(r.price_m2_p75),
    computedAt: r.computed_at ?? null,
  }));
}

export const getMarketStats = cached(loadMarketStats, "market-stats");
export const getMarketHistory = cached(loadMarketHistory, "market-history");
