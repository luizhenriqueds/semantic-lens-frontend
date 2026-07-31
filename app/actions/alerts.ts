"use server";

import * as data from "@/lib/data/alerts";
import { countMatched, hybridSearch, RESULT_LIMIT } from "@/lib/data";
import { isAnyCriteria } from "@/lib/alerts/criteria";
import { resolveQueryCriteria } from "@/lib/alerts/resolve";
import { getEntitlements } from "@/lib/entitlements/server";
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

export async function createAlert(
  name: string,
  freq: string,
  criteria?: AlertCriteria | null,
): Promise<AlertCreateResult> {
  const { supabase, user } = await requireUser();
  const ent = await getEntitlements();
  if (!ent.can("savedSearches")) return { ok: false, reason: "limit" };
  return data.createAlert(
    supabase,
    user.id,
    user.email ?? "",
    name,
    freq,
    criteria,
    ent.limit("savedSearches"),
  );
}

export async function updateAlert(id: string, patch: AlertPatch): Promise<boolean> {
  const { supabase } = await requireUser();
  return data.updateAlert(supabase, id, patch);
}

export async function deleteAlert(id: string): Promise<void> {
  const { supabase } = await requireUser();
  return data.deleteAlert(supabase, id);
}
