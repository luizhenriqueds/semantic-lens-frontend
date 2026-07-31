"use client";

import { useState } from "react";
import RegionMapClient from "@/components/region/RegionMapClient";
import { groupByAddress } from "@/lib/geo";
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
  const locations = groupByAddress(properties).length;

  return (
    <>
      <div className="viewtoggle rp-switch">
        <button type="button" className={tab === "heat" ? "on" : ""} onClick={() => setTab("heat")}>
          Onde estão os imóveis
        </button>
        <button type="button" className={tab === "poi" ? "on" : ""} onClick={() => setTab("poi")}>
          Lugares próximos
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
          ? `${properties.length} ${properties.length === 1 ? "imóvel" : "imóveis"} em leilão com localização no mapa${
              locations < properties.length
                ? `, em ${locations} ${locations === 1 ? "endereço" : "endereços"}.`
                : " - cada marcador é um imóvel."
            }`
          : "Imóveis e lugares reais próximos (fonte: OpenStreetMap)."}
      </div>
    </>
  );
}
