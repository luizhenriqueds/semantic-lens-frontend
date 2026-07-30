"use server";

import * as alerts from "@/lib/data/alerts";
import * as data from "@/lib/data/settings";
import { requireUser } from "@/lib/supabase/server";
import type { CuratedSlug, UserSettingsPatch } from "@/lib/types";

export async function updateUserSettings(patch: UserSettingsPatch): Promise<boolean> {
  const { supabase, user } = await requireUser();
  // The topbar reads the name from user_metadata (lib/account.ts), not from public.users.
  const [ok, auth] = await Promise.all([
    data.updateUserSettings(supabase, user.id, patch),
    patch.fullName != null
      ? supabase.auth.updateUser({ data: { full_name: patch.fullName.trim() } })
      : Promise.resolve({ error: null }),
  ]);
  if (auth.error) console.error(`[actions] auth metadata update failed: ${auth.error.message}`);
  return ok && !auth.error;
}

export async function setCuratedState(
  slug: CuratedSlug,
  label: string,
  on: boolean,
): Promise<boolean> {
  const { supabase, user } = await requireUser();
  return alerts.setCuratedState(supabase, user.id, user.email ?? "", slug, label, on);
}
