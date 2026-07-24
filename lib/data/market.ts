import { addressKey } from "@/lib/market";
import { supabase } from "@/lib/supabase";
import type { MarketStats } from "@/lib/types";
import { cached, fetchAllRows, num, rows, withRetry } from "./client";

const STATS_COLS = [
  "address_key,uf,city,neighborhood,property_type,sample_size",
  "price_median,area_median,price_m2_median,price_m2_p25,price_m2_p75,computed_at",
].join(",");

function mapMarketStat(r: any): MarketStats {
  return {
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
  };
}

// One city's rows (statsForRegion filters by neighborhood), not the whole table.
async function loadMarketStatsForCity(city: string): Promise<MarketStats[]> {
  if (!city.trim()) return [];
  const all = await fetchAllRows<any>("market_address_stats-city", (f, t) =>
    supabase
      .from("market_address_stats")
      .select(STATS_COLS)
      .ilike("city", city)
      .order("address_key")
      .range(f, t),
  );
  return all.map(mapMarketStat);
}

export const getMarketStatsForCity = cached(loadMarketStatsForCity, "market-stats-city");

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

export const getMarketComparables = cached(loadMarketComparables, "market-comparables");
