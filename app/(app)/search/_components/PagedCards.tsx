"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Pagination from "@/components/ui/Pagination";
import PropertyCard from "@/components/property/PropertyCard";
import { SEARCH_PAGE_SIZE, SEARCH_SORTS, type SearchSort } from "@/lib/searchSort";
import type { ProfileKey, Property } from "@/lib/types";

// Page and sort live in the URL so the server can slice: only one page is ever serialized.
export default function PagedCards({
  items,
  total,
  page,
  sort,
  highlightGoal,
  heading,
}: {
  items: Property[];
  total: number;
  page: number;
  sort: SearchSort;
  highlightGoal?: ProfileKey | null;
  heading?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startNav] = useTransition();

  const go = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) sp.set(k, v);
    startNav(() => router.push(`/search?${sp}`, { scroll: false }));
  };

  return (
    <>
      <div className="viewbar">
        {heading && (
          <h2 className="resultcount">
            {heading}
            {total > items.length && (
              <span className="range">
                mostrando {(page - 1) * SEARCH_PAGE_SIZE + 1}–
                {(page - 1) * SEARCH_PAGE_SIZE + items.length} de {total}
              </span>
            )}
          </h2>
        )}
        <select
          className="selectish"
          value={sort}
          onChange={(e) => go({ sort: e.target.value, page: "1" })}
        >
          {SEARCH_SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Ordenar: {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="pgrid">
        {items.map((p) => (
          <PropertyCard key={p.id} p={p} highlightGoal={highlightGoal} />
        ))}
      </div>
      <Pagination
        page={page}
        total={total}
        pageSize={SEARCH_PAGE_SIZE}
        onChange={(p) => {
          go({ page: String(p) });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
