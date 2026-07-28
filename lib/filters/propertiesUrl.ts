import { parseRange } from "@/lib/facets/range";
import type { PropertyFilters, PropertySort, Scores } from "@/lib/types";

// Shared by the server loader and the client Pagination so the two cannot drift.
export const LIST_PAGE_SIZE = 24;

export type PropertiesView = "list" | "analysis" | "calendar" | "map";

const VIEWS = new Set<string>(["list", "analysis", "calendar", "map"]);
const SORTS = new Set<string>(["leilao", "investimento", "desconto", "score", "menor", "maior"]);
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

export function parsePropertySearchParams(sp: SP): PropertiesQuery {
  const filters: PropertyFilters = {};
  const q = one(sp.q)?.trim();
  if (q) filters.q = q;
  const uf = one(sp.uf);
  if (uf) filters.uf = uf;
  const city = one(sp.city);
  if (city) filters.city = city;
  const tipo = one(sp.tipo);
  if (tipo) filters.type = tipo;
  const mod = list(one(sp.mod));
  if (mod) filters.modalities = mod;
  const cluster = posInt(one(sp.cluster)) ?? (one(sp.cluster) === "0" ? 0 : undefined);
  if (cluster != null) filters.clusterId = cluster;
  const h3 = one(sp.h3);
  if (h3) filters.h3 = h3;
  const range = parseRange(one(sp.dim), one(sp.from), one(sp.to));
  if (range) filters.range = range;
  const quartos = posInt(one(sp.quartos));
  if (quartos) filters.minBedrooms = quartos;
  const preco = posInt(one(sp.preco));
  if (preco) filters.maxPrice = preco;
  const area = posInt(one(sp.area));
  if (area) filters.minArea = area;
  const poi = list(one(sp.poi));
  if (poi) {
    filters.poiCats = poi;
    filters.poiRadiusM = posInt(one(sp.raio)) ?? 2000;
  }
  const centro = posInt(one(sp.centro));
  if (centro) filters.maxCenterM = centro;
  const desconto = posInt(one(sp.desconto));
  if (desconto) filters.minDiscount = desconto;
  const invest = posInt(one(sp.invest));
  if (invest) filters.minInvestment = invest;
  const fachada = posInt(one(sp.fachada));
  if (fachada) filters.minVisualScore = Math.min(100, fachada);
  const goal = one(sp.goal);
  const goalMin = posInt(one(sp.goalMin));
  if (goal && SCORE_KEYS.has(goal) && goalMin) {
    filters.scoreKey = goal as keyof Scores;
    filters.scoreMin = goalMin;
  }
  if (one(sp.fin) === "1") filters.financing = true;
  if (one(sp.fgts) === "1") filters.fgts = true;
  const prazo = posInt(one(sp.prazo));
  if (prazo) filters.auctionWithinDays = prazo;

  const viewRaw = one(sp.view) ?? "";
  const sortRaw = one(sp.sort) ?? "";
  const dayRaw = one(sp.day) ?? "";
  return {
    filters,
    sort: (SORTS.has(sortRaw) ? sortRaw : "desconto") as PropertySort,
    page: posInt(one(sp.page)) ?? 1,
    view: (VIEWS.has(viewRaw) ? viewRaw : "list") as PropertiesView,
    day: /^\d{4}-\d{2}-\d{2}$/.test(dayRaw) ? dayRaw : null,
  };
}
