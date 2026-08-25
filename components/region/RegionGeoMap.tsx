"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fmtDist, money } from "@/lib/format";
import { groupByAddress } from "@/lib/geo";
import { catColor, homeIcon, homeIconCount, poiIcon } from "@/lib/mapMarkers";
import { POI_ICON } from "@/lib/icons";
import { POI_LABEL, POI_ORDER } from "@/lib/pois";
import MapExpandButton from "@/components/ui/MapExpandButton";
import { useScrollLock } from "@/lib/useScrollLock";
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
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const [expanded, setExpanded] = useState(false);
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

    for (const group of groupByAddress(properties)) {
      const [lat, lon] = [group[0].lat!, group[0].lon!];
      pts.push([lat, lon]);
      const popup =
        group.length === 1
          ? `<b>${group[0].title}</b><br>${group[0].neighborhood}<br><span class="pm-price">${money(group[0].saleValue)}</span><br><a href="/property/${group[0].id}">Ver imóvel ›</a>`
          : `<b>${group.length} imóveis neste endereço</b><br><span class="pm-sub">${group[0].neighborhood}</span>${group
              .map(
                (p) =>
                  `<a class="pm-multi" href="/property/${p.id}"><span>${p.title}</span><span class="pm-price">${money(p.saleValue)}</span></a>`,
              )
              .join("")}`;
      L.marker([lat, lon], { icon: group.length > 1 ? homeIconCount(group.length) : homeIcon() })
        .addTo(map)
        .bindPopup(popup);
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
      boundsRef.current = L.latLngBounds(pts);
      map.fitBounds(boundsRef.current, { padding: [28, 28], maxZoom: 15, animate: false });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, properties, pois, heat]);

  // Resize/refit and toggle scroll-zoom when entering or leaving fullscreen.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.scrollWheelZoom[expanded ? "enable" : "disable"]();
    const id = setTimeout(() => {
      map.invalidateSize();
      if (boundsRef.current) {
        map.fitBounds(boundsRef.current, { padding: [40, 40], maxZoom: 15, animate: false });
      }
    }, 60);
    return () => clearTimeout(id);
  }, [expanded]);

  useScrollLock(expanded);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const legend = heat ? [] : POI_ORDER.filter((c) => pois.some((p) => p.category === c));

  return (
    <div className={`rgeomap-wrap${expanded ? " expanded" : ""}`}>
      <MapExpandButton expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
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
