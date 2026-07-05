"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fmtDist } from "@/lib/format";
import { catColor, homeIcon, poiIcon } from "@/lib/mapMarkers";
import { POI_ICON } from "@/lib/icons";
import { POI_LABEL, POI_ORDER } from "@/lib/pois";
import type { NearbyPoi } from "@/lib/types";

function poiPopup(p: NearbyPoi): string {
  const label = POI_LABEL[p.category] ?? p.category;
  const name = p.name ?? label;
  return `<b>${name}</b><br><span class="pm-price">${label}</span> · ${fmtDist(p.distance)}`;
}

export default function PropertyPoiMap({
  lat,
  lon,
  title,
  pois,
}: {
  lat: number;
  lon: number;
  title: string;
  pois: NearbyPoi[];
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([lat, lon], 14);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    L.marker([lat, lon], { icon: homeIcon(), zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(`<b>${title}</b><br><span class="pm-price">Imóvel</span>`);

    const pts: [number, number][] = [[lat, lon]];
    for (const p of pois) {
      L.marker([p.lat, p.lon], { icon: poiIcon(p.category) })
        .addTo(map)
        .bindPopup(poiPopup(p));
      pts.push([p.lat, p.lon]);
    }
    map.invalidateSize();
    if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 15, animate: false });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lon, title, pois]);

  const legend = POI_ORDER.filter((cat) => pois.some((p) => p.category === cat));

  return (
    <div className="poimap-wrap">
      <div ref={elRef} className="lmap poimap" />
      <div className="poimap-legend">
        {legend.map((cat) => {
          const Icon = POI_ICON[cat];
          return (
            <span key={cat}>
              <i style={{ background: catColor(cat) }}>{Icon && <Icon />}</i>
              {POI_LABEL[cat] ?? cat}
            </span>
          );
        })}
      </div>
    </div>
  );
}
