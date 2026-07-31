import PropertiesClient from "./_components/PropertiesClient";
import {
  getAnalysis,
  getAuctionCalendar,
  getAuctionDayPage,
  getClusters,
  getFilterOptions,
  getMapPoints,
  getPropertiesPage,
  getRegionLabel,
} from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";
import { VIEW_FEATURE } from "@/lib/entitlements";
import { gateFilters } from "@/lib/filters/gate";
import { parsePropertySearchParams } from "@/lib/filters/propertiesUrl";
import type { AnalysisData } from "@/lib/facets/analysis";
import type { MapPoint, Property } from "@/lib/types";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { filters: askedFilters, sort, page, view: asked, day } = parsePropertySearchParams(sp);

  // Falls back to the list so the queries below stay cheap; the client shows the upsell in place.
  const ent = await getEntitlements();
  const locked = VIEW_FEATURE[asked] && !ent.can(VIEW_FEATURE[asked]!) ? asked : undefined;
  const view = locked ? "list" : asked;
  const { filters, lockedFilters } = gateFilters(askedFilters, ent);

  const [clusters, filterOptions, h3Label, list, analysis, calendar, map] = await Promise.all([
    getClusters(),
    getFilterOptions(),
    filters.h3 ? getRegionLabel(filters.h3) : Promise.resolve(null),
    view === "list" ? getPropertiesPage({ filters, sort, page }) : Promise.resolve(undefined),
    view === "analysis" ? getAnalysis(filters) : Promise.resolve(undefined),
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
    view === "map" ? getMapPoints(filters) : Promise.resolve(undefined),
  ]);

  return (
    <section className="view">
      <PropertiesClient
        clusters={clusters}
        filterOptions={filterOptions}
        filters={filters}
        sort={sort}
        page={page}
        view={view}
        lockedView={locked}
        lockedFilter={lockedFilters[0]}
        h3Label={h3Label ?? undefined}
        list={list}
        analysis={analysis as AnalysisData | undefined}
        calendar={calendar}
        map={map as { points: MapPoint[]; total: number } | undefined}
      />
    </section>
  );
}
