"use server";

import { revalidatePath } from "next/cache";
import * as data from "@/lib/data/alerts";
import { countMatched, hybridSearch, RESULT_LIMIT } from "@/lib/data";
import { isAnyCriteria } from "@/lib/alerts/criteria";
import { resolveQueryCriteria } from "@/lib/alerts/resolve";
import { getEntitlements } from "@/lib/entitlements/server";
import { gateCriteria } from "@/lib/filters/gate";
import { getUser, requireUser } from "@/lib/supabase/server";
import type {
  Alert,
  AlertCreateResult,
  AlertCriteria,
  AlertPatch,
  ResolvedAlertQuery,
} from "@/lib/types";

export async function countAlertMatches(criteria: AlertCriteria): Promise<number | null> {
  await requireUser();
  return isAnyCriteria(criteria) ? null : countMatched(criteria);
}

export async function resolveAlertQuery(query: string): Promise<ResolvedAlertQuery> {
  await requireUser();
  return resolveQueryCriteria(query);
}

export async function countDescriptionMatches(
  query: string,
): Promise<{ count: number; capped: boolean }> {
  await requireUser();
  const q = query.trim();
  if (!q) return { count: 0, capped: false };
  const { hits } = await hybridSearch(q);
  return { count: hits.length, capped: hits.length >= RESULT_LIMIT };
}

// AlertsBell renders on every page, anon ones included.
export async function listAlerts(): Promise<Alert[]> {
  const { supabase, user } = await getUser();
  return user ? data.listAlerts(supabase) : [];
}

/** The alert pages are server-rendered and `staleTimes.dynamic` keeps their payload warm for two
 *  minutes, so a write has to drop them from the router cache - otherwise the next navigation
 *  lands on the counts and rules from before the edit. */
function revalidateAlerts(id?: string) {
  revalidatePath("/alerts");
  if (id) revalidatePath(`/alerts/${id}`);
}

export async function createAlert(
  name: string,
  freq: string,
  criteria?: AlertCriteria | null,
): Promise<AlertCreateResult> {
  const { supabase, user } = await requireUser();
  const ent = await getEntitlements();
  if (!ent.can("savedSearches")) return { ok: false, reason: "limit" };
  const res = await data.createAlert(
    supabase,
    user.id,
    user.email ?? "",
    name,
    freq,
    criteria ? gateCriteria(criteria, ent) : criteria,
    ent.limit("savedSearches"),
  );
  if (res.ok) revalidateAlerts(res.alert.id);
  return res;
}

export async function updateAlert(id: string, patch: AlertPatch): Promise<boolean> {
  const { supabase } = await requireUser();
  // The pause toggle is the hot caller and carries no criteria, so it skips the plan read.
  const ok = patch.criteria
    ? await data.updateAlert(supabase, id, {
        ...patch,
        criteria: gateCriteria(patch.criteria, await getEntitlements()),
      })
    : await data.updateAlert(supabase, id, patch);
  if (ok) revalidateAlerts(id);
  return ok;
}

export async function deleteAlert(id: string): Promise<void> {
  const { supabase } = await requireUser();
  await data.deleteAlert(supabase, id);
  revalidateAlerts(id);
}
