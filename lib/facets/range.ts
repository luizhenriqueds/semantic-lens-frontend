import { moneyShort } from "@/lib/format";

// Drill-down from the analysis histograms: one bucket of one dimension, carried in the URL
// as ?dim=price&from=100000&to=200000 so a bar click lands on a pre-filtered list.
export type RangeDim = "price" | "discount" | "area" | "invest";

export type RangeFilter = { dim: RangeDim; from: number; to: number };

const DIMS: Record<RangeDim, { label: string; fmt: (v: number) => string }> = {
  price: { label: "Preço", fmt: moneyShort },
  discount: { label: "Desconto", fmt: (v) => `${Math.round(v)}%` },
  area: { label: "Área", fmt: (v) => `${Math.round(v)} m²` },
  invest: { label: "Nota de investimento", fmt: (v) => String(Math.round(v)) },
};

export const fmtValue = (dim: RangeDim, v: number) => DIMS[dim].fmt(v);

// "R$ 100 mil - R$ 200 mil" / "90 ou mais"
export function fmtBucket(dim: RangeDim, from: number, to: number): string {
  return to === Infinity
    ? `${fmtValue(dim, from)} ou mais`
    : `${fmtValue(dim, from)} - ${fmtValue(dim, to)}`;
}

const isDim = (v: string): v is RangeDim => v in DIMS;

export function parseRange(
  dim?: string | null,
  from?: string | null,
  to?: string | null,
): RangeFilter | undefined {
  if (!dim || !isDim(dim)) return undefined;
  const f = Number(from);
  const t = to === "" || to == null ? Infinity : Number(to);
  if (!isFinite(f) || isNaN(t)) return undefined;
  return { dim, from: f, to: t };
}

export function rangeHref(dim: RangeDim, from: number, to: number): string {
  return `/properties?range_dim=${dim}&range_from=${from}&range_to=${to === Infinity ? "" : to}&view=list`;
}

export function rangeLabel(r: RangeFilter): string {
  return `${DIMS[r.dim].label}: ${fmtBucket(r.dim, r.from, r.to)}`;
}
