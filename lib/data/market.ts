import { addressKey } from "@/lib/market";
import { supabase } from "@/lib/supabase";
import type { MarketHistoryPoint, MarketStats } from "@/lib/types";
import { cached, fetchAllRows, num, rows, withRetry } from "./client";

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
  const all = await fetchAllRows<any>("market_address_stats", (f, t) =>
    supabase.from("market_address_stats").select(STATS_COLS).order("address_key").range(f, t),
  );
  return all.map((r) => ({
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

// Size-matched market comparables for one property (see
// docs/backend-market-comparables-spec.md).
async function loadMarketComparables(
  uf: string | null,
  city: string | null,
  neighborhood: string | null,
  propertyType: string | null,
  area: number | null,
): Promise<MarketStats | null> {
  const key = addressKey(uf, city, neighborhood, propertyType);
  const res = await withRetry(() =>
    supabase.rpc("market_comparable_stats", { p_address_key: key, p_area: area }),
  );
  const row = rows<any>("market_comparable_stats", res)[0];
  if (!row || !num(row.sample_size)) return null;
  return {
    addressKey: key,
    uf,
    city,
    neighborhood,
    propertyType,
    sampleSize: num(row.sample_size),
    priceMedian: num(row.price_median),
    areaMedian: num(row.area_median),
    priceM2Median: num(row.price_m2_median),
    priceM2P25: num(row.price_m2_p25),
    priceM2P75: num(row.price_m2_p75),
    computedAt: row.computed_at ?? null,
    sizeMatched: !!row.size_matched,
  };
}

export const getMarketStats = cached(loadMarketStats, "market-stats");
export const getMarketHistory = cached(loadMarketHistory, "market-history");
export const getMarketComparables = cached(loadMarketComparables, "market-comparables");
