import { fmtDist, moneyShort, SCORE_LABEL } from "@/lib/format";
import { POI_LABEL } from "@/lib/pois";
import type { AlertFilters, PropertyFilters } from "@/lib/types";

// Bridge to the server-side filter contract used by countProperties().
export function alertToPropertyFilters(f: AlertFilters): PropertyFilters {
  const out: PropertyFilters = {};
  if (f.q?.trim()) out.q = f.q.trim();
  if (f.uf) out.uf = f.uf;
  if (f.city) out.city = f.city;
  if (f.propertyType) out.type = f.propertyType;
  if (f.modalities?.length) out.modalities = f.modalities;
  if (f.minDiscount != null) out.minDiscount = f.minDiscount;
  if (f.maxPrice != null) out.maxPrice = f.maxPrice;
  if (f.minBedrooms != null) out.minBedrooms = f.minBedrooms;
  if (f.minArea != null) out.minArea = f.minArea;
  if (f.poiCats?.length) {
    out.poiCats = f.poiCats;
    out.poiRadiusM = f.poiRadius ?? 2000;
  }
  if (f.maxCenter != null) out.maxCenterM = f.maxCenter;
  if (f.minScore != null) {
    out.scoreKey = f.scoreKey ?? "investment";
    out.scoreMin = f.minScore;
  } else if (f.scoreKey) {
    out.scoreKey = f.scoreKey;
  }
  return out;
}

export function hasAnyFilter(f: AlertFilters): boolean {
  return (
    !!f.q?.trim() ||
    f.scoreKey != null ||
    f.minScore != null ||
    f.uf != null ||
    f.city != null ||
    f.propertyType != null ||
    (f.modalities != null && f.modalities.length > 0) ||
    f.minDiscount != null ||
    f.maxPrice != null ||
    f.minBedrooms != null ||
    f.minArea != null ||
    (f.poiCats != null && f.poiCats.length > 0) ||
    f.maxCenter != null
  );
}

function scoreLabel(f: AlertFilters): string | null {
  if (f.scoreKey) return SCORE_LABEL[f.scoreKey];
  if (f.minScore != null) return SCORE_LABEL.investment;
  return null;
}

export function describeFilters(f: AlertFilters): string {
  const parts: string[] = [];
  if (f.q?.trim()) parts.push(`“${f.q.trim()}”`);
  const label = scoreLabel(f);
  if (label) parts.push(label);
  if (f.minScore != null) parts.push(`nota ≥ ${f.minScore}`);
  if (f.propertyType) parts.push(f.propertyType);
  if (f.modalities?.length) parts.push(f.modalities.join(", "));
  const loc = f.city ? `${f.city}${f.uf ? `/${f.uf}` : ""}` : f.uf;
  if (loc) parts.push(`em ${loc}`);
  if (f.minDiscount != null) parts.push(`desconto ≥ ${f.minDiscount}%`);
  if (f.maxPrice != null) parts.push(`até ${moneyShort(f.maxPrice)}`);
  if (f.minBedrooms != null) parts.push(`${f.minBedrooms}+ quartos`);
  if (f.minArea != null) parts.push(`${f.minArea}+ m²`);
  if (f.poiCats?.length)
    parts.push(`perto de ${f.poiCats.map((c) => POI_LABEL[c] ?? c).join(", ")}`);
  if (f.maxCenter != null) parts.push(`até ${fmtDist(f.maxCenter)} do centro`);
  if (!parts.length) return "Novos imóveis";
  const s = parts.join(" · ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function filterChips(f: AlertFilters): string[] {
  const chips: string[] = [];
  if (f.q?.trim()) chips.push(`“${f.q.trim()}”`);
  const label = scoreLabel(f);
  if (label) chips.push(label);
  if (f.minScore != null) chips.push(`Nota ≥ ${f.minScore}`);
  if (f.propertyType) chips.push(f.propertyType);
  if (f.modalities?.length) for (const m of f.modalities) chips.push(m);
  if (f.city) chips.push(f.city);
  else if (f.uf) chips.push(f.uf);
  if (f.minDiscount != null) chips.push(`Desconto ≥ ${f.minDiscount}%`);
  if (f.maxPrice != null) chips.push(`Até ${moneyShort(f.maxPrice)}`);
  if (f.minBedrooms != null) chips.push(`${f.minBedrooms}+ quartos`);
  if (f.minArea != null) chips.push(`${f.minArea}+ m²`);
  if (f.poiCats?.length) {
    const r = f.poiRadius ?? 2000;
    for (const c of f.poiCats) chips.push(`${POI_LABEL[c] ?? c} · até ${fmtDist(r)}`);
  }
  if (f.maxCenter != null) chips.push(`Até ${fmtDist(f.maxCenter)} do centro`);
  return chips;
}
