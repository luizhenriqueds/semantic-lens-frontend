"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Pagination from "@/components/ui/Pagination";
import PropertyRow from "@/components/property/PropertyRow";
import { LIST_PAGE_SIZE, PROPERTY_SORTS, sortParam } from "@/lib/filters/propertiesUrl";
import type { Property, PropertySort } from "@/lib/types";

export default function AlertMatches({
  id,
  items,
  total,
  page,
  sort,
  poiCats,
  poiRadius,
}: {
  id: string;
  items: Property[];
  total: number;
  page: number;
  sort: PropertySort;
  poiCats?: string[];
  poiRadius?: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startNav] = useTransition();

  const go = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) sp.set(k, v);
    startNav(() => router.push(`/alerts/${id}?${sp}`, { scroll: false }));
  };

  return (
    <>
      <div className="viewbar">
        <h2 className="resultcount">
          {total} {total === 1 ? "imóvel corresponde" : "imóveis correspondem"} hoje
          {total > items.length && (
            <span className="range">
              mostrando {(page - 1) * LIST_PAGE_SIZE + 1}–
              {(page - 1) * LIST_PAGE_SIZE + items.length} de {total}
            </span>
          )}
        </h2>
        <select
          className="selectish"
          value={sortParam(sort)}
          onChange={(e) => go({ sort: e.target.value, page: "1" })}
        >
          {PROPERTY_SORTS.map((s) => (
            <option key={s.param} value={s.param}>
              Ordenar: {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="wlist">
        {items.map((p) => (
          <PropertyRow key={p.id} p={p} poiCats={poiCats} poiRadius={poiRadius} />
        ))}
      </div>

      <Pagination
        page={page}
        total={total}
        pageSize={LIST_PAGE_SIZE}
        onChange={(p) => {
          go({ page: String(p) });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
