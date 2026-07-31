"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import RegionScoreBars from "@/components/region/RegionScoreBars";
import PoiNearGrid from "@/components/region/PoiNearGrid";
import { usePlan } from "@/components/plan/PlanProvider";
import type { NearbyPoi, Region } from "@/lib/types";

const PropertyPoiMap = dynamic(() => import("@/components/region/PropertyPoiMap"), {
  ssr: false,
  loading: () => <div className="lmap poimap loading">Carregando mapa…</div>,
});

type Tab = "perfil" | "mapa";

export default function RegionPanel({
  region,
  pois,
  lat,
  lon,
  title,
}: {
  region: Region;
  pois: NearbyPoi[];
  lat: number | null;
  lon: number | null;
  title: string;
}) {
  const { can } = usePlan();
  const canMap = lat != null && lon != null;
  const [tab, setTab] = useState<Tab>("perfil");
  const view = canMap ? tab : "perfil";

  const nearest: Record<string, number> = {};
  for (const poi of pois) {
    if (nearest[poi.category] == null || poi.distance < nearest[poi.category]) {
      nearest[poi.category] = poi.distance;
    }
  }

  return (
    <div className="rpanel">
      <div className="rp-top">
        <div>
          <h3>A região: {region.name}</h3>
          <div className="where">
            {region.city} · {region.numProps} {region.numProps === 1 ? "imóvel" : "imóveis"} em
            leilão
          </div>
        </div>
        {/* The region page itself is gated, so a locked plan is not offered the trip. */}
        {can("regions") && (
          <Link className="btn ghost" href={`/regions/${region.h3}`}>
            Ver página da região ›
          </Link>
        )}
      </div>

      {canMap && (
        <div className="viewtoggle rp-switch">
          <button
            type="button"
            className={view === "perfil" ? "on" : ""}
            onClick={() => setTab("perfil")}
          >
            Perfil da região
          </button>
          <button
            type="button"
            className={view === "mapa" ? "on" : ""}
            onClick={() => setTab("mapa")}
          >
            Mapa e pontos de interesse
          </button>
        </div>
      )}

      {view === "mapa" && canMap ? (
        <>
          <PropertyPoiMap lat={lat!} lon={lon!} title={title} pois={pois} />
          <div className="rnote">
            Pontos de interesse reais próximos do imóvel (fonte: OpenStreetMap).
          </div>
        </>
      ) : (
        <>
          <RegionScoreBars region={region} />
          <PoiNearGrid nearest={nearest} />
          <div className="rnote">Calculado a partir de dados de mapa (OpenStreetMap).</div>
        </>
      )}
    </div>
  );
}
