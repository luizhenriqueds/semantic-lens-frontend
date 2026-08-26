"use client";

import { useSyncExternalStore } from "react";
import { countAlertMatches, countDescriptionMatches } from "@/app/actions/alerts";
import { criteriaKey } from "@/lib/alerts/criteria";
import { onResetClientStores } from "@/lib/clientStore";
import type { Alert, AlertCriteria } from "@/lib/types";

export type CountState =
  | { status: "idle" }
  | { status: "loading" }
  /** Past the budget but still running - the value lands later and replaces this. */
  | { status: "slow" }
  | { status: "ready"; value: number; capped: boolean; at: number }
  | { status: "error" };

const IDLE: CountState = { status: "idle" };
const LOADING: CountState = { status: "loading" };
const SLOW: CountState = { status: "slow" };
const ERROR: CountState = { status: "error" };

// Matches the server's own SEARCH_REVALIDATE window; a shorter TTL would just miss that cache.
const TTL_MS = 600_000;
const BUDGET_MS = 5_000;
const STORAGE_KEY = "alert-counts";

// State objects are stored, not rebuilt per read: useSyncExternalStore compares snapshots by
// identity, and a fresh object every call re-renders forever.
const states = new Map<string, CountState>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

// Keyed by what is counted, not by which alert asked: the form's preview and the saved row key
// alike, so a count paid for once is reused - across alerts, and across navigations.
const keyFor = (criteria: AlertCriteria | undefined, name: string): string =>
  criteria ? `c:${criteriaKey(criteria)}` : `d:${name.trim()}`;

const countKey = (a: Alert): string => keyFor(a.criteria, a.name);

const ready = (key: string, value: number, capped: boolean) => {
  states.set(key, { status: "ready", value, capped, at: Date.now() });
  persist();
  emit();
};

function persist() {
  const out = [...states].flatMap(([key, s]) => (s.status === "ready" ? [{ key, ...s }] : []));
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch (err) {
    console.warn("Failed to persist alert counts", err);
  }
}

let hydrated = false;
function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const now = Date.now();
    for (const { key, ...s } of JSON.parse(raw) as ({ key: string } & CountState)[]) {
      if (key && s.status === "ready" && now - s.at < TTL_MS) states.set(key, s);
    }
  } catch (err) {
    console.warn("Failed to read alert counts", err);
  }
}

function clear() {
  states.clear();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // A cleared cache that cannot be persisted is still cleared in memory.
  }
  emit();
}

onResetClientStores(clear);

function read(key: string): CountState {
  hydrate();
  const s = states.get(key);
  if (!s) return IDLE;
  if (s.status === "ready" && Date.now() - s.at >= TTL_MS) {
    states.delete(key);
    return IDLE;
  }
  return s;
}

async function fetchCount(a: Alert): Promise<{ value: number; capped: boolean }> {
  if (a.criteria) {
    const n = await countAlertMatches(a.criteria);
    if (n == null) throw new Error("criteria too broad to count");
    return { value: n, capped: false };
  }
  const { count, capped } = await countDescriptionMatches(a.name);
  return { value: count, capped };
}

/**
 * Counts are expensive - a description alert runs a full hybrid search and spends the user's
 * search quota - so they are fetched only on request, never on render.
 */
export function requestCount(a: Alert): void {
  // A paused alert is not matching anything; counting it costs a query to say nothing.
  if (!a.on) return;
  const key = countKey(a);
  const current = read(key);
  if (current.status !== "idle" && current.status !== "error") return;

  states.set(key, LOADING);
  emit();

  const budget = setTimeout(() => {
    if (states.get(key) === LOADING) {
      states.set(key, SLOW);
      emit();
    }
  }, BUDGET_MS);

  fetchCount(a)
    .then(({ value, capped }) => ready(key, value, capped))
    .catch(() => {
      states.set(key, ERROR);
      emit();
    })
    .finally(() => clearTimeout(budget));
}

/**
 * The form's preview already paid for this count. Seeding it here means the alert saved from that
 * preview - and any other alert with the same filters - reads it instead of counting again.
 */
export function seedCriteriaCount(criteria: AlertCriteria, value: number): void {
  ready(keyFor(criteria, ""), value, false);
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};

/** The server snapshot must be `idle`: sessionStorage does not exist during SSR. */
export function useAlertCount(a: Alert): CountState {
  return useSyncExternalStore(
    subscribe,
    () => (a.on ? read(countKey(a)) : IDLE),
    () => IDLE,
  );
}
