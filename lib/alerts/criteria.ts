import { POI_RADIUS_M } from "@/lib/pois";
import type { AlertCriteria, AlertCriteriaAny, AlertCriteriaSet, Scores } from "@/lib/types";

const CRITERIA_KEYS = [
  "q",
  "uf",
  "city",
  "type",
  "modalities",
  "cluster_id",
  "h3",
  "range_dim",
  "range_from",
  "range_to",
  "min_bedrooms",
  "bedrooms_eq",
  "max_price",
  "min_area",
  "min_discount",
  "min_investment",
  "min_visual_score",
  "poi_ids",
  "poi_cats",
  "poi_radius_m",
  "max_center_m",
  "change_kind",
  "changed_within_days",
  "score_key",
  "score_min",
  "financing",
  "fgts",
  "auction_within_days",
] as const satisfies readonly (keyof AlertCriteriaSet)[];

type Unlisted = Exclude<keyof AlertCriteriaSet, (typeof CRITERIA_KEYS)[number]>;
const _allKeysListed: Unlisted extends never ? true : never = true;
void _allKeysListed;

const KEY_SET = new Set<string>(CRITERIA_KEYS);

export const isAnyCriteria = (c: AlertCriteria): c is AlertCriteriaAny =>
  "any" in c && Array.isArray((c as AlertCriteriaAny).any);

export const branchesOf = (c: AlertCriteria): AlertCriteriaSet[] =>
  isAnyCriteria(c) ? c.any : [c];

const isEmptyValue = (v: unknown) =>
  v == null || v === "" || v === false || (Array.isArray(v) && v.length === 0);

function sanitizeSet(raw: unknown): AlertCriteriaSet {
  if (raw == null || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (KEY_SET.has(k) && !isEmptyValue(v)) out[k] = v;
  }
  return out as AlertCriteriaSet;
}

/** Null when nothing usable is left: empty criteria match every new property. */
export function sanitizeCriteria(raw: unknown): AlertCriteria | null {
  if (raw == null || typeof raw !== "object") return null;
  if (isAnyCriteria(raw as AlertCriteria)) {
    const branches = (raw as AlertCriteriaAny).any.map(sanitizeSet).filter(hasAnySet);
    if (!branches.length) return null;
    return branches.length === 1 ? branches[0] : { any: branches };
  }
  const set = sanitizeSet(raw);
  return hasAnySet(set) ? set : null;
}

const hasAnySet = (c: AlertCriteriaSet): boolean => Object.keys(c).length > 0;

const stable = (v: unknown): string =>
  JSON.stringify(v ?? null, (_k, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );

/** Key-order insensitive: a set rebuilt from the URL has to compare equal to the stored one. */
export const sameCriteria = (
  a: AlertCriteria | null | undefined,
  b: AlertCriteria | null | undefined,
): boolean => stable(a) === stable(b);

/**
 * Cache identity for a criteria set. Sanitised as well as sorted, so a draft built in the form and
 * the same criteria read back through jsonb hash alike - they differ in key order and in the empty
 * values the form leaves behind.
 */
export const criteriaKey = (c: AlertCriteria | null | undefined): string =>
  stable(sanitizeCriteria(c));

export const hasAnyCriteria = (c: AlertCriteria | null | undefined): boolean =>
  c != null && branchesOf(c).some(hasAnySet);

// The shape alerts were saved in before `criteria` held the RPC contract.
type LegacyFilters = {
  q?: string;
  scoreKey?: keyof Scores;
  minScore?: number;
  uf?: string;
  city?: string;
  propertyType?: string;
  modalities?: string[];
  minDiscount?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  poiCats?: string[];
  poiRadius?: number;
  maxCenter?: number;
};

export function isLegacyCriteria(raw: unknown): boolean {
  if (raw == null || typeof raw !== "object" || isAnyCriteria(raw as AlertCriteria)) return false;
  return Object.keys(raw as object).some((k) => !KEY_SET.has(k));
}

/** Key-for-key rename. `q` is carried over as-is rather than re-resolved. */
export function fromLegacyCriteria(raw: unknown): AlertCriteria | null {
  const f = (raw ?? {}) as LegacyFilters;
  const out: AlertCriteriaSet = {};
  if (f.q?.trim()) out.q = f.q.trim();
  if (f.uf) out.uf = f.uf;
  if (f.city) out.city = f.city;
  if (f.propertyType) out.type = f.propertyType;
  if (f.modalities?.length) out.modalities = f.modalities;
  if (f.minDiscount != null) out.min_discount = f.minDiscount;
  if (f.maxPrice != null) out.max_price = f.maxPrice;
  if (f.minBedrooms != null) out.min_bedrooms = f.minBedrooms;
  if (f.minArea != null) out.min_area = f.minArea;
  if (f.poiCats?.length) {
    out.poi_cats = f.poiCats;
    out.poi_radius_m = f.poiRadius ?? POI_RADIUS_M;
  }
  if (f.maxCenter != null) out.max_center_m = f.maxCenter;
  if (f.minScore != null) {
    out.score_key = f.scoreKey ?? "investment";
    out.score_min = f.minScore;
  } else if (f.scoreKey) {
    out.score_key = f.scoreKey;
  }
  return sanitizeCriteria(out);
}
