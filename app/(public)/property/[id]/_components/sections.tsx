import PriceHistory from "./PriceHistory";
import ScoreBreakdown from "./ScoreBreakdown";
import ScoreWeights from "./ScoreWeights";
import NearbyPoisGate from "./NearbyPoisGate";
import RegionPanel from "@/components/region/RegionPanel";
import { getPriceHistory, getPropertyPois, getRegion, getScoreExplain } from "@/lib/data";
import type { Property } from "@/lib/types";

// Each section owns its query and streams in independently, so the slowest one no longer holds up
// the whole document. Nothing here may read entitlements - this route is cached, so one render is
// shared by every visitor; the per-plan sections resolve in the browser.

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
      <NearbyPoisGate pois={pois} />
    </>
  );
}

export async function PriceHistorySlot({ id }: { id: string }) {
  return <PriceHistory points={await getPriceHistory(id)} />;
}
