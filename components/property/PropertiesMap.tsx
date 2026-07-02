"use client";

import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { money, showDiscount } from "@/lib/format";
import type { Property } from "@/lib/types";

const MarkerPin = () => (
  <svg viewBox="0 0 32 42" width="32" height="42" fill="none">
    <path
      d="M16 41s14-15.2 14-25A14 14 0 1 0 2 16c0 9.8 14 25 14 25Z"
      fill="var(--primary)"
      stroke="var(--surface)"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="15.5" r="8.6" fill="var(--surface)" />
    <g
      stroke="var(--primary)"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M11.4 16.4 16 12.2l4.6 4.2" />
      <path d="M12.6 15.6v4.2h6.8v-4.2" />
    </g>
  </svg>
);

const homeIcon = () =>
  L.divIcon({
    className: "lmk-pin",
    html: renderToStaticMarkup(<MarkerPin />),
    iconSize: [32, 42],
    iconAnchor: [16, 41],
    popupAnchor: [0, -38],
  });

function popupHtml(p: Property): string {
  const disc = showDiscount(p) ? ` <span class="pm-disc">−${Math.round(p.discount!)}%</span>` : "";
  return `<b>${p.title}</b><br>${p.neighborhood} · ${p.city}/${p.uf}<br><span class="pm-price">${money(p.saleValue)}</span>${disc}<br><a href="/property/${p.id}">Ver imóvel ›</a>`;
}

export default function PropertiesMap({ properties }: { properties: Property[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([-20.45, -54.62], 6);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const pts: [number, number][] = [];
    for (const p of properties) {
      if (p.lat == null || p.lon == null) continue;
      L.marker([p.lat, p.lon], { icon: homeIcon() }).addTo(layer).bindPopup(popupHtml(p));
      pts.push([p.lat, p.lon]);
    }
    map.invalidateSize();
    if (pts.length) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15, animate: false });
    }
  }, [properties]);

  return <div ref={elRef} className="lmap propmap" />;
}
