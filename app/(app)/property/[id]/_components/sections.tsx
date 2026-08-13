import PriceHistory from "./PriceHistory";
import ScoreBreakdown from "./ScoreBreakdown";
import ScoreWeights from "./ScoreWeights";
import NearbyPois from "./NearbyPois";
import RegionPanel from "@/components/region/RegionPanel";
import PropertyMarket from "@/components/market/PropertyMarket";
import SimilarCarousel, { type RecItem } from "@/components/property/SimilarCarousel";
import UpgradeWall from "@/components/plan/UpgradeWall";
import {
  getMarketComparables,
  getPriceHistory,
  getPropertiesByIds,
  getPropertiesPage,
  getPropertyPois,
  getRecommendations,
  getRegion,
  getScoreExplain,
  isListable,
} from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";
import { PLANS } from "@/lib/entitlements/plans";
import type { Property, PropertyFilters } from "@/lib/types";

// Each section owns its query and streams in independently, so the slowest one
// no longer holds up the whole document.

export function BlockSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div className="infoblock" aria-hidden="true">
      <div className="skel" style={{ height, borderRadius: 12 }} />
    </div>
  );
}

export function InlineSkeleton({ width = 90, height = 22 }: { width?: number; height?: number }) {
  return (
    <span className="skel" style={{ display: "inline-block", width, height }} aria-hidden="true" />
  );
}

export async function ScoreWeightsSlot({ id }: { id: string }) {
  const explain = await getScoreExplain(id);
  return explain ? <ScoreWeights explain={explain} /> : null;
}

export async function ScoreBreakdownSlot({ p }: { p: Property }) {
  const explain = await getScoreExplain(p.id);
  return <ScoreBreakdown p={p} explain={explain} />;
}

export async function RegionSlot({ p, heading }: { p: Property; heading: string }) {
  const [ent, region, pois] = await Promise.all([
    getEntitlements(),
    p.h3 ? getRegion(p.h3) : Promise.resolve(null),
    getPropertyPois(p.id),
  ]);
  return (
    <>
      {region && (
        <RegionPanel region={region} pois={pois} lat={p.lat} lon={p.lon} title={heading} />
      )}
      {ent.can("nearbyPois") ? (
        <NearbyPois pois={pois} />
      ) : (
        <div className="infoblock">
          <UpgradeWall feature="nearbyPois" role={ent.role} trial={ent.trial} art />
        </div>
      )}
    </>
  );
}

export async function PriceHistorySlot({ id }: { id: string }) {
  return <PriceHistory points={await getPriceHistory(id)} />;
}

export async function MarketSlot({ p }: { p: Property }) {
  const ent = await getEntitlements();
  // Locked shows the wall; absent data below still returns null.
  if (!ent.can("marketCompare")) {
    return (
      <div className="infoblock">
        <UpgradeWall feature="marketCompare" role={ent.role} trial={ent.trial} art />
      </div>
    );
  }
  const stats = await getMarketComparables(p.uf, p.city, p.neighborhood, p.propertyType, p.area);
  if (!stats) return null;
  return (
    <PropertyMarket stats={stats} lance={p.saleValue} area={p.area} appraised={p.appraisedValue} />
  );
}

/** Half-width of the "mesma faixa de preço" band. */
const PRICE_BAND = 0.1;

/** An h3 cell this thin reads as a broken rail, so it falls back to the city instead. */
const MIN_REGION_ITEMS = 3;

// One page of the list RPC as a rail. Pulls one extra: this property matches its own filters.
async function railItems(
  filters: PropertyFilters,
  exceptId: string,
  take: number,
): Promise<RecItem[]> {
  const { items } = await getPropertiesPage({
    filters,
    sort: "investimento",
    pageSize: take + 1,
  });
  return items
    .filter((x) => x.id !== exceptId)
    .slice(0, take)
    .map((p) => ({ p }));
}

// Both rails stay within the property's own type: a terreno next to an apartamento is a
// comparison nobody asked for, whatever the region or the price band says.
async function regionRail(p: Property, take: number) {
  const type = p.propertyType;
  if (p.h3) {
    const items = await railItems({ h3: p.h3, type }, p.id, take);
    if (items.length >= MIN_REGION_ITEMS)
      return { items, subtitle: `Outros imóveis na mesma área de ${p.city}.` };
  }
  const items = await railItems({ uf: p.uf, city: p.city, type }, p.id, take);
  return { items, subtitle: `Outros imóveis em ${p.city}/${p.uf}.` };
}

async function priceRail(p: Property, take: number): Promise<RecItem[]> {
  if (!p.saleValue) return [];
  const from = Math.round(p.saleValue * (1 - PRICE_BAND));
  const to = Math.round(p.saleValue * (1 + PRICE_BAND));
  return railItems({ range: { dim: "price", from, to }, type: p.propertyType }, p.id, take);
}

async function similarRails(id: string, take: number) {
  const recs = await getRecommendations(id);
  // Only surface recommendations that are a strong match (≥ 75%).
  const strong = recs.filter((r) => Math.round((r.similarity ?? 0) * 100) >= 75);
  if (!strong.length) return { visual: [], similar: [] };

  const props = await getPropertiesByIds([...new Set(strong.map((r) => r.recId))]);
  const byId = new Map(props.filter((x) => isListable(x)).map((x) => [x.id, x]));
  const items = (kind: "visual" | "similar"): RecItem[] =>
    strong
      .filter((r) => r.kind === kind)
      .map((r): RecItem | null => {
        const p = byId.get(r.recId);
        return p ? { p, match: Math.min(100, Math.round((r.similarity ?? 0) * 100)) } : null;
      })
      .filter((x): x is RecItem => x !== null)
      .slice(0, take);

  return { visual: items("visual"), similar: items("similar") };
}

export async function RecommendationsSlot({ p }: { p: Property }) {
  const ent = await getEntitlements();
  // No wall here: the rails sit at the end of the page, where a lock reads as a dead end.
  if (!ent.can("recommendations")) return null;
  // `limit()` is null for admins, who get the largest rail rather than an unbounded one.
  const take = ent.limit("recommendations") ?? PLANS.professional.limits.recommendations;
  const [similar, region, price] = await Promise.all([
    similarRails(p.id, take),
    regionRail(p, take),
    priceRail(p, take),
  ]);

  return (
    <>
      <SimilarCarousel
        title="Mais imóveis como este"
        subtitle="Imóveis com aparência parecida com este."
        items={similar.visual}
      />
      <SimilarCarousel
        title="Quem viu este também considerou"
        subtitle="Outras oportunidades parecidas em perfil e preço."
        items={similar.similar}
      />
      <SimilarCarousel title="Na mesma região" subtitle={region.subtitle} items={region.items} />
      <SimilarCarousel
        title="Na mesma faixa de preço"
        subtitle="Imóveis na mesma faixa de preço."
        items={price}
      />
    </>
  );
}
