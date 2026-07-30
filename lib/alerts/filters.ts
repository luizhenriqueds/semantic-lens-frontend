import { fmtDist, moneyShort, SCORE_LABEL } from "@/lib/format";
import { POI_LABEL, POI_RADIUS_M } from "@/lib/pois";
import type { AlertCriteria, AlertCriteriaSet } from "@/lib/types";
import { branchesOf } from "./criteria";

const placeLabel = (ids: number[]) =>
  ids.length > 1 ? "perto dos locais selecionados" : "perto do local selecionado";

const radiusOf = (c: AlertCriteriaSet) => c.poi_radius_m ?? POI_RADIUS_M;

function scoreLabel(c: AlertCriteriaSet): string | null {
  if (c.score_key) return SCORE_LABEL[c.score_key];
  if (c.score_min != null) return SCORE_LABEL.investment;
  return null;
}

function describeSet(c: AlertCriteriaSet): string {
  const parts: string[] = [];
  if (c.q?.trim()) parts.push(`“${c.q.trim()}”`);
  const label = scoreLabel(c);
  if (label) parts.push(label);
  if (c.score_min != null) parts.push(`nota ≥ ${c.score_min}`);
  if (c.type) parts.push(c.type);
  if (c.modalities?.length) parts.push(c.modalities.join(", "));
  const loc = c.city ? `${c.city}${c.uf ? `/${c.uf}` : ""}` : c.uf;
  if (loc) parts.push(`em ${loc}`);
  if (c.min_discount != null) parts.push(`desconto ≥ ${c.min_discount}%`);
  if (c.max_price != null) parts.push(`até ${moneyShort(c.max_price)}`);
  if (c.min_bedrooms != null) parts.push(`${c.min_bedrooms}+ quartos`);
  if (c.min_area != null) parts.push(`${c.min_area}+ m²`);
  if (c.poi_ids?.length) parts.push(`${placeLabel(c.poi_ids)} (${fmtDist(radiusOf(c))})`);
  if (c.poi_cats?.length)
    parts.push(`perto de ${c.poi_cats.map((p) => POI_LABEL[p] ?? p).join(", ")}`);
  if (c.max_center_m != null) parts.push(`até ${fmtDist(c.max_center_m)} do centro`);
  if (!parts.length) return "Novos imóveis";
  const s = parts.join(" · ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function describeCriteria(c: AlertCriteria): string {
  return branchesOf(c).map(describeSet).join(" ou ");
}

function setChips(c: AlertCriteriaSet): string[] {
  const chips: string[] = [];
  if (c.q?.trim()) chips.push(`“${c.q.trim()}”`);
  const label = scoreLabel(c);
  if (label) chips.push(label);
  if (c.score_min != null) chips.push(`Nota ≥ ${c.score_min}`);
  if (c.type) chips.push(c.type);
  if (c.modalities?.length) for (const m of c.modalities) chips.push(m);
  if (c.city) chips.push(c.city);
  else if (c.uf) chips.push(c.uf);
  if (c.min_discount != null) chips.push(`Desconto ≥ ${c.min_discount}%`);
  if (c.max_price != null) chips.push(`Até ${moneyShort(c.max_price)}`);
  if (c.min_bedrooms != null) chips.push(`${c.min_bedrooms}+ quartos`);
  if (c.min_area != null) chips.push(`${c.min_area}+ m²`);
  if (c.poi_ids?.length) {
    const s = placeLabel(c.poi_ids);
    chips.push(`${s.charAt(0).toUpperCase()}${s.slice(1)} · até ${fmtDist(radiusOf(c))}`);
  }
  if (c.poi_cats?.length)
    for (const p of c.poi_cats) chips.push(`${POI_LABEL[p] ?? p} · até ${fmtDist(radiusOf(c))}`);
  if (c.max_center_m != null) chips.push(`Até ${fmtDist(c.max_center_m)} do centro`);
  return chips;
}

export function criteriaChips(c: AlertCriteria): string[] {
  const branches = branchesOf(c);
  return branches.length === 1
    ? setChips(branches[0])
    : branches.map((b) => setChips(b).join(" · ")).filter(Boolean);
}
