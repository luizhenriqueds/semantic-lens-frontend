import type { SupabaseClient } from "@supabase/supabase-js";

// All properties are Caixa for now; favorites keys on (user_id, source, property_id).
const SOURCE = "caixa";

export async function getFavoriteIds(db: SupabaseClient): Promise<string[]> {
  const { data, error } = await db
    .from("favorites")
    .select("property_id")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(`[data] favorites load failed: ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => r.property_id as string);
}

export async function setFavorite(
  db: SupabaseClient,
  userId: string,
  propertyId: string,
  saved: boolean,
): Promise<boolean> {
  if (saved) {
    const { error } = await db
      .from("favorites")
      .upsert(
        { user_id: userId, source: SOURCE, property_id: propertyId },
        { onConflict: "user_id,source,property_id", ignoreDuplicates: true },
      );
    // The 0078 trigger owns the cap, so a plan_limit hint is the "over quota" answer.
    if (error) {
      if (error.hint?.includes("plan_limit")) return false;
      throw new Error(error.message);
    }
    return true;
  }
  const { error } = await db
    .from("favorites")
    .delete()
    .eq("source", SOURCE)
    .eq("property_id", propertyId);
  if (error) throw new Error(error.message);
  return true;
}
