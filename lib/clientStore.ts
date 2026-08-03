"use client";

import { useSyncExternalStore } from "react";

const stores = new Set<() => void>();
const refreshers = new Set<() => void>();

// Account-scoped data must not leak between sessions in the same tab.
export function resetClientStores() {
  stores.forEach((r) => r());
}

// The stores hydrate once per page load, so a change made on another device would stay
// invisible until a reload. Re-reading them whenever the tab comes back closes that gap.
export function refreshClientStores() {
  refreshers.forEach((r) => r());
}

// Supabase re-emits SIGNED_IN on load and on every tab return, on top of the visibility
// listeners, so the refresh triggers stack. A value this young is not worth re-reading.
const FRESH_MS = 30_000;

// In-memory store shared across hook instances, hydrated once from the server.
export function createClientStore<T>(fallback: T, load: () => Promise<T>) {
  let value = fallback;
  let started = false;
  const listeners = new Set<() => void>();

  const set = (next: T) => {
    value = next;
    listeners.forEach((l) => l());
  };

  let loading = false;
  let readAt = 0;
  const read = () => {
    if (loading || Date.now() - readAt < FRESH_MS) return;
    loading = true;
    load()
      .then((next) => {
        readAt = Date.now();
        set(next);
      })
      .catch((err) => {
        started = false;
        console.warn("Failed to load store", err);
      })
      .finally(() => {
        loading = false;
      });
  };

  const start = () => {
    if (started) return;
    started = true;
    read();
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
    readAt = 0; // the next account must not inherit this one's freshness
    set(fallback);
  });
  // A store nobody is subscribed to just drops its hydration, so the next mount reloads it.
  refreshers.add(() => {
    if (listeners.size) read();
    else started = false;
  });

  return { get: () => value, set, useValue };
}
