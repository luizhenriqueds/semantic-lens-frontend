import { BRT_OFFSET_MS } from "@/lib/auctionTime";
import { supabase } from "@/lib/supabase";
import { escapeLike } from "@/lib/facets";
import { deriveTitle, titleCase } from "@/lib/format";
import {
  ANALYSIS_EDGES,
  CENTER_EDGES,
  CENTER_MAX_M,
  PROXIMITY_POIS,
  type AnalysisData,
  type ProximityData,
} from "@/lib/facets/analysis";
import { POI_LABEL, POI_RADIUS_M } from "@/lib/pois";
import { toRpcFilters, type RpcFilters } from "@/lib/filters/contract";
import { LIST_PAGE_SIZE } from "@/lib/filters/propertiesUrl";
import type { ClusterStats } from "@/lib/clusters";
import type {
  AlertCriteriaSet,
  FilterOptions,
  MapPoint,
  ProfileKey,
  Property,
  PropertyFilters,
  PropertySort,
  Scores,
} from "@/lib/types";
import {
  cached,
  fetchAllRows,
  num,
  REVALIDATE,
  rows,
  SEARCH_REVALIDATE,
  withRetry,
  withRetryTimeouts,
} from "./client";

const MAP_POINT_LIMIT = 4000;

// Scoring is the last step of a batch run, so a row with no investment score is still being
// processed and the rest of its data may be incomplete. Applied to raw RPC rows; the MV reads
// below get the same gate from `scoredMv`.
const isScored = (r: any): boolean => r.investment != null;

export const isListable = (p: Property): boolean => !p.inactive && p.scores.investment != null;

// `cols as "*"` only shapes the type: PostgREST cannot parse a non-literal column list, and
// every caller reads the rows through `rows<any>`. Making it generic instead stalls tsc.
const scoredMv = (cols = "*") =>
  supabase
    .from("property_list_mv")
    .select(cols as "*")
    .not("investment", "is", null);

// The portfolio and the detail page still show inactive listings, so only the reads that build
// lists gate on `is_listable` as well.
export const listableMv = (cols = "*") => scoredMv(cols).eq("is_listable", true);

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

// `required: true` for a read whose caller cannot tell an empty result from a failed one: left
// tolerant, a timeout resolves to `null`, the loader maps that to an empty result, and `cached`
// memoises the emptiness for the whole revalidate window. Throwing keeps the failure out of
// unstable_cache. Those reads also get one timeout retry - the rest stay on the default of none,
// since they have a real empty state and re-running a heavy query would only add load.
async function rpcJson(
  name: string,
  args: Record<string, unknown>,
  { required = false }: { required?: boolean } = {},
): Promise<any> {
  const res = await withRetry<any>(
    async () => {
      const { data, error } = await supabase.rpc(name, args);
      return { data: data == null ? null : [data], error };
    },
    { timeoutRetries: required ? 1 : 0 },
  );
  if (res.error) {
    console.error(`[data] rpc "${name}" failed: ${res.error.message}`);
    if (required) throw new Error(`rpc "${name}" failed: ${res.error.message}`);
  }
  return res.data?.[0] ?? null;
}

type PropertyPage = { items: Property[]; total: number };

async function loadPropertiesPage(
  filtersJson: string,
  sort: PropertySort,
  page: number,
  pageSize: number,
): Promise<PropertyPage> {
  const data = await rpcJson(
    "property_list_page",
    {
      p_filters: JSON.parse(filtersJson),
      p_sort: sort,
      p_offset: (page - 1) * pageSize,
      p_limit: pageSize,
    },
    { required: true },
  );
  return {
    total: data?.total ?? 0,
    items: ((data?.items ?? []) as any[]).filter(isScored).map(mapListRow),
  };
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

async function loadCount(filtersJson: string, required = false): Promise<number> {
  const data = await rpcJson(
    "property_list_page",
    { p_filters: JSON.parse(filtersJson), p_limit: 0 },
    { required },
  );
  return data?.total ?? 0;
}

const cachedCount = cached(loadCount, "property-count");

export function countProperties(filters: PropertyFilters): Promise<number> {
  return cachedCount(JSON.stringify(toRpcFilters(filters)));
}

export function countMatched(criteria: AlertCriteriaSet): Promise<number> {
  return cachedCount(JSON.stringify(criteria));
}

export function getMatchedPage(
  criteria: AlertCriteriaSet,
  sort: PropertySort = "desconto",
  page = 1,
  pageSize = LIST_PAGE_SIZE,
): Promise<PropertyPage> {
  return cachedPage(JSON.stringify(criteria), sort, Math.max(1, page), pageSize);
}

// Uncached on purpose: routing a several-thousand-row export through `cachedPage` would evict the
// hot 24-row pages. Same RPC; `total` comes back unlimited, so the caller can tell it truncated.
export function getPropertiesForExport(
  filters: PropertyFilters,
  sort: PropertySort,
  limit: number,
): Promise<PropertyPage> {
  return loadPropertiesPage(JSON.stringify(toRpcFilters(filters)), sort, 1, limit);
}

export function getMatchedForExport(
  criteria: AlertCriteriaSet,
  sort: PropertySort,
  limit: number,
): Promise<PropertyPage> {
  return loadPropertiesPage(JSON.stringify(criteria), sort, 1, limit);
}

// Chunks are independent reads - issued together, not in series.
async function loadPropertiesByIds(idsJson: string): Promise<Property[]> {
  const ids: string[] = JSON.parse(idsJson);
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200));
  const res = await Promise.all(
    chunks.map((chunk) => withRetryTimeouts(() => scoredMv().in("property_id", chunk))),
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
  return ((data ?? []) as any[]).filter(isScored).map(mapListRow);
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

/** What this path can honour. Deliberately not PropertyFilters: parking has no RPC key, and a
 *  filter this read silently ignored would be worse than a type error. */
export type StructuralFilters = {
  type?: string;
  city?: string;
  minBedrooms?: number;
  minParking?: number;
  maxPrice?: number;
};

// "apartamento 2 quartos" is a filtered list, not a search. Reads the MV directly because
// property_list_page spends ~500ms of its ~600 counting a total the search page never shows.
// Each predicate mirrors what property_list_matched does with the same key. Not wrapped in
// `cached`: the only caller already runs inside the hybrid-search cache, which nesting skips.
export async function getStructuralList(f: StructuralFilters, limit: number): Promise<Property[]> {
  let q = listableMv();
  if (f.type) q = q.ilike("property_type", escapeLike(f.type));
  if (f.city) q = q.ilike("city", escapeLike(f.city));
  if (f.minBedrooms) q = q.gte("bedrooms", f.minBedrooms);
  if (f.minParking) q = q.gte("parking_spots", f.minParking);
  if (f.maxPrice) q = q.lte("sale_value", f.maxPrice);
  const res = await withRetry(() =>
    q
      .order("investment", { ascending: false })
      .order("property_id", { ascending: true })
      .limit(limit),
  );
  return rows<any>("structural-list", res).map(mapListRow);
}

// `auction_within_days` on the list RPC is a window around today and its "leilao" sort
// ascends, so a page of it is entirely past auctions - hence a direct read for the
// opposite end. `sinceIso` is hour-rounded by the caller to keep the cache key stable.
const UPCOMING_LIMIT = 60;

async function loadUpcomingAuctions(sinceIso: string): Promise<Property[]> {
  const res = await withRetry(() =>
    listableMv()
      .gt("auction_date", sinceIso)
      .order("auction_date", { ascending: true })
      .limit(UPCOMING_LIMIT),
  );
  return rows<any>("property_list_mv", res).map(mapListRow);
}

const cachedUpcoming = cached(loadUpcomingAuctions, "upcoming-auctions");

export function getUpcomingAuctions(now: Date): Promise<Property[]> {
  const hour = new Date(now);
  hour.setMinutes(0, 0, 0);
  // Shift into the BRT-labelled space the column stores, or the query drops everything closing
  // in the next three hours - exactly what "termina em breve" is for. See lib/auctionTime.
  return cachedUpcoming(new Date(hour.getTime() - BRT_OFFSET_MS).toISOString());
}

// The list RPC accepts `auction_on` but its predicate never matches, so the calendar's
// day drill-down came back empty for every date. Resolving the day's ids here and handing
// them to the RPC as `ids` keeps the caller's filters and sort authoritative. Days are
// bucketed in UTC to match `auction_calendar`, which keys its counts the same way.
const CALENDAR_ID_CAP = 6000;

async function loadAuctionDayIds(day: string): Promise<string[]> {
  const ids = await fetchAllRows<{ property_id: string }>("auction-day-ids", (from, to) =>
    listableMv("property_id")
      .gte("auction_date", `${day}T00:00:00Z`)
      .lt("auction_date", `${day}T23:59:59.999Z`)
      .order("auction_date", { ascending: true })
      .order("property_id", { ascending: true })
      .range(from, to),
  );
  return ids.slice(0, CALENDAR_ID_CAP).map((r) => r.property_id);
}

// A plain TTL map, not `cached`: unstable_cache skips the read when it runs nested inside
// another unstable_cache, so paging a day would re-resolve the whole id set every time.
const dayIdsCache = new Map<string, { at: number; promise: Promise<string[]> }>();

function auctionDayIds(day: string): Promise<string[]> {
  const now = Date.now();
  const hit = dayIdsCache.get(day);
  if (hit && now - hit.at <= REVALIDATE * 1000) return hit.promise;
  const promise = loadAuctionDayIds(day).catch((e) => {
    dayIdsCache.delete(day);
    throw e;
  });
  dayIdsCache.set(day, { at: now, promise });
  return promise;
}

// Cached on (day, filters, sort, page) rather than on the resolved ids - a day can hold
// thousands of them, and `cached` stringifies every argument into the cache key.
async function loadAuctionDayPage(
  day: string,
  filtersJson: string,
  sort: PropertySort,
  page: number,
  pageSize: number,
): Promise<PropertyPage> {
  const ids = await auctionDayIds(day);
  if (!ids.length) return { items: [], total: 0 };
  return loadPropertiesPage(
    JSON.stringify({ ...JSON.parse(filtersJson), ids }),
    sort,
    page,
    pageSize,
  );
}

const cachedDayPage = cached(loadAuctionDayPage, "auction-day-page");

export function getAuctionDayPage(
  day: string,
  filters: PropertyFilters,
  sort: PropertySort,
  page = 1,
  pageSize = LIST_PAGE_SIZE,
): Promise<PropertyPage> {
  return cachedDayPage(
    day,
    JSON.stringify(toRpcFilters(filters)),
    sort,
    Math.max(1, page),
    pageSize,
  );
}

type PropertyDetail = Property & { discountPercentile: number | null };

async function loadPropertyById(id: string): Promise<PropertyDetail | null> {
  const res = await withRetryTimeouts(() => scoredMv().eq("property_id", id).limit(1));
  const row = rows<any>("property_list_mv", res)[0];
  if (!row) return null;
  return { ...mapListRow(row), discountPercentile: num(row.discount_percentile) };
}

export const getPropertyById = cached(loadPropertyById, "property-by-id");

// Map points carry no photo (4000 of them per view), so popups fetch theirs on open.
async function loadPropertyImage(id: string): Promise<string | null> {
  const res = await withRetryTimeouts(() =>
    supabase.from("property_list_mv").select("image_url").eq("property_id", id).limit(1),
  );
  return rows<any>("property-image", res)[0]?.image_url || null;
}

export const getPropertyImage = cached(loadPropertyImage, "property-image");

async function loadMapPoints(filtersJson: string): Promise<{ points: MapPoint[]; total: number }> {
  const data = await rpcJson("property_map_points", {
    p_filters: JSON.parse(filtersJson),
    p_limit: MAP_POINT_LIMIT,
  });
  const points = ((data?.points ?? []) as any[]).filter(isScored).map((r): MapPoint => ({
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

type RawFilterOptions = Omit<FilterOptions, "visualScore">;

async function loadFilterOptions(): Promise<RawFilterOptions> {
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
// The search path takes this one directly: it needs the city list, not the probe below.
export const getFilterOptionsRaw = cached(loadFilterOptions, "filter-options", 3600);

// property_list_page ignores filter keys it doesn't know, so a visual-score control would
// look active while doing nothing. An impossible floor tells the two apart: a supported key
// matches nothing, an ignored one matches the whole base.
async function loadVisualScoreSupport(): Promise<boolean> {
  const [all, probe] = await Promise.all([
    loadCount("{}"),
    loadCount(JSON.stringify({ min_visual_score: 101 })),
  ]);
  return all > 0 && probe < all;
}

const cachedVisualScoreSupport = cached(loadVisualScoreSupport, "visual-score-support", 3600);

export async function getFilterOptions(): Promise<FilterOptions> {
  const [options, visualScore] = await Promise.all([
    getFilterOptionsRaw(),
    cachedVisualScoreSupport(),
  ]);
  return { ...options, visualScore };
}

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

// `loadCount`, not `countProperties`: unstable_cache skips its read when nested inside another
// one, and the whole result is cached here as a single entry instead of one per bucket. The counts
// are `required` so a timeout throws - tolerant, a failed bucket would draw as a truthful-looking
// zero bar.
async function loadProximity(filtersJson: string): Promise<ProximityData> {
  const filters = JSON.parse(filtersJson) as RpcFilters;
  const radius = filters.poi_radius_m ?? POI_RADIUS_M;
  const count = (patch: Partial<RpcFilters>) =>
    loadCount(JSON.stringify({ ...filters, ...patch }), true);

  const [cumulative, poiCounts] = await Promise.all([
    Promise.all(
      CENTER_EDGES.slice(1).map((e) => count({ max_center_m: Math.min(e, CENTER_MAX_M) })),
    ),
    // The category being counted replaces any nearby-places filter already in play; ANDing a
    // category with itself would just restate the filter instead of describing the set.
    Promise.all(PROXIMITY_POIS.map((cat) => count({ poi_cats: [cat], poi_radius_m: radius }))),
  ]);

  return {
    // The counts are cumulative, so each bucket is the step between two of them.
    center: cumulative.map((n, i) => Math.max(0, n - (cumulative[i - 1] ?? 0))),
    // Ranked, like the other Rank charts: what matters is which places are common.
    pois: PROXIMITY_POIS.map((cat, i) => ({
      label: POI_LABEL[cat] ?? cat,
      value: poiCounts[i],
    })).sort((a, b) => b.value - a.value),
    poiRadiusM: radius,
  };
}

const cachedProximity = cached(loadProximity, "property-proximity");

export function getProximity(filters: PropertyFilters): Promise<ProximityData> {
  return cachedProximity(JSON.stringify(toRpcFilters(filters)));
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

const clusterImageBucket = supabase.storage.from(
  process.env.SUPABASE_STORAGE_BUCKET ?? "property-images",
);

// Mirrors pipeline.alerts.email.cards.resolve_image_url: the re-hosted copy outlives delistings.
export function resolveSampleImageUrl(path: string | null, fallback: string | null): string | null {
  if (!path) return fallback;
  if (path.startsWith("http")) return path;
  return clusterImageBucket.getPublicUrl(path).data.publicUrl;
}

async function loadClusterStats(): Promise<Record<number, ClusterStats>> {
  const data = await rpcJson("cluster_stats_all", {});
  const out: Record<number, ClusterStats> = {};
  for (const r of (data ?? []) as any[]) {
    const rawImages = (r.sample_images ?? []) as {
      image_path: string | null;
      image_url: string | null;
    }[];
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
      sampleImages: rawImages
        .map((s) => resolveSampleImageUrl(s.image_path, s.image_url))
        .filter((u): u is string => Boolean(u)),
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
