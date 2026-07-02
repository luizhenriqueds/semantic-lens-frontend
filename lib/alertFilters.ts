import { moneyShort, SCORE_LABEL } from "@/lib/format";
import type { AlertFilters, Property } from "@/lib/types";

export function matchesFilters(p: Property, f: AlertFilters): boolean {
  if (f.uf && p.uf !== f.uf) return false;
  if (f.city && p.city !== f.city) return false;
  if (f.propertyType && p.propertyType !== f.propertyType) return false;
  if (f.minDiscount != null && (p.discount ?? 0) < f.minDiscount) return false;
  if (f.maxPrice != null && (p.saleValue ?? Infinity) > f.maxPrice) return false;
  if (f.minScore != null) {
    // A minimum score applies to the chosen objetivo, or to Investimento when none is set.
    const s = p.scores[f.scoreKey ?? "investment"];
    if (s == null || s < f.minScore) return false;
  } else if (f.scoreKey && p.scores[f.scoreKey] == null) {
    return false;
  }
  return true;
}

export function countMatches(properties: Property[], f: AlertFilters): number {
  return properties.reduce((n, p) => (matchesFilters(p, f) ? n + 1 : n), 0);
}

export function hasAnyFilter(f: AlertFilters): boolean {
  return (
    f.scoreKey != null ||
    f.minScore != null ||
    f.uf != null ||
    f.city != null ||
    f.propertyType != null ||
    f.minDiscount != null ||
    f.maxPrice != null
  );
}

function scoreLabel(f: AlertFilters): string | null {
  if (f.scoreKey) return SCORE_LABEL[f.scoreKey];
  if (f.minScore != null) return SCORE_LABEL.investment;
  return null;
}

export function describeFilters(f: AlertFilters): string {
  const parts: string[] = [];
  const label = scoreLabel(f);
  if (label) parts.push(label);
  if (f.minScore != null) parts.push(`nota ≥ ${f.minScore}`);
  if (f.propertyType) parts.push(f.propertyType);
  const loc = f.city ? `${f.city}${f.uf ? `/${f.uf}` : ""}` : f.uf;
  if (loc) parts.push(`em ${loc}`);
  if (f.minDiscount != null) parts.push(`desconto ≥ ${f.minDiscount}%`);
  if (f.maxPrice != null) parts.push(`até ${moneyShort(f.maxPrice)}`);
  if (!parts.length) return "Novos imóveis";
  const s = parts.join(" · ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function filterChips(f: AlertFilters): string[] {
  const chips: string[] = [];
  const label = scoreLabel(f);
  if (label) chips.push(label);
  if (f.minScore != null) chips.push(`Nota ≥ ${f.minScore}`);
  if (f.propertyType) chips.push(f.propertyType);
  if (f.city) chips.push(f.city);
  else if (f.uf) chips.push(f.uf);
  if (f.minDiscount != null) chips.push(`Desconto ≥ ${f.minDiscount}%`);
  if (f.maxPrice != null) chips.push(`Até ${moneyShort(f.maxPrice)}`);
  return chips;
}
