"use client";

import { useState } from "react";
import RegionMapClient from "@/components/region/RegionMapClient";
import type { NearbyPoi, Property } from "@/lib/types";

export default function RegionMapTabs({
  center,
  properties,
  pois,
}: {
  center: { lat: number; lon: number };
  properties: Property[];
  pois: NearbyPoi[];
}) {
  const [tab, setTab] = useState<"heat" | "poi">("heat");

  return (
    <>
      <div className="viewtoggle rp-switch">
        <button type="button" className={tab === "heat" ? "on" : ""} onClick={() => setTab("heat")}>
          Onde estão os imóveis
        </button>
        <button type="button" className={tab === "poi" ? "on" : ""} onClick={() => setTab("poi")}>
          Pontos de interesse
        </button>
      </div>
      <RegionMapClient
        center={center}
        properties={properties}
        pois={tab === "poi" ? pois : []}
        variant={tab === "heat" ? "heat" : "detail"}
      />
      <div className="rnote">
        {tab === "heat"
          ? "Cada marcador é um imóvel em leilão nesta região."
          : "Imóveis e pontos de interesse reais próximos (fonte: OpenStreetMap)."}
      </div>
    </>
  );
}
