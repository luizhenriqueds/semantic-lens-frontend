"use server";

import * as data from "@/lib/data/favorites";
import { getUser, requireUser } from "@/lib/supabase/server";

// FavoriteButton renders on anon pages, so this must not throw without a session.
export async function getFavoriteIds(): Promise<string[]> {
  const { supabase, user } = await getUser();
  return user ? data.getFavoriteIds(supabase) : [];
}

/** False means the plan's cap was hit; the 0078 trigger is what enforces it. */
export async function setFavorite(propertyId: string, saved: boolean): Promise<boolean> {
  const { supabase, user } = await requireUser();
  return data.setFavorite(supabase, user.id, propertyId, saved);
}
