import { moneyShort, PROFILE_SHORT, scoreForProfile } from "@/lib/format";
import type { AlertFilters, Property } from "@/lib/types";

export function matchesFilters(p: Property, f: AlertFilters): boolean {
  if (f.uf && p.uf !== f.uf) return false;
  if (f.cidade && p.cidade !== f.cidade) return false;
  if (f.tipo && p.tipo !== f.tipo) return false;
  if (f.minDesconto != null && (p.desc ?? 0) < f.minDesconto) return false;
  if (f.maxPreco != null && (p.lance ?? Infinity) > f.maxPreco) return false;
  if (f.profile) {
    const s = scoreForProfile(p, f.profile);
    if (s == null) return false;
    if (f.minScore != null && s < f.minScore) return false;
  }
  return true;
}

export function countMatches(properties: Property[], f: AlertFilters): number {
  return properties.reduce((n, p) => (matchesFilters(p, f) ? n + 1 : n), 0);
}

export function hasAnyFilter(f: AlertFilters): boolean {
  return (
    f.profile != null ||
    f.minScore != null ||
    f.uf != null ||
    f.cidade != null ||
    f.tipo != null ||
    f.minDesconto != null ||
    f.maxPreco != null
  );
}

export function describeFilters(f: AlertFilters): string {
  const parts: string[] = [];
  if (f.profile) parts.push(PROFILE_SHORT[f.profile]);
  if (f.minScore != null) parts.push(`nota ≥ ${f.minScore}`);
  if (f.tipo) parts.push(f.tipo);
  const loc = f.cidade ? `${f.cidade}${f.uf ? `/${f.uf}` : ""}` : f.uf;
  if (loc) parts.push(`em ${loc}`);
  if (f.minDesconto != null) parts.push(`desconto ≥ ${f.minDesconto}%`);
  if (f.maxPreco != null) parts.push(`até ${moneyShort(f.maxPreco)}`);
  if (!parts.length) return "Novos imóveis";
  const s = parts.join(" · ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function filterChips(f: AlertFilters): string[] {
  const chips: string[] = [];
  if (f.profile) chips.push(PROFILE_SHORT[f.profile]);
  if (f.minScore != null) chips.push(`Nota ≥ ${f.minScore}`);
  if (f.tipo) chips.push(f.tipo);
  if (f.cidade) chips.push(f.cidade);
  else if (f.uf) chips.push(f.uf);
  if (f.minDesconto != null) chips.push(`Desconto ≥ ${f.minDesconto}%`);
  if (f.maxPreco != null) chips.push(`Até ${moneyShort(f.maxPreco)}`);
  return chips;
}
