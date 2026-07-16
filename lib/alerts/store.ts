"use client";

import { useCallback } from "react";
import { createStore } from "@/lib/localStore";
import type { AlertFilters } from "@/lib/types";

export type Alert = {
  id: string;
  name: string;
  freq: string;
  on: boolean;
  filters?: AlertFilters;
};

const store = createStore<Alert[]>("matricula-alerts", []);

const nameKey = (name: string) => name.trim().toLowerCase();

export function useAlerts() {
  const alerts = store.useValue();

  const add = useCallback((name: string, freq: string, filters?: AlertFilters): boolean => {
    const cur = store.read();
    if (cur.some((a) => nameKey(a.name) === nameKey(name))) return false;
    const id = `${Date.now().toString(36)}-${cur.length}`;
    store.write([{ id, name, freq, on: true, filters }, ...cur]);
    return true;
  }, []);

  const toggle = useCallback((id: string) => {
    store.write(store.read().map((a) => (a.id === id ? { ...a, on: !a.on } : a)));
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<Alert, "id">>): boolean => {
    const cur = store.read();
    if (
      patch.name != null &&
      cur.some((a) => a.id !== id && nameKey(a.name) === nameKey(patch.name!))
    ) {
      return false;
    }
    store.write(cur.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    store.write(store.read().filter((a) => a.id !== id));
  }, []);

  return { alerts, add, toggle, update, remove };
}
