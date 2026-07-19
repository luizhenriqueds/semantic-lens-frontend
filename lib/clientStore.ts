"use client";

import { useEffect, useState } from "react";

const stores = new Set<() => void>();

// Account-scoped data must not leak between sessions in the same tab.
export function resetClientStores() {
  stores.forEach((r) => r());
}

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

  stores.add(() => {
    started = false;
    set(fallback);
  });

  return { get: () => value, set, useValue };
}
