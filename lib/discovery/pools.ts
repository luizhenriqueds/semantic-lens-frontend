import { SCORE_FIELD } from "@/lib/format";
import type { ProfileKey, PropertyFilters, PropertySort } from "@/lib/types";

// One definition per rail, so the query that fills it and the "Ver todos" link that
// leaves it cannot drift apart.
export type Pool = {
  filters: PropertyFilters;
  sort: PropertySort;
  pageSize: number;
  /** null when /properties cannot express the rail's criteria. */
  href: string | null;
};

export const RAIL_SIZE = 10;

// Awaited before the first byte (it feeds the LCP hero), so it stays the smallest pool
// that still leaves the hero a few dozen well-shot candidates to rotate through.
export const HIGHLIGHTS: Pool = {
  filters: { minInvestment: 74, minDiscount: 40 },
  sort: "score",
  pageSize: 60,
  href: "/properties?invest=74&desconto=40&sort=score",
};

// The closing rail reads getUpcomingAuctions rather than a Pool - see the note on
// `auction_within_days` in lib/data/propertyList.ts. The calendar view is still the
// right destination for "ver agenda".
export const CLOSING_HREF = "/properties?prazo=7&view=calendar";

export const DISCOUNT: Pool = {
  filters: { minDiscount: 58, minInvestment: 60 },
  sort: "desconto",
  pageSize: 40,
  href: "/properties?desconto=58&invest=60&sort=desconto",
};

export const BUDGET: Pool = {
  filters: { maxPrice: 90_000, minInvestment: 68 },
  sort: "score",
  pageSize: 40,
  href: "/properties?preco=90000&invest=68&sort=score",
};

export const FINANCING: Pool = {
  filters: { financing: true, minInvestment: 60 },
  sort: "score",
  pageSize: 40,
  href: "/properties?fin=1&invest=60&sort=score",
};

// No occupancy filter in the RPC contract, so this over-fetches and filters in JS.
// /properties cannot express it either, hence no link.
export const VACANT: Pool = {
  filters: { minInvestment: 60 },
  sort: "score",
  pageSize: 200,
  href: null,
};

const GOAL_SCORE_MIN = 82;

export function goalPool(goal: ProfileKey): Pool {
  const key = SCORE_FIELD[goal];
  return {
    filters: { scoreKey: key, scoreMin: GOAL_SCORE_MIN },
    sort: "score",
    pageSize: 40,
    href: `/properties?goal=${key}&goalMin=${GOAL_SCORE_MIN}&sort=score`,
  };
}
