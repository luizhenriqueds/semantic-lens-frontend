"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import PropertyRow from "@/components/property/PropertyRow";
import type { Property } from "@/lib/types";
import { IconBack, IconCalendar } from "@/lib/icons";

const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function parseAuctionDate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function AuctionCalendar({
  items,
  onDayOpen,
}: {
  items: Property[];
  onDayOpen?: (open: boolean) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, Property[]>();
    for (const p of items) {
      if (!p.auctionDate) continue;
      const d = parseAuctionDate(p.auctionDate);
      if (!d || d < today) continue;
      const k = keyOf(d);
      const list = map.get(k);
      if (list) list.push(p);
      else map.set(k, [p]);
    }
    return map;
  }, [items, today]);

  const firstMonth = useMemo(() => {
    const keys = [...byDay.keys()].sort();
    const base = keys.length ? new Date(keys[0] + "T00:00:00") : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [byDay, today]);

  const [month, setMonth] = useState(firstMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canPrev = month > minMonth;

  const shiftMonth = (delta: number) => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
    setSelected(null);
  };

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leading = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
    ),
  ];

  const selectedItems = selected ? (byDay.get(selected) ?? []) : [];

  useEffect(() => {
    onDayOpen?.(selectedItems.length > 0);
    return () => onDayOpen?.(false);
  }, [selectedItems.length, onDayOpen]);

  return (
    <div className="calwrap">
      <div className="calhead">
        <button
          type="button"
          className="calnav"
          onClick={() => shiftMonth(-1)}
          disabled={!canPrev}
          aria-label="Mês anterior"
        >
          <IconBack width={16} height={16} strokeWidth={2} />
        </button>
        <b>
          {MONTHS[month.getMonth()]} de {month.getFullYear()}
        </b>
        <button
          type="button"
          className="calnav flip"
          onClick={() => shiftMonth(1)}
          aria-label="Próximo mês"
        >
          <IconBack width={16} height={16} strokeWidth={2} />
        </button>
      </div>

      <div className="calgrid">
        {DOW.map((d, i) => (
          <div className="caldow" key={i}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div className="calcell empty" key={`e${i}`} />;
          const k = keyOf(d);
          const count = byDay.get(k)?.length ?? 0;
          const past = d < today;
          const cls = `calcell${past ? " past" : ""}${count ? " has" : ""}${selected === k ? " sel" : ""}`;
          return (
            <button
              type="button"
              className={cls}
              key={k}
              disabled={!count}
              onClick={() => setSelected((s) => (s === k ? null : k))}
            >
              <span className="dnum">{d.getDate()}</span>
              {count > 0 && <span className="calcount">{count}</span>}
            </button>
          );
        })}
      </div>

      {byDay.size === 0 && (
        <EmptyState icon={<IconCalendar />} title="Nenhum leilão no calendário">
          Os imóveis filtrados não têm praças futuras marcadas. Ajuste os filtros para ver outras
          datas.
        </EmptyState>
      )}

      {selected && (
        <div className="calday">
          <div className="calday-h">
            {selectedItems.length} leilã{selectedItems.length > 1 ? "es" : "o"} em{" "}
            {Number(selected.slice(8, 10))} de {MONTHS[Number(selected.slice(5, 7)) - 1]}
          </div>
          {selectedItems.map((p) => (
            <PropertyRow key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
