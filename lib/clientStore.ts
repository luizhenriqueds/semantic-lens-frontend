"use client";

import { useSyncExternalStore } from "react";

const stores = new Set<() => void>();

// Account-scoped data must not leak between sessions in the same tab.
export function resetClientStores() {
  stores.forEach((r) => r());
}

// In-memory store shared across hook instances, hydrated once from the server.
export function createClientStore<T>(fallback: T, load: () => Promise<T>) {
  let value = fallback;
  let started = false;
  const listeners = new Set<() => void>();

  const set = (next: T) => {
    value = next;
    listeners.forEach((l) => l());
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

  // The server snapshot must be the fallback: on a repeat visit the module still holds the
  // previous value, which would not match the server's HTML during hydration.
  const useValue = (): T =>
    useSyncExternalStore(
      (onChange) => {
        listeners.add(onChange);
        start();
        return () => {
          listeners.delete(onChange);
        };
      },
      () => value,
      () => fallback,
    );

  stores.add(() => {
    started = false;
    set(fallback);
  });

  return { get: () => value, set, useValue };
}
