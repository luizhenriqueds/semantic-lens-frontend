"use client";

import { useEffect, useRef, useState } from "react";
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
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const [expanded, setExpanded] = useState(false);

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
      boundsRef.current = L.latLngBounds(pts);
      map.fitBounds(boundsRef.current, { padding: [30, 30], maxZoom: 15, animate: false });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lon, title, pois]);

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

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const legend = POI_ORDER.filter((cat) => pois.some((p) => p.category === cat));

  return (
    <div className={`poimap-wrap${expanded ? " expanded" : ""}`}>
      <button
        type="button"
        className="mapexpand"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Fechar mapa" : "Expandir mapa"}
      >
        {expanded ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-8 8M3 21l8-8" />
          </svg>
        )}
      </button>
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
