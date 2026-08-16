import {
  getAnalysis,
  getAuctionCalendar,
  getAuctionDayPage,
  getClusters,
  getFilterOptions,
  getMapPoints,
  getPropertiesPage,
  getProximity,
  getRegionLabel,
} from "@/lib/data";
import { VIEW_FEATURE } from "@/lib/entitlements";
import { getEntitlements } from "@/lib/entitlements/server";
import type { AnalysisData, ProximityData } from "@/lib/facets/analysis";
import { gateFilters } from "@/lib/filters/gate";
import type { PropertiesView } from "@/lib/filters/propertiesUrl";
import type {
  Cluster,
  FilterOptions,
  MapPoint,
  Property,
  PropertyFilters,
  PropertySort,
} from "@/lib/types";
import type { Feature } from "@/lib/entitlements";

export type PropertiesQuery = {
  filters: PropertyFilters;
  sort: PropertySort;
  page: number;
  view: PropertiesView;
  day: string | null;
};

export type PropertiesViewData = {
  clusters: Cluster[];
  filterOptions: FilterOptions;
  filters: PropertyFilters;
  sort: PropertySort;
  page: number;
  view: PropertiesView;
  lockedView?: PropertiesView;
  lockedFilter?: Feature;
  h3Label?: string;
  list?: Awaited<ReturnType<typeof getPropertiesPage>>;
  analysis?: AnalysisData;
  proximity?: ProximityData;
  calendar?: {
    counts: Awaited<ReturnType<typeof getAuctionCalendar>>;
    day: string | null;
    dayItems: Property[];
    dayTotal: number;
  };
  /** `null` when the read failed, so the view can say so instead of claiming no results. */
  map?: { points: MapPoint[]; total: number } | null;
};

export async function loadPropertiesView(
  query: PropertiesQuery,
  /** Filters an SEO landing fixes. They skip gateFilters - we chose them, not the visitor, so a
   *  discount landing shows real results and a real count to anyone. */
  opts: { fixedFilters?: PropertyFilters } = {},
): Promise<PropertiesViewData> {
  const { filters: askedFilters, sort, page, view: asked, day } = query;

  // Falls back to the list so the queries below stay cheap; the client shows the upsell in place.
  const ent = await getEntitlements();
  const locked = VIEW_FEATURE[asked] && !ent.can(VIEW_FEATURE[asked]!) ? asked : undefined;
  const view = locked ? "list" : asked;
  const { filters: allowed, lockedFilters } = gateFilters(askedFilters, ent);
  const filters = { ...allowed, ...(opts.fixedFilters ?? {}) };

  const [clusters, filterOptions, h3Label, list, analysis, proximity, calendar, map] =
    await Promise.all([
      getClusters(),
      getFilterOptions(),
      filters.h3 ? getRegionLabel(filters.h3) : Promise.resolve(null),
      view === "list" ? getPropertiesPage({ filters, sort, page }) : Promise.resolve(undefined),
      view === "analysis" ? getAnalysis(filters) : Promise.resolve(undefined),
      // A dozen counts for two charts: worth hiding on failure, never worth the whole view.
      view === "analysis"
        ? getProximity(filters).catch(() => undefined)
        : Promise.resolve(undefined),
      view === "calendar"
        ? (async () => {
            const [counts, dayPage] = await Promise.all([
              getAuctionCalendar(filters),
              day ? getAuctionDayPage(day, filters, sort, page) : Promise.resolve(null),
            ]);
            return {
              counts,
              day,
              dayItems: (dayPage?.items ?? []) as Property[],
              dayTotal: dayPage?.total ?? 0,
            };
          })()
        : Promise.resolve(undefined),
      view === "map" ? getMapPoints(filters).catch(() => null) : Promise.resolve(undefined),
    ]);

  return {
    clusters,
    filterOptions,
    filters,
    sort,
    page,
    view,
    lockedView: locked,
    lockedFilter: lockedFilters[0],
    h3Label: h3Label ?? undefined,
    list,
    analysis: analysis as AnalysisData | undefined,
    proximity: proximity as ProximityData | undefined,
    calendar,
    map: map as { points: MapPoint[]; total: number } | null | undefined,
  };
}
