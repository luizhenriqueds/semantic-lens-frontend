import type { MarketStats, Property, Region } from "@/lib/types";

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

export function statsForProperty(stats: MarketStats[], p: Property): MarketStats | null {
  const key = addressKey(p.uf, p.city, p.neighborhood, p.propertyType);
  return stats.find((s) => s.addressKey === key) ?? null;
}

export function statsForRegion(stats: MarketStats[], region: Region): MarketStats[] {
  const c = normKey(region.city);
  const b = normKey(region.name);
  return stats
    .filter((s) => normKey(s.city) === c && normKey(s.neighborhood) === b)
    .sort((a, b) => (b.sampleSize ?? 0) - (a.sampleSize ?? 0));
}

export function moneyM2(n: number | null | undefined): string {
  if (n == null) return "—";
  return "R$ " + Math.round(n).toLocaleString("pt-BR") + "/m²";
}
