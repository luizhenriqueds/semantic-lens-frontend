"use client";

import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import PropertyCard from "@/components/property/PropertyCard";
import { investmentScore, profileScore } from "@/lib/format";
import type { ProfileKey, Property } from "@/lib/types";

const PAGE_SIZE = 25;

type Sort = "relevancia" | "investimento" | "desconto" | "score" | "menor" | "maior";

const SORTS: { key: Sort; label: string }[] = [
  { key: "relevancia", label: "Relevância" },
  { key: "investimento", label: "Melhor investimento" },
  { key: "desconto", label: "Maior desconto" },
  { key: "score", label: "Melhor nota do objetivo" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
];

export default function PagedCards({
  items,
  resetKey,
  highlightGoal,
  heading,
}: {
  items: Property[];
  resetKey?: string;
  highlightGoal?: ProfileKey | null;
  heading?: string;
}) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<Sort>("relevancia");
  useEffect(() => setPage(1), [resetKey, sort]);

  const sorted = useMemo(() => {
    if (sort === "relevancia") return items;
    const list = [...items];
    list.sort((a, b) => {
      if (sort === "investimento") return (investmentScore(b) ?? 0) - (investmentScore(a) ?? 0);
      if (sort === "desconto") return (b.discount ?? 0) - (a.discount ?? 0);
      if (sort === "score") return (profileScore(b) ?? 0) - (profileScore(a) ?? 0);
      if (sort === "menor") return (a.saleValue ?? Infinity) - (b.saleValue ?? Infinity);
      return (b.saleValue ?? 0) - (a.saleValue ?? 0);
    });
    return list;
  }, [items, sort]);

  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="viewbar">
        {heading && <h2 className="resultcount">{heading}</h2>}
        <select
          className="selectish"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Ordenar: {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="pgrid">
        {pageItems.map((p) => (
          <PropertyCard key={p.id} p={p} highlightGoal={highlightGoal} />
        ))}
      </div>
      <Pagination
        page={page}
        total={sorted.length}
        pageSize={PAGE_SIZE}
        onChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
