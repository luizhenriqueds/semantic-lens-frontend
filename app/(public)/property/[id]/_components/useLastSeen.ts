"use client";

import { useEffect, useState } from "react";

const inFlight = new Map<string, Promise<string | null>>();

function load(id: string): Promise<string | null> {
  const open = inFlight.get(id);
  if (open) return open;
  const p = fetch(`/api/property/${encodeURIComponent(id)}/sections?section=freshness`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => (json?.lastSeen as string | undefined) ?? null)
    .catch(() => null);
  inFlight.set(id, p);
  return p;
}

/** `last_seen` moves hourly but the page it renders on is cached for 6h, so the server value is a
 *  seed the browser corrects. Shared across the call sites on one page. */
export function useLastSeen(id: string, initial: string | null): string | null {
  const [lastSeen, setLastSeen] = useState(initial);

  useEffect(() => {
    let alive = true;
    load(id).then((fresh) => {
      if (alive && fresh) setLastSeen(fresh);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  return lastSeen;
}
