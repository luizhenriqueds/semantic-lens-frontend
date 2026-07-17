import type { SupabaseClient } from "@supabase/supabase-js";
import { toCadence, toFreq } from "@/lib/alerts/cadence";
import type { Alert, AlertFilters, AlertPatch } from "@/lib/types";

type AlertRow = {
  id: string;
  label: string | null;
  cadence: string;
  is_active: boolean;
  criteria: AlertFilters | null;
};

const SELECT = "id,label,cadence,is_active,criteria";

const hasCriteria = (c: AlertFilters | null): c is AlertFilters =>
  c != null && Object.keys(c).length > 0;

const toAlert = (r: AlertRow): Alert => ({
  id: r.id,
  name: r.label ?? "",
  freq: toFreq(r.cadence),
  on: r.is_active,
  filters: hasCriteria(r.criteria) ? r.criteria : undefined,
});

const nameKey = (name: string) => name.trim().toLowerCase();

async function nameTaken(db: SupabaseClient, name: string, exceptId?: string): Promise<boolean> {
  const { data, error } = await db.from("alerts").select("id,label");
  if (error) throw new Error(error.message);
  return (data ?? []).some(
    (a) => a.id !== exceptId && nameKey((a.label as string) ?? "") === nameKey(name),
  );
}

export async function listAlerts(db: SupabaseClient): Promise<Alert[]> {
  const { data, error } = await db
    .from("alerts")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(`[data] alerts load failed: ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => toAlert(r as AlertRow));
}

export async function createAlert(
  db: SupabaseClient,
  userId: string,
  email: string,
  name: string,
  freq: string,
  filters?: AlertFilters | null,
): Promise<Alert | null> {
  if (await nameTaken(db, name)) return null;
  const { data, error } = await db
    .from("alerts")
    .insert({
      user_id: userId,
      email,
      label: name,
      cadence: toCadence(freq),
      criteria: filters ?? {},
    })
    .select(SELECT)
    .single();
  if (error) {
    console.error(`[data] alert create failed: ${error.message}`);
    return null;
  }
  return toAlert(data as AlertRow);
}

export async function updateAlert(
  db: SupabaseClient,
  id: string,
  patch: AlertPatch,
): Promise<boolean> {
  if (patch.name != null && (await nameTaken(db, patch.name, id))) return false;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name != null) row.label = patch.name;
  if (patch.freq != null) row.cadence = toCadence(patch.freq);
  if (patch.filters !== undefined) row.criteria = patch.filters ?? {};
  if (patch.on != null) row.is_active = patch.on;
  const { error } = await db.from("alerts").update(row).eq("id", id);
  if (error) {
    console.error(`[data] alert update failed: ${error.message}`);
    return false;
  }
  return true;
}

export async function deleteAlert(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("alerts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
