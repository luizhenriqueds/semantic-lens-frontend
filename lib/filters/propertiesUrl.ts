import { clampQuery, MAX_PROPERTIES_Q_TOKENS, MAX_QUERY_CHARS } from "@/lib/facets/limits";
import { parseRange } from "@/lib/facets/range";
import { CHANGE_KINDS } from "@/lib/types";
import type {
  AlertCriteriaSet,
  PropertyChangeKind,
  PropertyFilters,
  PropertySort,
  Scores,
} from "@/lib/types";

// Shared by the server loader and the client Pagination so the two cannot drift.
export const LIST_PAGE_SIZE = 24;

export type PropertiesView = "list" | "analysis" | "calendar" | "map";

const VIEWS = new Set<string>(["list", "analysis", "calendar", "map"]);
const CHANGE_KIND_SET = new Set<string>(CHANGE_KINDS);

// Long enough that the rarer half (financing/FGTS starts, ~48/day) still fills a rail.
export const CHANGE_WINDOW_DAYS = 30;

export type SortParam =
  "discount" | "auction" | "investment" | "score" | "price_asc" | "price_desc";

export const PROPERTY_SORTS: { param: SortParam; sort: PropertySort; label: string }[] = [
  { param: "discount", sort: "desconto", label: "Maior desconto" },
  { param: "auction", sort: "leilao", label: "Data do leilão (mais próxima)" },
  { param: "investment", sort: "investimento", label: "Melhor investimento" },
  { param: "score", sort: "score", label: "Melhor nota do objetivo" },
  { param: "price_asc", sort: "menor", label: "Menor preço" },
  { param: "price_desc", sort: "maior", label: "Maior preço" },
];

export const DEFAULT_SORT: SortParam = "discount";

const BY_PARAM = new Map(PROPERTY_SORTS.map((s) => [s.param as string, s]));
const BY_LEGACY = new Map(PROPERTY_SORTS.map((s) => [s.sort as string, s]));

// Derived, so the URL default and the parsed default cannot drift apart.
const FALLBACK_SORT = BY_PARAM.get(DEFAULT_SORT)!.sort;

export const parsePropertySort = (v: string | undefined): PropertySort =>
  (BY_PARAM.get(v ?? "") ?? BY_LEGACY.get(v ?? ""))?.sort ?? FALLBACK_SORT;

export const sortParam = (sort: PropertySort): SortParam =>
  PROPERTY_SORTS.find((s) => s.sort === sort)?.param ?? DEFAULT_SORT;

const SCORE_KEYS = new Set<string>([
  "flip",
  "liquidity",
  "airbnb",
  "student",
  "family",
  "commercial",
  "convenience",
  "investment",
]);

export type PropertiesQuery = {
  filters: PropertyFilters;
  sort: PropertySort;
  page: number;
  view: PropertiesView;
  day: string | null;
};

type SP = Record<string, string | string[] | undefined>;

// Params the contract keys replaced. Drop after one release, with BY_LEGACY above.
const LEGACY_PARAMS: Record<string, string> = {
  tipo: "type",
  mod: "modalities",
  cluster: "cluster_id",
  dim: "range_dim",
  from: "range_from",
  to: "range_to",
  quartos: "min_bedrooms",
  preco: "max_price",
  area: "min_area",
  poi: "poi_cats",
  pois: "poi_ids",
  raio: "poi_radius_m",
  centro: "max_center_m",
  desconto: "min_discount",
  invest: "min_investment",
  fachada: "min_visual_score",
  mudou: "change_kinds",
  dias: "changed_within_days",
  goal: "score_key",
  goalMin: "score_min",
  fin: "financing",
  prazo: "auction_within_days",
};

function canonical(sp: SP): SP {
  const out: SP = { ...sp };
  for (const [legacy, key] of Object.entries(LEGACY_PARAMS)) {
    if (out[key] === undefined && out[legacy] !== undefined) out[key] = out[legacy];
  }
  return out;
}

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

const posInt = (v: string | undefined): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const list = (v: string | undefined): string[] | undefined => {
  const parts = (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
};

export function parsePropertySearchParams(raw: SP): PropertiesQuery {
  const sp = canonical(raw);
  const filters: PropertyFilters = {};
  // At the URL, not just before the RPC, so the chip and the alert description match what ran.
  const q = clampQuery(one(sp.q) ?? "", MAX_QUERY_CHARS, MAX_PROPERTIES_Q_TOKENS);
  if (q) filters.q = q;
  const uf = one(sp.uf);
  if (uf) filters.uf = uf;
  const city = one(sp.city);
  if (city) filters.city = city;
  const type = one(sp.type);
  if (type) filters.type = type;
  const modalities = list(one(sp.modalities));
  if (modalities) filters.modalities = modalities;
  const clusterId = posInt(one(sp.cluster_id)) ?? (one(sp.cluster_id) === "0" ? 0 : undefined);
  if (clusterId != null) filters.clusterId = clusterId;
  const h3 = one(sp.h3);
  if (h3) filters.h3 = h3;
  const range = parseRange(one(sp.range_dim), one(sp.range_from), one(sp.range_to));
  if (range) filters.range = range;
  const minBedrooms = posInt(one(sp.min_bedrooms));
  if (minBedrooms) filters.minBedrooms = minBedrooms;
  const maxPrice = posInt(one(sp.max_price));
  if (maxPrice) filters.maxPrice = maxPrice;
  const minArea = posInt(one(sp.min_area));
  if (minArea) filters.minArea = minArea;
  const poiCats = list(one(sp.poi_cats));
  if (poiCats) {
    filters.poiCats = poiCats;
    filters.poiRadiusM = posInt(one(sp.poi_radius_m)) ?? 2000;
  }
  const poiIds = list(one(sp.poi_ids))
    ?.map(Number)
    .filter((n) => Number.isInteger(n));
  if (poiIds?.length) {
    filters.poiIds = poiIds;
    filters.poiRadiusM = posInt(one(sp.poi_radius_m)) ?? 2000;
  }
  const maxCenterM = posInt(one(sp.max_center_m));
  if (maxCenterM) filters.maxCenterM = maxCenterM;
  const minDiscount = posInt(one(sp.min_discount));
  if (minDiscount) filters.minDiscount = minDiscount;
  const minInvestment = posInt(one(sp.min_investment));
  if (minInvestment) filters.minInvestment = minInvestment;
  const minVisualScore = posInt(one(sp.min_visual_score));
  if (minVisualScore) filters.minVisualScore = Math.min(100, minVisualScore);
  // `change_kind` is the pre-multi-select param, still carried by saved alerts and shared links.
  const changeKinds = (list(one(sp.change_kinds)) ?? list(one(sp.change_kind)) ?? []).filter((k) =>
    CHANGE_KIND_SET.has(k),
  ) as PropertyChangeKind[];
  if (changeKinds.length) {
    filters.changeKinds = changeKinds;
    filters.changedWithinDays = posInt(one(sp.changed_within_days)) ?? CHANGE_WINDOW_DAYS;
  }
  // Threshold optional, as in the RPC contract: alerts saved from a goal carry no `score_min`.
  const scoreKey = one(sp.score_key);
  if (scoreKey && SCORE_KEYS.has(scoreKey)) {
    filters.scoreKey = scoreKey as keyof Scores;
    const scoreMin = posInt(one(sp.score_min));
    if (scoreMin) filters.scoreMin = scoreMin;
  }
  if (one(sp.financing) === "1") filters.financing = true;
  if (one(sp.fgts) === "1") filters.fgts = true;
  const auctionWithinDays = posInt(one(sp.auction_within_days));
  if (auctionWithinDays) filters.auctionWithinDays = auctionWithinDays;
  const firstSeenWithinDays = posInt(one(sp.first_seen_within_days));
  if (firstSeenWithinDays) filters.firstSeenWithinDays = firstSeenWithinDays;

  const viewRaw = one(sp.view) ?? "";
  const sortRaw = one(sp.sort) ?? "";
  const dayRaw = one(sp.day) ?? "";
  return {
    filters,
    sort: parsePropertySort(sortRaw),
    page: posInt(one(sp.page)) ?? 1,
    view: (VIEWS.has(viewRaw) ? viewRaw : "list") as PropertiesView,
    day: /^\d{4}-\d{2}-\d{2}$/.test(dayRaw) ? dayRaw : null,
  };
}

export function criteriaToParams(c: AlertCriteriaSet): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(c)) {
    if (v == null || v === "" || v === false) continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(","));
    } else if (typeof v === "number") {
      if (Number.isFinite(v)) sp.set(k, String(v));
    } else {
      sp.set(k, v === true ? "1" : String(v));
    }
  }
  return sp.toString();
}
