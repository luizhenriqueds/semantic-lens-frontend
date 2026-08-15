"use client";

import PropertyMarket from "@/components/market/PropertyMarket";
import { usePlan } from "@/components/plan/PlanProvider";
import UpgradeWall from "@/components/plan/UpgradeWall";
import type { MarketStats } from "@/lib/types";
import { BlockSkeleton } from "./skeletons";
import { useGatedSection } from "./useGatedSection";

type Payload = {
  stats: MarketStats | null;
  lance: number | null;
  area: number | null;
  appraised: number | null;
};

export default function MarketSection({ id }: { id: string }) {
  const { role, trial } = usePlan();
  const state = useGatedSection<Payload>(id, "market", "marketCompare");

  if (state.status === "loading") return <BlockSkeleton height={220} />;
  if (state.status === "error") return null;
  if (state.status === "locked") {
    return (
      <div className="infoblock">
        <UpgradeWall feature="marketCompare" role={role} trial={trial} art />
      </div>
    );
  }

  // Entitled, but this property has no comparables.
  const { stats, ...rest } = state.data;
  if (!stats) return null;
  return <PropertyMarket stats={stats} {...rest} />;
}
