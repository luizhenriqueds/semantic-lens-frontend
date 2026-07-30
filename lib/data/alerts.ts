import type { SupabaseClient } from "@supabase/supabase-js";
import { toCadence, toFreq } from "@/lib/alerts/cadence";
import { fromLegacyCriteria, isLegacyCriteria, sanitizeCriteria } from "@/lib/alerts/criteria";
import type { Alert, AlertCriteria, AlertPatch, CuratedSlug, CuratedStates } from "@/lib/types";

type AlertRow = {
  id: string;
  label: string | null;
  cadence: string;
  is_active: boolean;
  criteria: unknown;
};

const SELECT = "id,label,cadence,is_active,criteria";

// Curated alerts share this table, so every saved-search query below filters on kind.
const KIND = "saved_search";
const CURATED = "curated";

const readCriteria = (raw: unknown): AlertCriteria | null =>
  isLegacyCriteria(raw) ? fromLegacyCriteria(raw) : sanitizeCriteria(raw);

const toAlert = (r: AlertRow): Alert => ({
  id: r.id,
  name: r.label ?? "",
  freq: toFreq(r.cadence),
  on: r.is_active,
  criteria: readCriteria(r.criteria) ?? undefined,
});

const nameKey = (name: string) => name.trim().toLowerCase();

async function nameTaken(db: SupabaseClient, name: string, exceptId?: string): Promise<boolean> {
  const { data, error } = await db.from("alerts").select("id,label").eq("kind", KIND);
  if (error) throw new Error(error.message);
  return (data ?? []).some(
    (a) => a.id !== exceptId && nameKey((a.label as string) ?? "") === nameKey(name),
  );
}

async function migrateLegacy(db: SupabaseClient, rows: AlertRow[]): Promise<void> {
  const stale = rows
    .filter((r) => isLegacyCriteria(r.criteria))
    .map((r) => ({ id: r.id, criteria: fromLegacyCriteria(r.criteria) }))
    .filter((r) => r.criteria != null);
  if (!stale.length) return;
  const results = await Promise.all(
    stale.map((r) =>
      db
        .from("alerts")
        .update({ criteria: r.criteria, updated_at: new Date().toISOString() })
        .eq("id", r.id),
    ),
  );
  for (const { error } of results) {
    if (error) console.error(`[data] alert criteria migration failed: ${error.message}`);
  }
}

export async function listAlerts(db: SupabaseClient): Promise<Alert[]> {
  const { data, error } = await db
    .from("alerts")
    .select(SELECT)
    .eq("kind", KIND)
    .order("created_at", { ascending: false });
  if (error) {
    console.error(`[data] alerts load failed: ${error.message}`);
    return [];
  }
  const rows = (data ?? []) as AlertRow[];
  await migrateLegacy(db, rows);
  return rows.map(toAlert);
}

export async function getAlert(db: SupabaseClient, id: string): Promise<Alert | null> {
  const { data, error } = await db
    .from("alerts")
    .select(SELECT)
    .eq("id", id)
    .eq("kind", KIND)
    .maybeSingle();
  if (error) {
    console.error(`[data] alert load failed: ${error.message}`);
    return null;
  }
  return data ? toAlert(data as AlertRow) : null;
}

export async function createAlert(
  db: SupabaseClient,
  userId: string,
  email: string,
  name: string,
  freq: string,
  criteria?: AlertCriteria | null,
): Promise<Alert | null> {
  if (await nameTaken(db, name)) return null;
  const { data, error } = await db
    .from("alerts")
    .insert({
      user_id: userId,
      email,
      kind: KIND,
      label: name,
      cadence: toCadence(freq),
      criteria: sanitizeCriteria(criteria) ?? {},
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
  if (patch.criteria !== undefined) row.criteria = sanitizeCriteria(patch.criteria) ?? {};
  if (patch.on != null) row.is_active = patch.on;
  const { error } = await db.from("alerts").update(row).eq("id", id).eq("kind", KIND);
  if (error) {
    console.error(`[data] alert update failed: ${error.message}`);
    return false;
  }
  return true;
}

export async function deleteAlert(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("alerts").delete().eq("id", id).eq("kind", KIND);
  if (error) throw new Error(error.message);
}

/** Missing slugs are subscribed: enrolment is opt-out, so only a choice writes a row. */
export async function getCuratedStates(db: SupabaseClient): Promise<CuratedStates> {
  const { data, error } = await db
    .from("alerts")
    .select("curated_type,is_active")
    .eq("kind", CURATED);
  if (error) {
    console.error(`[data] curated alerts load failed: ${error.message}`);
    return {};
  }
  const states: CuratedStates = {};
  for (const row of data ?? []) states[row.curated_type as CuratedSlug] = row.is_active as boolean;
  return states;
}

export async function setCuratedState(
  db: SupabaseClient,
  userId: string,
  email: string,
  slug: CuratedSlug,
  label: string,
  on: boolean,
): Promise<boolean> {
  // The weekly selection stage rewrites criteria and label; until then the row has no deliveries,
  // so it mails nothing.
  const { error } = await db.from("alerts").upsert(
    {
      user_id: userId,
      email,
      kind: CURATED,
      curated_type: slug,
      cadence: "weekly",
      label,
      is_active: on,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,curated_type" },
  );
  if (error) {
    console.error(`[data] curated alert update failed: ${error.message}`);
    return false;
  }
  return true;
}
