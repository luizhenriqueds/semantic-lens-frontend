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
  getPropertyPois,
  getRecommendations,
  getRegion,
  getScoreExplain,
  isListable,
} from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";
import type { Property } from "@/lib/types";

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
  const [region, pois] = await Promise.all([
    p.h3 ? getRegion(p.h3) : Promise.resolve(null),
    getPropertyPois(p.id),
  ]);
  return (
    <>
      {region && (
        <RegionPanel region={region} pois={pois} lat={p.lat} lon={p.lon} title={heading} />
      )}
      <NearbyPois pois={pois} />
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
        <UpgradeWall feature="marketCompare" role={ent.role} trial={ent.trial} />
      </div>
    );
  }
  const stats = await getMarketComparables(p.uf, p.city, p.neighborhood, p.propertyType, p.area);
  if (!stats) return null;
  return (
    <PropertyMarket stats={stats} lance={p.saleValue} area={p.area} appraised={p.appraisedValue} />
  );
}

export async function RecommendationsSlot({ id }: { id: string }) {
  const ent = await getEntitlements();
  if (!ent.can("recommendations")) {
    return (
      <div className="infoblock recsec">
        <UpgradeWall feature="recommendations" role={ent.role} trial={ent.trial} />
      </div>
    );
  }
  const limit = ent.limit("recommendations") ?? undefined;
  const recs = await getRecommendations(id);
  // Only surface recommendations that are a strong match (≥ 75%).
  const strong = recs.filter((r) => Math.round((r.similarity ?? 0) * 100) >= 75);
  if (!strong.length) return null;

  const props = await getPropertiesByIds([...new Set(strong.map((r) => r.recId))]);
  const byId = new Map(props.filter((x) => isListable(x)).map((x) => [x.id, x]));
  const items = (kind: "visual" | "similar"): RecItem[] =>
    strong
      .filter((r) => r.kind === kind)
      .map((r) => {
        const p = byId.get(r.recId);
        return p ? { p, match: Math.min(100, Math.round((r.similarity ?? 0) * 100)) } : null;
      })
      .filter((x): x is RecItem => x !== null)
      .slice(0, limit);

  return (
    <>
      <SimilarCarousel
        title="Mais imóveis como este"
        subtitle="Imóveis com aparência parecida com este."
        items={items("visual")}
      />
      <SimilarCarousel
        title="Quem viu este também considerou"
        subtitle="Outras oportunidades parecidas em perfil e preço."
        items={items("similar")}
      />
    </>
  );
}
