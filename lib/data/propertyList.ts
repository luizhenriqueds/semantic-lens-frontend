import { supabase } from "@/lib/supabase";
import { deriveTitle, titleCase } from "@/lib/format";
import { ANALYSIS_EDGES, type AnalysisData } from "@/lib/facets/analysis";
import type { ClusterStats } from "@/lib/clusters";
import type {
  FilterOptions,
  MapPoint,
  ProfileKey,
  Property,
  PropertyFilters,
  PropertySort,
  Scores,
} from "@/lib/types";
import { cached, num, rows, SEARCH_REVALIDATE, withRetry } from "./client";

const LIST_PAGE_SIZE = 24;
const MAP_POINT_LIMIT = 4000;

export const isListable = (p: Property): boolean => !p.inactive && p.scores.investment != null;

function toRpcFilters(f: PropertyFilters = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (f.q?.trim()) out.q = f.q.trim();
  if (f.uf) out.uf = f.uf;
  if (f.city) out.city = f.city;
  if (f.type) out.type = f.type;
  if (f.modalities?.length) out.modalities = f.modalities;
  if (f.clusterId != null) out.cluster_id = f.clusterId;
  if (f.h3) out.h3 = f.h3;
  if (f.range) {
    out.range_dim = f.range.dim;
    out.range_from = f.range.from;
    if (f.range.to !== Infinity) out.range_to = f.range.to;
  }
  if (f.minBedrooms) out.min_bedrooms = f.minBedrooms;
  if (f.maxPrice) out.max_price = f.maxPrice;
  if (f.minArea) out.min_area = f.minArea;
  if (f.poiCats?.length) {
    out.poi_cats = f.poiCats;
    out.poi_radius_m = f.poiRadiusM ?? 2000;
  }
  if (f.maxCenterM) out.max_center_m = f.maxCenterM;
  if (f.minDiscount) out.min_discount = f.minDiscount;
  if (f.minInvestment) out.min_investment = f.minInvestment;
  if (f.scoreKey) out.score_key = f.scoreKey;
  if (f.scoreMin) out.score_min = f.scoreMin;
  if (f.financing) out.financing = true;
  if (f.fgts) out.fgts = true;
  if (f.auctionWithinDays) out.auction_within_days = f.auctionWithinDays;
  if (f.auctionOn) out.auction_on = f.auctionOn;
  if (f.includeInactive) out.include_inactive = true;
  if (f.ids) out.ids = f.ids;
  return out;
}

function mapListRow(r: any): Property {
  return {
    id: r.property_id,
    propertyType: r.property_type ?? "Imóvel",
    uf: r.uf ?? "",
    city: titleCase(r.city ?? ""),
    neighborhood: r.neighborhood ?? "",
    rawAddress: r.raw_address || null,
    area: num(r.area_m2),
    bedrooms: num(r.bedrooms),
    parkingSpots: num(r.parking_spots),
    yearBuilt: num(r.year_built),
    occupancyStatus: r.occupancy_status || null,
    condoPaymentRule: r.condo_payment_rule || null,
    taxPaymentRule: r.tax_payment_rule || null,
    title: deriveTitle(r.property_type ?? "Imóvel", num(r.bedrooms), r.neighborhood ?? ""),
    // Heavy text lives outside the MV; the detail page fetches it per-id.
    description: null,
    image: r.image_url || null,
    appraisedValue: num(r.appraised_value),
    saleValue: num(r.sale_value),
    discount: num(r.discount),
    modality: r.modality || null,
    auctionDate: r.auction_date || null,
    link: r.link || null,
    inactive: r.is_active === false,
    acceptsFinancing: r.accepts_financing === true,
    acceptsFgts: r.accepts_fgts === true,
    scores: {
      flip: num(r.flip),
      liquidity: num(r.liquidity),
      airbnb: num(r.airbnb),
      student: num(r.student),
      family: num(r.family),
      commercial: num(r.commercial),
      convenience: num(r.convenience),
      investment: num(r.investment),
    },
    profile: (r.primary_profile as ProfileKey) ?? null,
    profileScore: num(r.primary_profile_score),
    clusterId: r.cluster_id ?? null,
    clusterLabel: r.cluster_label ?? null,
    h3: r.h3_r8 || null,
    lat: num(r.lat),
    lon: num(r.lon),
    visualScore: num(r.visual_score),
    visualNote: null,
    visualAge: (["novo", "intermediario", "antigo"].includes(r.visual_age)
      ? r.visual_age
      : null) as Property["visualAge"],
    priceRank: num(r.price_rank),
    sizeRank: num(r.size_rank),
    centerProximity: num(r.center_proximity_m),
    nearestPoi: (r.nearest_poi as Record<string, number>) ?? {},
  };
}

async function rpcJson(name: string, args: Record<string, unknown>): Promise<any> {
  const res = await withRetry<any>(async () => {
    const { data, error } = await supabase.rpc(name, args);
    return { data: data == null ? null : [data], error };
  });
  if (res.error) console.error(`[data] rpc "${name}" failed: ${res.error.message}`);
  return res.data?.[0] ?? null;
}

type PropertyPage = { items: Property[]; total: number };

async function loadPropertiesPage(
  filtersJson: string,
  sort: PropertySort,
  page: number,
  pageSize: number,
): Promise<PropertyPage> {
  const data = await rpcJson("property_list_page", {
    p_filters: JSON.parse(filtersJson),
    p_sort: sort,
    p_offset: (page - 1) * pageSize,
    p_limit: pageSize,
  });
  return { total: data?.total ?? 0, items: ((data?.items ?? []) as any[]).map(mapListRow) };
}

const cachedPage = cached(loadPropertiesPage, "property-page");

export function getPropertiesPage(
  args: {
    filters?: PropertyFilters;
    sort?: PropertySort;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PropertyPage> {
  const { filters = {}, sort = "leilao", page = 1, pageSize = LIST_PAGE_SIZE } = args;
  return cachedPage(JSON.stringify(toRpcFilters(filters)), sort, Math.max(1, page), pageSize);
}

async function loadCount(filtersJson: string): Promise<number> {
  const data = await rpcJson("property_list_page", {
    p_filters: JSON.parse(filtersJson),
    p_limit: 0,
  });
  return data?.total ?? 0;
}

const cachedCount = cached(loadCount, "property-count");

export function countProperties(filters: PropertyFilters): Promise<number> {
  return cachedCount(JSON.stringify(toRpcFilters(filters)));
}

const MV_COLS = "*";

// Chunks are independent reads - issued together, not in series.
async function loadPropertiesByIds(idsJson: string): Promise<Property[]> {
  const ids: string[] = JSON.parse(idsJson);
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200));
  const res = await Promise.all(
    chunks.map((chunk) =>
      withRetry(() => supabase.from("property_list_mv").select(MV_COLS).in("property_id", chunk)),
    ),
  );
  return res.flatMap((r) => rows<any>("property_list_mv", r).map(mapListRow));
}

const cachedByIds = cached(loadPropertiesByIds, "properties-by-ids", SEARCH_REVALIDATE);

// Corpus top-N by a goal's precomputed percentile, already ranked and filtered.
async function loadGoalTop(goal: string, filtersJson: string, limit: number): Promise<Property[]> {
  const data = await rpcJson("goal_top", {
    p_goal: goal,
    p_filters: JSON.parse(filtersJson),
    p_limit: limit,
  });
  return ((data ?? []) as any[]).map(mapListRow);
}

const cachedGoalTop = cached(loadGoalTop, "goal-top", SEARCH_REVALIDATE);

export function getGoalTop(
  goal: string,
  filters: PropertyFilters,
  limit: number,
): Promise<Property[]> {
  return cachedGoalTop(goal, JSON.stringify(toRpcFilters(filters)), limit);
}

export function getPropertiesByIds(ids: string[]): Promise<Property[]> {
  if (!ids.length) return Promise.resolve([]);
  return cachedByIds(JSON.stringify(ids));
}

type PropertyDetail = Property & { discountPercentile: number | null };

async function loadPropertyById(id: string): Promise<PropertyDetail | null> {
  const res = await withRetry(() =>
    supabase.from("property_list_mv").select(MV_COLS).eq("property_id", id).limit(1),
  );
  const row = rows<any>("property_list_mv", res)[0];
  if (!row) return null;
  return { ...mapListRow(row), discountPercentile: num(row.discount_percentile) };
}

export const getPropertyById = cached(loadPropertyById, "property-by-id");

async function loadMapPoints(filtersJson: string): Promise<{ points: MapPoint[]; total: number }> {
  const data = await rpcJson("property_map_points", {
    p_filters: JSON.parse(filtersJson),
    p_limit: MAP_POINT_LIMIT,
  });
  const points = ((data?.points ?? []) as any[]).map((r): MapPoint => ({
    id: r.property_id,
    lat: Number(r.lat),
    lon: Number(r.lon),
    propertyType: r.property_type ?? "Imóvel",
    neighborhood: r.neighborhood ?? "",
    city: titleCase(r.city ?? ""),
    uf: r.uf ?? "",
    area: num(r.area_m2),
    bedrooms: num(r.bedrooms),
    parkingSpots: num(r.parking_spots),
    saleValue: num(r.sale_value),
    discount: num(r.discount),
    modality: r.modality || null,
    auctionDate: r.auction_date || null,
    occupancyStatus: r.occupancy_status || null,
    investment: num(r.investment),
  }));
  return { points, total: data?.total ?? 0 };
}

const cachedMapPoints = cached(loadMapPoints, "map-points");

export function getMapPoints(
  filters: PropertyFilters,
): Promise<{ points: MapPoint[]; total: number }> {
  return cachedMapPoints(JSON.stringify(toRpcFilters(filters)));
}

async function loadFilterOptions(): Promise<FilterOptions> {
  const data = await rpcJson("property_filter_options", {});
  return {
    ufs: data?.ufs ?? [],
    cities: data?.cities ?? [],
    types: data?.types ?? [],
    modalities: data?.modalities ?? [],
    poiCategories: data?.poi_categories ?? [],
  };
}

// Five full scans of the MV on every search, but it only changes when the batch refreshes it.
export const getFilterOptions = cached(loadFilterOptions, "filter-options", 3600);

async function loadAnalysis(filtersJson: string): Promise<AnalysisData> {
  const finite = (edges: number[]) => edges.filter((e) => Number.isFinite(e));
  const data = await rpcJson("property_analysis", {
    p_filters: JSON.parse(filtersJson),
    p_edges: {
      price: finite(ANALYSIS_EDGES.price),
      discount: finite(ANALYSIS_EDGES.discount),
      area: finite(ANALYSIS_EDGES.area),
      invest: finite(ANALYSIS_EDGES.invest),
    },
  });
  const avgs = (data?.score_avgs ?? {}) as Record<string, number | null>;
  const scoreAvgs = (Object.keys(avgs) as (keyof Scores)[])
    .filter((k) => avgs[k] != null)
    .map((k) => ({ dim: k, avg: Number(avgs[k]) }))
    .sort((a, b) => b.avg - a.avg);
  return {
    count: data?.count ?? 0,
    medianPrice: num(data?.median_price),
    p25Price: num(data?.p25_price),
    p75Price: num(data?.p75_price),
    medianDiscount: num(data?.median_discount),
    medianArea: num(data?.median_area),
    medianM2: num(data?.median_m2),
    avgScore: data?.avg_investment != null ? Math.round(Number(data.avg_investment)) : null,
    scoredCount: data?.scored_count ?? 0,
    financing: data?.financing ?? 0,
    fgts: data?.fgts ?? 0,
    scoreAvgs,
    hist: {
      price: data?.hist?.price ?? [],
      discount: data?.hist?.discount ?? [],
      area: data?.hist?.area ?? [],
      invest: data?.hist?.invest ?? [],
    },
    topCities: ((data?.top_cities ?? []) as any[]).map((t) => ({
      label: titleCase(String(t.label)),
      value: Number(t.n),
    })),
    topTypes: ((data?.top_types ?? []) as any[]).map((t) => ({
      label: String(t.label),
      value: Number(t.n),
    })),
    topHoods: ((data?.top_hoods ?? []) as any[]).map((t) => ({
      label: `${t.neighborhood} · ${titleCase(String(t.city ?? ""))}`,
      value: Number(t.n),
    })),
    scatter: ((data?.scatter ?? []) as any[]).map((t) => ({
      x: Number(t.x),
      y: Number(t.y),
      d: Number(t.d),
    })),
  };
}

const cachedAnalysis = cached(loadAnalysis, "property-analysis");

export function getAnalysis(filters: PropertyFilters): Promise<AnalysisData> {
  return cachedAnalysis(JSON.stringify(toRpcFilters(filters)));
}

async function loadAuctionCalendar(filtersJson: string): Promise<Record<string, number>> {
  const data = await rpcJson("auction_calendar", { p_filters: JSON.parse(filtersJson) });
  const out: Record<string, number> = {};
  // `d` may be a full timestamp; the calendar keys by day, so bucket to YYYY-MM-DD.
  for (const r of (data ?? []) as { d: string; n: number }[]) {
    const day = String(r.d).slice(0, 10);
    out[day] = (out[day] ?? 0) + Number(r.n);
  }
  return out;
}

const cachedCalendar = cached(loadAuctionCalendar, "auction-calendar");

export function getAuctionCalendar(filters: PropertyFilters): Promise<Record<string, number>> {
  return cachedCalendar(JSON.stringify(toRpcFilters(filters)));
}

const EMPTY_CLUSTER_STATS: ClusterStats = {
  count: 0,
  medianPrice: null,
  minPrice: null,
  maxPrice: null,
  medianDiscount: null,
  avgScore: null,
  avgAge: null,
  topCity: null,
  cityCount: 0,
  sampleImages: [],
};

async function loadClusterStats(): Promise<Record<number, ClusterStats>> {
  const data = await rpcJson("cluster_stats_all", {});
  const out: Record<number, ClusterStats> = {};
  for (const r of (data ?? []) as any[]) {
    out[Number(r.cluster_id)] = {
      count: Number(r.count ?? 0),
      medianPrice: num(r.median_price),
      minPrice: num(r.min_price),
      maxPrice: num(r.max_price),
      medianDiscount: num(r.median_discount),
      avgScore: num(r.avg_score),
      avgAge: num(r.avg_age),
      topCity: r.top_city ? titleCase(String(r.top_city)) : null,
      cityCount: Number(r.city_count ?? 0),
      sampleImages: (r.sample_images ?? []) as string[],
    };
  }
  return out;
}

const cachedClusterStats = cached(loadClusterStats, "cluster-stats");

export async function getClusterStatsAll(): Promise<Record<number, ClusterStats>> {
  return cachedClusterStats();
}

export function clusterStatsFor(
  all: Record<number, ClusterStats>,
  clusterId: number,
): ClusterStats {
  return all[clusterId] ?? EMPTY_CLUSTER_STATS;
}
