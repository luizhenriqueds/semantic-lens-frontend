"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fmtDist, money } from "@/lib/format";
import { catColor, homeIcon, poiIcon } from "@/lib/mapMarkers";
import { POI_ICON } from "@/lib/icons";
import { POI_LABEL, POI_ORDER } from "@/lib/pois";
import type { NearbyPoi, Property } from "@/lib/types";

export default function RegionGeoMap({
  center,
  properties,
  pois,
  variant = "detail",
}: {
  center: { lat: number; lon: number };
  properties: Property[];
  pois: NearbyPoi[];
  variant?: "detail" | "heat";
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heat = variant === "heat";

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView(
      [center.lat, center.lon],
      14,
    );
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const pts: [number, number][] = [];

    for (const p of properties) {
      if (p.lat == null || p.lon == null) continue;
      pts.push([p.lat, p.lon]);
      L.marker([p.lat, p.lon], { icon: homeIcon() })
        .addTo(map)
        .bindPopup(
          `<b>${p.title}</b><br>${p.neighborhood}<br><span class="pm-price">${money(p.saleValue)}</span><br><a href="/property/${p.id}">Ver imóvel ›</a>`,
        );
    }

    if (!heat) {
      for (const poi of pois) {
        L.marker([poi.lat, poi.lon], { icon: poiIcon(poi.category) })
          .addTo(map)
          .bindPopup(
            `<b>${poi.name ?? POI_LABEL[poi.category] ?? poi.category}</b><br><span class="pm-price">${POI_LABEL[poi.category] ?? poi.category}</span> · ${fmtDist(poi.distance)}`,
          );
        pts.push([poi.lat, poi.lon]);
      }
    }

    map.invalidateSize();
    if (pts.length) {
      map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 15, animate: false });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, properties, pois, heat]);

  const legend = heat ? [] : POI_ORDER.filter((c) => pois.some((p) => p.category === c));

  return (
    <div className="rgeomap-wrap">
      <div ref={elRef} className="lmap rgeomap" />
      {!heat && legend.length > 0 && (
        <div className="poimap-legend">
          <span>
            <i style={{ background: "var(--primary)" }} />
            Imóvel em leilão
          </span>
          {legend.map((c) => {
            const Icon = POI_ICON[c];
            return (
              <span key={c}>
                <i style={{ background: catColor(c) }}>{Icon && <Icon />}</i>
                {POI_LABEL[c] ?? c}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
