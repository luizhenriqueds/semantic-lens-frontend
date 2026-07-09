"use client";

import { useMemo, useState } from "react";
import { fmtDist } from "@/lib/format";
import { POI_ICON } from "@/lib/icons";
import { POI_LABEL, POI_ORDER } from "@/lib/pois";
import type { NearbyPoi } from "@/lib/types";

const SHOWN = 8;

export default function NearbyPois({ pois }: { pois: NearbyPoi[] }) {
  const [cat, setCat] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);

  const cats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of pois) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return POI_ORDER.filter((c) => counts.has(c)).map((c) => ({
      cat: c,
      label: POI_LABEL[c] ?? c,
      count: counts.get(c)!,
    }));
  }, [pois]);

  if (!pois.length) return null;

  const filtered = cat === "all" ? pois : pois.filter((p) => p.category === cat);
  const list = expanded ? filtered : filtered.slice(0, SHOWN);

  return (
    <div className="infoblock">
      <h3>Pontos de interesse próximos</h3>
      <div className="poichips">
        <button
          type="button"
          className={`poichip${cat === "all" ? " on" : ""}`}
          onClick={() => {
            setCat("all");
            setExpanded(false);
          }}
        >
          Todos <span>{pois.length}</span>
        </button>
        {cats.map(({ cat: c, label, count }) => (
          <button
            key={c}
            type="button"
            className={`poichip${cat === c ? " on" : ""}`}
            onClick={() => {
              setCat(c);
              setExpanded(false);
            }}
          >
            {label} <span>{count}</span>
          </button>
        ))}
      </div>

      <div className="poilist">
        {list.map((p) => {
          const Icon = POI_ICON[p.category];
          return (
            <div className="poirow" key={p.id}>
              <div className="pic">{Icon && <Icon />}</div>
              <div className="poirow-name">
                <div className="lab">{p.name || POI_LABEL[p.category] || p.category}</div>
                <div className="sub">{POI_LABEL[p.category] ?? p.category}</div>
              </div>
              <div className="poirow-dist">{fmtDist(p.distance)}</div>
            </div>
          );
        })}
      </div>

      {filtered.length > SHOWN && (
        <button className="btn ghost poimore" type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Ver menos" : `Ver mais ${filtered.length - SHOWN}`}
        </button>
      )}
    </div>
  );
}
