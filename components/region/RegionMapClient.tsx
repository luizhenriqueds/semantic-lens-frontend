"use client";

import dynamic from "next/dynamic";
import type { NearbyPoi, Property } from "@/lib/types";

const RegionGeoMap = dynamic(() => import("@/components/region/RegionGeoMap"), {
  ssr: false,
  loading: () => <div className="lmap rgeomap loading">Carregando mapa…</div>,
});

export default function RegionMapClient(props: {
  center: { lat: number; lon: number };
  properties: Property[];
  pois: NearbyPoi[];
  variant?: "detail" | "heat";
}) {
  return <RegionGeoMap {...props} />;
}
