"use client";

import { usePlan } from "@/components/plan/PlanProvider";
import UpgradeWall from "@/components/plan/UpgradeWall";
import type { NearbyPoi } from "@/lib/types";
import NearbyPois from "./NearbyPois";
import { BlockSkeleton } from "./skeletons";

// No data moved with the gate: RegionPanel is a client component and already receives the same
// `pois` on every render, so this was always presentational rather than a server-side secret.
export default function NearbyPoisGate({ pois }: { pois: NearbyPoi[] }) {
  const { can, loading, role, trial } = usePlan();

  if (loading) return <BlockSkeleton height={200} />;
  if (can("nearbyPois")) return <NearbyPois pois={pois} />;

  return (
    <div className="infoblock">
      <UpgradeWall feature="nearbyPois" role={role} trial={trial} art />
    </div>
  );
}
