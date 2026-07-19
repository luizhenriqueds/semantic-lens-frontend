import { BRL, EMPTY } from "@/lib/format";
import type { MarketStats, Region } from "@/lib/types";

export const MIN_COMPARABLES = 5;

export function hasReliableMarket(stats: MarketStats | null | undefined): boolean {
  return stats != null && (stats.sampleSize ?? 0) >= MIN_COMPARABLES;
}

// "thin" = percentiles collapse onto the median, so derived figures would be meaningless
// even though the sample is big enough.
export type MarketQuality = "none" | "thin" | "ok";

export function marketQuality(stats: MarketStats | null | undefined): MarketQuality {
  if (!hasReliableMarket(stats)) return "none";
  const { priceM2P25: p25, priceM2P75: p75 } = stats!;
  return p25 != null && p75 != null && p75 > p25 ? "ok" : "thin";
}

export function normKey(s: string | null | undefined): string {
  return (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function addressKey(
  uf: string | null,
  cidade: string | null,
  bairro: string | null,
  tipo: string | null,
): string {
  return [uf, cidade, bairro, tipo].map(normKey).join("|");
}

export function statsForRegion(stats: MarketStats[], region: Region): MarketStats[] {
  const c = normKey(region.city);
  const b = normKey(region.name);
  return stats
    .filter((s) => normKey(s.city) === c && normKey(s.neighborhood) === b)
    .sort((a, b) => (b.sampleSize ?? 0) - (a.sampleSize ?? 0));
}

export function moneyM2(n: number | null | undefined): string {
  if (n == null) return EMPTY;
  return BRL + Math.round(n).toLocaleString("pt-BR") + "/m²";
}
