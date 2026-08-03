"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { fetchPropertyImage } from "@/app/actions/properties";
import { fmtDate, money, showDiscount } from "@/lib/format";
import { groupByAddress } from "@/lib/geo";
import { homeIcon, homeIconCount } from "@/lib/mapMarkers";
import MapExpandButton from "@/components/ui/MapExpandButton";
import type { Property } from "@/lib/types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function metaLine(p: Property): string {
  const bits = [p.propertyType];
  if (p.area != null) bits.push(`${Math.round(p.area)} m²`);
  if (p.bedrooms != null) bits.push(`${p.bedrooms} ${p.bedrooms === 1 ? "quarto" : "quartos"}`);
  if (p.parkingSpots) bits.push(`${p.parkingSpots} ${p.parkingSpots === 1 ? "vaga" : "vagas"}`);
  return esc(bits.filter(Boolean).join(" · "));
}

function footLine(p: Property): string {
  const bits: string[] = [];
  if (p.scores.investment != null) {
    bits.push(`<span class="pm-note">Nota ${Math.round(p.scores.investment)}</span>`);
  }
  const d = fmtDate(p.auctionDate);
  if (d) bits.push(`leilão em ${esc(d)}`);
  if (p.occupancyStatus) bits.push(esc(p.occupancyStatus));
  return bits.length ? `<div class="pm-foot">${bits.join(" · ")}</div>` : "";
}

function priceLine(p: Property): string {
  const disc = showDiscount(p) ? ` <span class="pm-disc">−${Math.round(p.discount!)}%</span>` : "";
  return `<span class="pm-price">${money(p.saleValue)}</span>${disc}`;
}

const photoCache = new Map<string, string | null>();

const loads = (src: string) =>
  new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });

function photoSlot(p: Property): string {
  const src = photoCache.get(p.id) ?? p.image;
  if (src) return `<div class="pm-photo on"><img src="${esc(src)}" alt="" /></div>`;
  return `<div class="pm-photo" data-photo-id="${esc(p.id)}"></div>`;
}

// Leaflet re-renders the popup string on update(), so cache first and let it repaint.
async function resolvePhoto(popup: L.Popup) {
  const id = popup.getElement()?.querySelector<HTMLElement>(".pm-photo")?.dataset.photoId;
  if (!id || photoCache.has(id)) return;
  photoCache.set(id, null); // claims the id, so a reopen mid-flight does not fetch again
  const url = await fetchPropertyImage(id).catch(() => null);
  const ok = !!url && (await loads(url));
  if (!ok) return;
  photoCache.set(id, url);
  popup.update();
}

function singlePopup(p: Property): string {
  return [
    photoSlot(p),
    `<b>${esc(p.title)}</b>`,
    `<div class="pm-sub">${esc([p.neighborhood, `${p.city}/${p.uf}`].filter(Boolean).join(" · "))}</div>`,
    `<div class="pm-meta">${metaLine(p)}</div>`,
    `<div>${priceLine(p)}</div>`,
    footLine(p),
    `<a href="/property/${p.id}">Ver imóvel ›</a>`,
  ].join("");
}

function groupPopup(group: Property[]): string {
  const first = group[0];
  return [
    `<b>${group.length} imóveis neste endereço</b>`,
    `<div class="pm-sub">${esc([first.neighborhood, `${first.city}/${first.uf}`].filter(Boolean).join(" · "))}</div>`,
    ...group.map(
      (p) =>
        `<a class="pm-multi" href="/property/${p.id}"><span>${esc(p.title)}${
          p.area != null ? ` <span class="pm-meta">· ${Math.round(p.area)} m²</span>` : ""
        }</span>${priceLine(p)}</a>`,
    ),
  ].join("");
}

export default function PropertiesMap({ properties }: { properties: Property[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.MarkerClusterGroup | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView([-20.45, -54.62], 6);
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    layerRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 55,
      chunkedLoading: true,
    }).addTo(map);
    map.on("popupopen", (e) => void resolvePhoto(e.popup));

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
    const located = properties.filter((p) => p.lat != null && p.lon != null);

    for (const group of groupByAddress(located)) {
      const [lat, lon] = [group[0].lat!, group[0].lon!];
      L.marker([lat, lon], {
        icon: group.length > 1 ? homeIconCount(group.length) : homeIcon(),
      })
        .addTo(layer)
        .bindPopup(() => (group.length > 1 ? groupPopup(group) : singlePopup(group[0])), {
          maxWidth: 300,
        });
      pts.push([lat, lon]);
    }

    map.invalidateSize();
    boundsRef.current = pts.length ? L.latLngBounds(pts) : null;
    if (boundsRef.current) {
      map.fitBounds(boundsRef.current, { padding: [40, 40], maxZoom: 15, animate: false });
    }
  }, [properties]);

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

  return (
    <div className={`propmap-wrap${expanded ? " expanded" : ""}`}>
      <MapExpandButton expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
      <div ref={elRef} className="lmap propmap" />
    </div>
  );
}
