"use server";

import * as data from "@/lib/data/favorites";
import { requireUser } from "@/lib/supabase/server";

export async function getFavoriteIds(): Promise<string[]> {
  const { supabase } = await requireUser();
  return data.getFavoriteIds(supabase);
}

export async function setFavorite(propertyId: string, saved: boolean): Promise<void> {
  const { supabase, user } = await requireUser();
  return data.setFavorite(supabase, user.id, propertyId, saved);
}
