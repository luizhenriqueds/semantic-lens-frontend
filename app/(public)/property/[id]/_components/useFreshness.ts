"use client";

import { useEffect, useState } from "react";
import type { Freshness } from "@/lib/types";

const inFlight = new Map<string, Promise<Freshness | null>>();

function load(id: string): Promise<Freshness | null> {
  const open = inFlight.get(id);
  if (open) return open;
  const p = fetch(`/api/property/${encodeURIComponent(id)}/sections?section=freshness`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => (json ? (json as Freshness) : null))
    .catch(() => null);
  inFlight.set(id, p);
  return p;
}

/** The server values are a seed the browser corrects, shared across the call sites on one page. */
export function useFreshness(id: string, initial: Freshness): Freshness {
  const [fresh, setFresh] = useState<Freshness>(initial);

  useEffect(() => {
    let alive = true;
    load(id).then((next) => {
      if (alive && next) setFresh(next);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  return fresh;
}

/** Selectors, so a caller seeds and reads only the half of `Freshness` it is about. */
export const useLastSeen = (id: string, initial: string | null): string | null =>
  useFreshness(id, { lastSeen: initial, isActive: null }).lastSeen;

export function useInactive(id: string, initial: boolean): boolean {
  const { isActive } = useFreshness(id, { lastSeen: null, isActive: initial ? false : null });
  return isActive == null ? initial : !isActive;
}
