"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import RegionScoreBars from "@/components/region/RegionScoreBars";
import PoiNearGrid from "@/components/region/PoiNearGrid";
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
  const canMap = lat != null && lon != null;
  const [tab, setTab] = useState<Tab>("perfil");
  const view = canMap ? tab : "perfil";

  return (
    <div className="rpanel">
      <div className="rp-top">
        <div>
          <h3>A região: {region.name}</h3>
          <div className="where">
            {region.city} · {region.numProps} imóveis analisados
          </div>
        </div>
        <Link className="btn ghost" href={`/regions/${region.h3}`}>
          Ver página da região ›
        </Link>
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
          <PoiNearGrid region={region} />
          <div className="rnote">Calculado a partir de dados de mapa (OpenStreetMap).</div>
        </>
      )}
    </div>
  );
}
