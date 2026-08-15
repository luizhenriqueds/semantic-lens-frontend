"use client";

import { useEffect, useState } from "react";
import { usePlan } from "@/components/plan/PlanProvider";
import type { Feature } from "@/lib/entitlements";

/** `error` renders as nothing rather than as a wall: a dropped request must not read to an
 *  entitled visitor as a feature they do not have. */
export type GatedState<T> =
  { status: "loading" } | { status: "locked" } | { status: "ready"; data: T } | { status: "error" };

/** Fetches one per-plan section of the property page, which the cached HTML cannot carry. The
 *  route handler re-checks entitlement, so `can()` here only decides whether to spend the call. */
export function useGatedSection<T>(id: string, section: string, feature: Feature): GatedState<T> {
  const { can, loading } = usePlan();
  const allowed = !loading && can(feature);
  const [state, setState] = useState<GatedState<T>>({ status: "loading" });

  useEffect(() => {
    if (loading) {
      setState({ status: "loading" });
      return;
    }
    if (!allowed) {
      setState({ status: "locked" });
      return;
    }

    let alive = true;
    setState({ status: "loading" });

    fetch(`/api/property/${encodeURIComponent(id)}/sections?section=${section}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!alive) return;
        setState(json?.locked ? { status: "locked" } : { status: "ready", data: json as T });
      })
      .catch(() => {
        if (alive) setState({ status: "error" });
      });

    return () => {
      alive = false;
    };
  }, [allowed, loading, id, section]);

  return state;
}
