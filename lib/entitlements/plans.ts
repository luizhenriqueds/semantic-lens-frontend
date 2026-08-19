import type { PropertiesView } from "@/lib/filters/propertiesUrl";

export const ROLES = ["anon", "basic", "investor", "professional", "platform"] as const;

export type Role = (typeof ROLES)[number];

export type Feature =
  | "favorites"
  | "savedSearches"
  | "curatedAlerts"
  | "groups"
  | "recommendations"
  | "advancedFilters"
  | "analysisView"
  | "marketCompare"
  | "calendarView"
  | "market"
  | "regions"
  | "nearbyPois"
  | "export";

export type Plan = {
  role: Role;
  label: string;
  /** Overrides `label` on the inline badge, where space is tight. */
  badge?: string;
  /** Mirrors `public.role_rank()` in supabase/migrations/0077_user_roles.sql. */
  rank: 0 | 1 | 2 | 3;
  /** Monthly price in BRL. 0 means there is nothing to check out. */
  price: number;
  features: Record<Feature, boolean>;
  limits: { favorites: number | null; savedSearches: number | null; recommendations: number };
};

const NONE: Record<Feature, boolean> = {
  favorites: false,
  savedSearches: false,
  curatedAlerts: false,
  groups: false,
  recommendations: false,
  advancedFilters: false,
  analysisView: false,
  marketCompare: false,
  calendarView: false,
  market: false,
  regions: false,
  nearbyPois: false,
  export: false,
};

const INVESTOR_FEATURES: Record<Feature, boolean> = {
  ...NONE,
  favorites: true,
  savedSearches: true,
  curatedAlerts: true,
  groups: true,
  recommendations: true,
  advancedFilters: true,
  analysisView: true,
  marketCompare: true,
  nearbyPois: true,
};

const PRO_FEATURES: Record<Feature, boolean> = {
  ...INVESTOR_FEATURES,
  calendarView: true,
  market: true,
  regions: true,
  export: true,
};

export const PLANS: Record<Role, Plan> = {
  anon: {
    role: "anon",
    label: "Visitante",
    rank: 0,
    price: 0,
    features: NONE,
    limits: { favorites: 0, savedSearches: 0, recommendations: 0 },
  },
  basic: {
    role: "basic",
    label: "Básico",
    rank: 1,
    price: 0,
    features: { ...NONE, favorites: true, savedSearches: true },
    limits: { favorites: 10, savedSearches: 3, recommendations: 0 },
  },
  investor: {
    role: "investor",
    label: "Investidor",
    rank: 2,
    price: 39,
    features: INVESTOR_FEATURES,
    limits: { favorites: null, savedSearches: null, recommendations: 5 },
  },
  professional: {
    role: "professional",
    label: "Profissional",
    badge: "Pro",
    rank: 3,
    price: 79,
    features: PRO_FEATURES,
    limits: { favorites: null, savedSearches: null, recommendations: 10 },
  },
  platform: {
    role: "platform",
    label: "API",
    rank: 3,
    price: 0,
    features: PRO_FEATURES,
    limits: { favorites: null, savedSearches: null, recommendations: 10 },
  },
};

/** The `/properties` views that a plan can lock. Absent = open to everyone. */
export const VIEW_FEATURE: Partial<Record<PropertiesView, Feature>> = {
  analysis: "analysisView",
  calendar: "calendarView",
};

/** Routes that are a whole feature. Absent = open to everyone, anon included. */
export const PATH_FEATURE: Record<string, Feature> = {
  "/market": "market",
  "/groups": "groups",
  "/regions": "regions",
};

/** The roles with a price. `platform` is sold by hand and `basic` is free, so neither is buyable.
 *  Plan vocabulary rather than provider vocabulary: it lives here so the data layer can classify a
 *  subscription row without pulling in the payment SDK. */
export const PAID_ROLES = ["investor", "professional"] as const;
export type PaidRole = (typeof PAID_ROLES)[number];

export const isPaidRole = (r: unknown): r is PaidRole => PAID_ROLES.includes(r as PaidRole);

export const priceInCents = (role: PaidRole): number => Math.round(PLANS[role].price * 100);

export const TRIAL_DAYS = 7;

/** The one plan a user can self-serve, until payment is integrated. */
export const TRIAL_ROLE: Role = "investor";

/** `eligible` = never started. `endsAt` = active trial. `expired` = used up, now back on basic. */
export type Trial = { eligible: boolean; endsAt: string | null; expired: boolean };

export type Entitlements = {
  role: Role;
  isAdmin: boolean;
  plan: Plan;
  trial: Trial;
  can: (f: Feature) => boolean;
  limit: (k: keyof Plan["limits"]) => number | null;
  atLeast: (r: Role) => boolean;
};

export const toRole = (raw: unknown): Role =>
  ROLES.includes(raw as Role) && raw !== "anon" ? (raw as Role) : "basic";

/** Admin is applied here, not by mapping onto a role, so the UI still shows the real plan. */
export function entitlementsFor(
  role: Role,
  isAdmin: boolean,
  trial: Trial = { eligible: false, endsAt: null, expired: false },
): Entitlements {
  const plan = PLANS[role] ?? PLANS.basic;
  return {
    role,
    isAdmin,
    plan,
    trial,
    can: (f) => isAdmin || plan.features[f],
    limit: (k) => (isAdmin ? null : plan.limits[k]),
    atLeast: (r) => isAdmin || plan.rank >= PLANS[r].rank,
  };
}

/** The plans a user can actually buy, cheapest first. */
export const SELLABLE_PLANS: readonly Plan[] = ROLES.filter((r) => r !== "anon" && r !== "platform")
  .map((r) => PLANS[r])
  .sort((a, b) => a.rank - b.rank);

/** Smallest plan that unlocks a feature - drives the upsell copy. */
export function requiredPlan(f: Feature): Plan {
  return SELLABLE_PLANS.find((p) => p.features[f]) ?? PLANS.professional;
}
