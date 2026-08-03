import { auctionInstant } from "@/lib/auctionTime";
import { normalize } from "@/lib/facets";
import { PROPERTY_SORTS, type SortParam } from "@/lib/filters/propertiesUrl";
import { investmentScore } from "@/lib/format";
import type { Property } from "@/lib/types";

export type PortfolioSort = "recent" | Exclude<SortParam, "score">;

// Labels follow the properties list; the goal score has no goal to score against here.
export const PORTFOLIO_SORTS: { key: PortfolioSort; label: string }[] = [
  { key: "recent", label: "Salvos por último" },
  ...PROPERTY_SORTS.filter((s) => s.param !== "score").map((s) => ({
    key: s.param as Exclude<SortParam, "score">,
    label: s.label,
  })),
];

export type PortfolioFilters = { q: string; uf: string; type: string };

export const NO_PORTFOLIO_FILTERS: PortfolioFilters = { q: "", uf: "", type: "" };

export const hasPortfolioFilters = (f: PortfolioFilters) => !!(f.q.trim() || f.uf || f.type);

export function filterPortfolio(items: Property[], f: PortfolioFilters): Property[] {
  const q = normalize(f.q);
  return items.filter((p) => {
    if (f.uf && p.uf !== f.uf) return false;
    if (f.type && p.propertyType !== f.type) return false;
    return !q || normalize(`${p.title} ${p.neighborhood} ${p.city} ${p.uf}`).includes(q);
  });
}

// Undated listings sort last.
const auctionKey = (p: Property) => auctionInstant(p.auctionDate) ?? Infinity;

// "recent" is the incoming order: the carteira is built newest-favourite first.
export function sortPortfolio(items: Property[], sort: PortfolioSort): Property[] {
  if (sort === "recent") return items;
  return [...items].sort((a, b) => {
    switch (sort) {
      case "auction":
        return auctionKey(a) - auctionKey(b);
      case "discount":
        return (b.discount ?? 0) - (a.discount ?? 0);
      case "investment":
        return (investmentScore(b) ?? 0) - (investmentScore(a) ?? 0);
      case "price_asc":
        return (a.saleValue ?? Infinity) - (b.saleValue ?? Infinity);
      default:
        return (b.saleValue ?? 0) - (a.saleValue ?? 0);
    }
  });
}

/** Only values the carteira holds, so no filter can empty the list on its own. */
export function portfolioOptions(items: Property[]): { ufs: string[]; types: string[] } {
  const ufs = new Set<string>();
  const types = new Set<string>();
  for (const p of items) {
    if (p.uf) ufs.add(p.uf);
    if (p.propertyType) types.add(p.propertyType);
  }
  return { ufs: [...ufs].sort(), types: [...types].sort() };
}
