"use client";

import { useCallback } from "react";
import * as api from "@/app/actions/alerts";
import { createClientStore } from "@/lib/clientStore";
import type { Alert, AlertCriteria, AlertPatch } from "@/lib/types";

export type { Alert } from "@/lib/types";

const store = createClientStore<Alert[]>([], () => api.listAlerts());

export function useAlerts() {
  const alerts = store.useValue();

  const add = useCallback(
    async (name: string, freq: string, criteria?: AlertCriteria): Promise<boolean> => {
      const created = await api.createAlert(name, freq, criteria ?? null);
      if (!created) return false;
      store.set([created, ...store.get()]);
      return true;
    },
    [],
  );

  const toggle = useCallback((id: string) => {
    const cur = store.get();
    const alert = cur.find((a) => a.id === id);
    if (!alert) return;
    const on = !alert.on;
    store.set(cur.map((a) => (a.id === id ? { ...a, on } : a)));
    api.updateAlert(id, { on }).catch((err) => {
      console.warn("Failed to persist alert", err);
      store.set(store.get().map((a) => (a.id === id ? { ...a, on: !on } : a)));
    });
  }, []);

  const update = useCallback(async (id: string, patch: AlertPatch): Promise<boolean> => {
    const ok = await api.updateAlert(id, patch);
    if (!ok) return false;
    store.set(
      store.get().map((a) =>
        a.id === id
          ? {
              ...a,
              ...(patch.name != null && { name: patch.name }),
              ...(patch.freq != null && { freq: patch.freq }),
              ...(patch.criteria !== undefined && { criteria: patch.criteria ?? undefined }),
              ...(patch.on != null && { on: patch.on }),
            }
          : a,
      ),
    );
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    const cur = store.get();
    store.set(cur.filter((a) => a.id !== id));
    api.deleteAlert(id).catch((err) => {
      console.warn("Failed to delete alert", err);
      store.set(cur);
    });
  }, []);

  return { alerts, add, toggle, update, remove };
}
