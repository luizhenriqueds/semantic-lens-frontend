import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getMarketDashboard } from "./dashboard";
import { withRetry } from "./client";

// The landing page shows a row of headline figures. Every one of them has to be
// a real count - so they are read here instead of being written into the JSX.
export type LandingStats = {
  activeProperties: number;
  pois: number;
  poiCategories: number;
  regions: number;
  clusters: number;
  ufs: number;
  discountMedian: number | null;
  computedAt: string | null;
  featuredClusters: Record<string, number>;
};

// The landing shows a cover photo for these three groups, so their sizes are
// read by label instead of being written into the page - a hardcoded count
// goes stale the next time the base is reprocessed.
export const FEATURED_CLUSTERS = [
  "Apartamentos de alto valor",
  "Casas populares para reforma - Médio porte",
  "Apartamentos compactos populares - ~41 m²",
];

// All 27 federative units. Coverage is counted by probing each one, which keeps
// this to 27 head requests instead of paging the whole base to find the
// distinct set - the listable base must never be loaded in full.
const UFS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

// The categories the POI pipeline maps. Counting distinct values would mean
// scanning 368k rows, and this list only changes when the pipeline changes.
const POI_CATEGORIES = 29;

// Cluster labelling puts everything it cannot group into a bucket of its own.
// It is not a "family" and never appears on the landing page.
const UNGROUPED = "Não agrupados";

// `select=*` on a HEAD+count=exact request still costs ~2x a single narrow column, so each
// caller names one cheap column instead of pulling every row's full width.
async function headCount(table: string, column: string, apply: (q: any) => any): Promise<number> {
  const res = await withRetry(() =>
    apply(supabase.from(table).select(column, { count: "exact", head: true })),
  );
  if (res.error) {
    console.error(`[data] landing count "${table}" failed: ${res.error.message}`);
    return 0;
  }
  return (res as { count?: number | null }).count ?? 0;
}

async function loadLandingStats(): Promise<LandingStats | null> {
  try {
    const [activeProperties, pois, regions, clusters, ufCounts, featured, dashboard] =
      await Promise.all([
        headCount("property_list_mv", "property_id", (q) => q.eq("is_listable", true)),
        headCount("pois", "id", (q) => q),
        headCount("region_cells", "h3", (q) => q),
        headCount("clusters", "cluster_id", (q) => q.neq("label", UNGROUPED)),
        Promise.all(
          UFS.map((uf) =>
            headCount("property_list_mv", "property_id", (q) =>
              q.eq("is_listable", true).eq("uf", uf),
            ),
          ),
        ),
        Promise.all(
          FEATURED_CLUSTERS.map((label) =>
            headCount("property_list_mv", "property_id", (q) =>
              q.eq("is_listable", true).eq("cluster_label", label),
            ).then((n) => [label, n] as const),
          ),
        ),
        getMarketDashboard(),
      ]);

    if (!activeProperties) return null;

    return {
      activeProperties,
      pois,
      poiCategories: POI_CATEGORIES,
      regions,
      clusters,
      ufs: ufCounts.filter((n) => n > 0).length,
      discountMedian: dashboard?.kpi?.discount_median ?? null,
      computedAt: dashboard?.computedAt ?? null,
      featuredClusters: Object.fromEntries(featured.filter(([, n]) => n > 0)),
    };
  } catch (e) {
    console.error("[data] landing stats failed", e);
    return null;
  }
}

// The figures move once a day at most, so this is cached far longer than the
// rest of the data layer. A null result hides the band rather than rendering
// zeroes.
export const getLandingStats = unstable_cache(loadLandingStats, ["landing-stats"], {
  revalidate: 86_400,
});
