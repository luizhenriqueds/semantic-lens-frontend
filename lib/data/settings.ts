import type { SupabaseClient, User } from "@supabase/supabase-js";
import { accountFrom } from "@/lib/account";
import { CHANNELS } from "@/lib/types";
import type { NotificationChannel, UserSettings, UserSettingsPatch } from "@/lib/types";

const toChannels = (raw: unknown): NotificationChannel[] =>
  Array.isArray(raw) ? CHANNELS.filter((c) => raw.includes(c)) : ["email"];

export async function getUserSettings(db: SupabaseClient, user: User): Promise<UserSettings> {
  const { name, email } = accountFrom(user);
  const fallback: UserSettings = { fullName: name, email, phone: "", channels: ["email"] };
  const { data, error } = await db
    .from("users")
    .select("full_name,email,phone,channels")
    .maybeSingle();
  if (error) console.error(`[data] settings load failed: ${error.message}`);
  if (error || !data) return fallback;
  return {
    fullName: ((data.full_name as string) ?? "").trim() || fallback.fullName,
    email: (data.email as string) ?? fallback.email,
    phone: (data.phone as string) ?? "",
    channels: toChannels(data.channels),
  };
}

export async function updateUserSettings(
  db: SupabaseClient,
  userId: string,
  patch: UserSettingsPatch,
): Promise<boolean> {
  const row: Record<string, unknown> = {};
  if (patch.fullName != null) row.full_name = patch.fullName.trim() || null;
  if (patch.phone != null) row.phone = patch.phone.trim() || null;
  if (patch.channels != null) row.channels = patch.channels;
  const { error } = await db.from("users").update(row).eq("user_id", userId);
  if (error) {
    console.error(`[data] settings update failed: ${error.message}`);
    return false;
  }
  return true;
}
