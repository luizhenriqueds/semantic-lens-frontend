"use server";

import * as data from "@/lib/data/alerts";
import { requireUser } from "@/lib/supabase/server";
import type { Alert, AlertFilters, AlertPatch } from "@/lib/types";

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
