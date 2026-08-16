import { getMarketDashboard } from "./dashboard";

// Counting these live cost ~33 `count=exact` HEAD requests per cache miss against a pool of 8,
// and a failed count degraded to 0, not an error - which is how "0 LUGARES PRÓXIMOS" shipped.
// They move by a few hundred a day and are rounded for display, so they are updated by hand.
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

// Checked against production 2026-08-14: 28,308 listable / 368,813 pois / 10,034 region cells /
// 119 clusters / 27 UFs. Rounded to the precision countShort() renders ("370 mil"); the property
// count is rounded down and shown as "+25 mil", so it stays true as the base moves.
const HEADLINE = {
  activeProperties: 25_000,
  pois: 370_000,
  poiCategories: 29,
  regions: 10_000,
  clusters: 119,
  ufs: 27,
} as const;

// "N imóveis" on the three cover cards; the JSX skips the line when a label is absent.
const FEATURED_CLUSTERS: Record<string, number> = {
  "Apartamentos de alto valor": 929,
  "Casas populares para reforma - Médio porte": 805,
  "Apartamentos compactos populares - ~41 m²": 170,
};

export async function getLandingStats(): Promise<LandingStats> {
  // A failure here drops the accent tile, not the band: nothing above depends on it.
  const dashboard = await getMarketDashboard().catch(() => null);

  return {
    ...HEADLINE,
    discountMedian: dashboard?.kpi?.discount_median ?? null,
    computedAt: dashboard?.computedAt ?? null,
    featuredClusters: FEATURED_CLUSTERS,
  };
}
