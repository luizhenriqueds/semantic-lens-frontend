"use client";

import { useSyncExternalStore } from "react";

const stores = new Set<() => void>();
const refreshers = new Set<() => void>();

// Account-scoped data must not leak between sessions in the same tab.
export function resetClientStores() {
  stores.forEach((r) => r());
}

/** Lets caches built outside `createClientStore` share the same sign-out reset. */
export function onResetClientStores(reset: () => void) {
  stores.add(reset);
}

// Stores hydrate once per page load, so a change made on another device needs a re-read.
export function refreshClientStores() {
  refreshers.forEach((r) => r());
}

// Supabase re-emits SIGNED_IN on load and on every tab return, so refresh triggers stack.
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

  // Server-rendered data for this navigation - the newer read, so it also replaces a hydration
  // that happened before the session had resolved.
  let seeded: T | null = null;
  const seed = (next: T) => {
    if (seeded === next) return;
    seeded = next;
    started = true;
    readAt = Date.now();
    set(next);
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
    seeded = null; // nor its server seed
    set(fallback);
  });
  // Unsubscribed stores just drop their hydration; the next mount reloads.
  refreshers.add(() => {
    if (listeners.size) read();
    else started = false;
  });

  // `seed` only runs in an effect, so `seeded` is false on the server and on the hydrating render.
  return { get: () => value, set, seed, seeded: () => seeded !== null, useValue };
}
