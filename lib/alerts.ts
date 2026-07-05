"use client";

import { useCallback, useEffect, useState } from "react";
import type { AlertFilters } from "@/lib/types";

export type Alert = {
  id: string;
  name: string;
  freq: string;
  on: boolean;
  filters?: AlertFilters;
};

const KEY = "matricula-alerts";
const EVENT = "matricula-alerts-change";

function read(): Alert[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Alert[]) : [];
  } catch (err) {
    console.warn("Failed to read alerts from localStorage", err);
    return [];
  }
}

function write(list: Alert[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
  } catch (err) {
    console.warn("Failed to write alerts to localStorage", err);
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    setAlerts(read());
    const sync = () => setAlerts(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((name: string, freq: string, filters?: AlertFilters): boolean => {
    const cur = read();
    const key = name.trim().toLowerCase();
    if (cur.some((a) => a.name.trim().toLowerCase() === key)) return false;
    const id = `${Date.now().toString(36)}-${cur.length}`;
    write([{ id, name, freq, on: true, filters }, ...cur]);
    return true;
  }, []);

  const toggle = useCallback((id: string) => {
    write(read().map((a) => (a.id === id ? { ...a, on: !a.on } : a)));
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<Alert, "id">>): boolean => {
    const cur = read();
    if (patch.name != null) {
      const key = patch.name.trim().toLowerCase();
      if (cur.some((a) => a.id !== id && a.name.trim().toLowerCase() === key)) return false;
    }
    write(cur.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((a) => a.id !== id));
  }, []);

  return { alerts, add, toggle, update, remove };
}
