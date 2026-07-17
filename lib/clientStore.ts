"use client";

import { useEffect, useState } from "react";

// In-memory store shared across hook instances, hydrated once from the server.
export function createClientStore<T>(fallback: T, load: () => Promise<T>) {
  let value = fallback;
  let started = false;
  const listeners = new Set<(v: T) => void>();

  const set = (next: T) => {
    value = next;
    listeners.forEach((l) => l(value));
  };

  const start = () => {
    if (started) return;
    started = true;
    load()
      .then(set)
      .catch((err) => {
        started = false;
        console.warn("Failed to load store", err);
      });
  };

  const useValue = (): T => {
    const [v, setV] = useState<T>(value);
    useEffect(() => {
      listeners.add(setV);
      setV(value);
      start();
      return () => {
        listeners.delete(setV);
      };
    }, []);
    return v;
  };

  return { get: () => value, set, useValue };
}
