"use server";

import * as data from "@/lib/data/alerts";
import { countProperties, hybridSearch, RESULT_LIMIT } from "@/lib/data";
import { alertToPropertyFilters } from "@/lib/alerts/filters";
import { requireUser } from "@/lib/supabase/server";
import type { Alert, AlertFilters, AlertPatch } from "@/lib/types";

export async function countAlertMatches(filters: AlertFilters): Promise<number> {
  await requireUser();
  const q = filters.q?.trim();
  const rest = alertToPropertyFilters({ ...filters, q: undefined });
  if (!q) return countProperties(rest);

  // property_list_page matches q as a substring of search_text ("apartamento vila moreira sao
  // paulo sp"), so a natural-language alert counts 0. Run the real pipeline, then intersect.
  const { hits } = await hybridSearch(q);
  if (!hits.length) return 0;
  return Object.keys(rest).length
    ? countProperties({ ...rest, ids: hits.map((h) => h.id) })
    : hits.length;
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

export async function listAlerts(): Promise<Alert[]> {
  const { supabase } = await requireUser();
  return data.listAlerts(supabase);
}

export async function createAlert(
  name: string,
  freq: string,
  filters?: AlertFilters | null,
): Promise<Alert | null> {
  const { supabase, user } = await requireUser();
  return data.createAlert(supabase, user.id, user.email ?? "", name, freq, filters);
}

export async function updateAlert(id: string, patch: AlertPatch): Promise<boolean> {
  const { supabase } = await requireUser();
  return data.updateAlert(supabase, id, patch);
}

export async function deleteAlert(id: string): Promise<void> {
  const { supabase } = await requireUser();
  return data.deleteAlert(supabase, id);
}
