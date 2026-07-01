"use client";

import { useCallback, useEffect, useState } from "react";
import type { AlertFilters } from "@/lib/types";

export type Alert = {
  id: string;
  nome: string;
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

  const add = useCallback((nome: string, freq: string, filters?: AlertFilters) => {
    const cur = read();
    const id = `${Date.now().toString(36)}-${cur.length}`;
    write([{ id, nome, freq, on: true, filters }, ...cur]);
  }, []);

  const toggle = useCallback((id: string) => {
    write(read().map((a) => (a.id === id ? { ...a, on: !a.on } : a)));
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((a) => a.id !== id));
  }, []);

  return { alerts, add, toggle, remove };
}
