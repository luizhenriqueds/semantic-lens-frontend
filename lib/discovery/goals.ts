import type { ProfileKey } from "@/lib/types";

export const DISCOVERY_GOALS: ProfileKey[] = [
  "airbnb",
  "flip",
  "student",
  "family",
  "commercial",
  "high_liquidity",
];

export const DEFAULT_GOAL: ProfileKey = "airbnb";

const VALID = new Set<string>(DISCOVERY_GOALS);

export function parseGoal(raw: string | string[] | undefined): ProfileKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v && VALID.has(v) ? (v as ProfileKey) : DEFAULT_GOAL;
}
