"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { groupByAddress } from "@/lib/geo";
import { IconPin } from "@/lib/icons";
import type { Property } from "@/lib/types";

const MAX_ROWS = 10;

export default function SameAddressGroups({ properties }: { properties: Property[] }) {
  const groups = useMemo(() => {
    const located = groupByAddress(properties);
    const coordless = properties.filter((p) => p.lat == null || p.lon == null).map((p) => [p]);
    return [...located, ...coordless].sort((a, b) => b.length - a.length);
  }, [properties]);
  const [open, setOpen] = useState(false);

  if (!groups.length) return null;

  const total = groups.reduce((s, g) => s + g.length, 0);
  const stacked = groups.some((g) => g.length > 1);
  const collapsible = total > MAX_ROWS;

  // Cap the number of property rows, truncating within a group if one is large enough
  // to blow the budget on its own. `full` keeps the real size for the badge.
  let shown = groups.map((g) => ({ full: g.length, items: g }));
  if (collapsible && !open) {
    shown = [];
    let rows = 0;
    for (const g of groups) {
      if (rows >= MAX_ROWS) break;
      shown.push({ full: g.length, items: g.slice(0, MAX_ROWS - rows) });
      rows += g.length;
    }
  }

  return (
    <div className="sameaddr">
      <div className="sameaddr-head">
        <IconPin width={16} height={16} strokeWidth={1.8} />
        Imóveis nesta região
        <span className="sameaddr-count">
          {groups.length} {groups.length === 1 ? "endereço" : "endereços"} · {total}{" "}
          {total === 1 ? "imóvel" : "imóveis"}
        </span>
      </div>
      {stacked && (
        <p className="sameaddr-note">
          Endereços com mais de um imóvel aparecem empilhados num único ponto no mapa.
        </p>
      )}
      {shown.map(({ full, items }) => (
        <div className="sameaddr-group" key={items[0].id}>
          <span className={`sameaddr-badge${full === 1 ? " solo" : ""}`}>
            {full} {full === 1 ? "imóvel" : "imóveis"}
          </span>
          <div className="sameaddr-list">
            {items.map((p) => (
              <Link className="sameaddr-item" key={p.id} href={`/property/${p.id}`}>
                <span className="sa-title">{p.title}</span>
                <span className="sa-price">{money(p.saleValue)}</span>
              </Link>
            ))}
            {full > items.length && (
              <span className="sameaddr-trunc">+{full - items.length} neste endereço</span>
            )}
          </div>
        </div>
      ))}
      {collapsible && (
        <button
          type="button"
          className={`sameaddr-more${open ? " open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Ver menos" : `Ver todos os ${total} imóveis`}
          <span className="sameaddr-car">▾</span>
        </button>
      )}
    </div>
  );
}
