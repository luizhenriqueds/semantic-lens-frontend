import { SCORE_FIELD } from "@/lib/format";
import { CHANGE_WINDOW_DAYS } from "@/lib/filters/propertiesUrl";
import type { ProfileKey, PropertyChangeKind, PropertyFilters, PropertySort } from "@/lib/types";

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
  href: "/properties?min_investment=74&min_discount=40&sort=score",
};

// The closing rail reads getUpcomingAuctions rather than a Pool - see the note on
// `auction_within_days` in lib/data/propertyList.ts. The calendar view is still the
// right destination for "ver agenda".
export const CLOSING_HREF = "/properties?auction_within_days=7&view=calendar";

export const DISCOUNT: Pool = {
  filters: { minDiscount: 58, minInvestment: 60 },
  sort: "desconto",
  pageSize: 40,
  href: "/properties?min_discount=58&min_investment=60&sort=discount",
};

export const BUDGET: Pool = {
  filters: { maxPrice: 100_000, minInvestment: 68 },
  sort: "score",
  pageSize: 40,
  href: "/properties?max_price=100000&min_investment=68&sort=score",
};

export const FINANCING: Pool = {
  filters: { financing: true, minInvestment: 60 },
  sort: "score",
  pageSize: 40,
  href: "/properties?financing=1&min_investment=60&sort=score",
};

// No occupancy filter in the RPC contract, so this over-fetches and filters in JS.
// /properties cannot express it either, hence no link.
export const VACANT: Pool = {
  filters: { minInvestment: 60 },
  sort: "score",
  pageSize: 200,
  href: null,
};

const CHANGE_INVEST_MIN = 60;

const changePool = (kind: PropertyChangeKind): Pool => ({
  filters: {
    changeKind: kind,
    changedWithinDays: CHANGE_WINDOW_DAYS,
    minInvestment: CHANGE_INVEST_MIN,
  },
  sort: "score",
  pageSize: 40,
  href: `/properties?change_kind=${kind}&changed_within_days=${CHANGE_WINDOW_DAYS}&min_investment=${CHANGE_INVEST_MIN}&sort=score`,
});

export const MODALITY_CHANGE = changePool("modality");
export const PAYMENT_CHANGE = changePool("payment");

const GOAL_SCORE_MIN = 82;

export function goalPool(goal: ProfileKey): Pool {
  const key = SCORE_FIELD[goal];
  return {
    filters: { scoreKey: key, scoreMin: GOAL_SCORE_MIN },
    sort: "score",
    pageSize: 40,
    href: `/properties?score_key=${key}&score_min=${GOAL_SCORE_MIN}&sort=score`,
  };
}
