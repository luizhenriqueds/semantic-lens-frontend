import { investmentScore, profileScore } from "@/lib/format";
import type { Property } from "@/lib/types";

export const SEARCH_PAGE_SIZE = 25;

export type SearchSort = "relevancia" | "investimento" | "desconto" | "score" | "menor" | "maior";

export const SEARCH_SORTS: { key: SearchSort; label: string }[] = [
  { key: "relevancia", label: "Relevância" },
  { key: "investimento", label: "Melhor investimento" },
  { key: "desconto", label: "Maior desconto" },
  { key: "score", label: "Melhor nota do objetivo" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
];

export function parseSort(v: string | undefined): SearchSort {
  return SEARCH_SORTS.some((s) => s.key === v) ? (v as SearchSort) : "relevancia";
}

// "relevancia" is the order the pipeline already produced.
export function sortProperties(items: Property[], sort: SearchSort): Property[] {
  if (sort === "relevancia") return items;
  return [...items].sort((a, b) => {
    if (sort === "investimento") return (investmentScore(b) ?? 0) - (investmentScore(a) ?? 0);
    if (sort === "desconto") return (b.discount ?? 0) - (a.discount ?? 0);
    if (sort === "score") return (profileScore(b) ?? 0) - (profileScore(a) ?? 0);
    if (sort === "menor") return (a.saleValue ?? Infinity) - (b.saleValue ?? Infinity);
    return (b.saleValue ?? 0) - (a.saleValue ?? 0);
  });
}
