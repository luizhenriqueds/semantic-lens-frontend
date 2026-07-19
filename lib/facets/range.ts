import { moneyShort } from "@/lib/format";
import type { Property } from "@/lib/types";

// Drill-down from the analysis histograms: one bucket of one dimension, carried in the URL
// as ?dim=price&from=100000&to=200000 so a bar click lands on a pre-filtered list.
export type RangeDim = "price" | "discount" | "area" | "invest";

export type RangeFilter = { dim: RangeDim; from: number; to: number };

const DIMS: Record<
  RangeDim,
  { label: string; value: (p: Property) => number | null; fmt: (v: number) => string }
> = {
  price: { label: "Preço", value: (p) => p.saleValue, fmt: moneyShort },
  // Zero/negative discounts are charted as absent, so they must not match a bucket either.
  discount: {
    label: "Desconto",
    value: (p) => (p.discount && p.discount > 0 ? p.discount : null),
    fmt: (v) => `${Math.round(v)}%`,
  },
  area: { label: "Área", value: (p) => p.area, fmt: (v) => `${Math.round(v)} m²` },
  invest: {
    label: "Nota de investimento",
    value: (p) => p.scores.investment,
    fmt: (v) => String(Math.round(v)),
  },
};

// Single source for a dimension's value + formatting, shared by the histograms that
// chart the buckets and the filter chip that names the one you clicked.
export const dimValue = (dim: RangeDim, p: Property) => DIMS[dim].value(p);
export const fmtValue = (dim: RangeDim, v: number) => DIMS[dim].fmt(v);

// "R$ 100 mil – R$ 200 mil" / "90 ou mais"
export function fmtBucket(dim: RangeDim, from: number, to: number): string {
  return to === Infinity
    ? `${fmtValue(dim, from)} ou mais`
    : `${fmtValue(dim, from)} – ${fmtValue(dim, to)}`;
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
  return `/properties?dim=${dim}&from=${from}&to=${to === Infinity ? "" : to}&view=list`;
}

export function matchesRange(p: Property, r: RangeFilter): boolean {
  const v = DIMS[r.dim].value(p);
  if (v == null) return false;
  return v >= r.from && (r.to === Infinity || v < r.to);
}

export function rangeLabel(r: RangeFilter): string {
  return `${DIMS[r.dim].label}: ${fmtBucket(r.dim, r.from, r.to)}`;
}
