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
): Promise<void> {
  if (saved) {
    const { error } = await db
      .from("favorites")
      .upsert(
        { user_id: userId, source: SOURCE, property_id: propertyId },
        { onConflict: "user_id,source,property_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await db
    .from("favorites")
    .delete()
    .eq("source", SOURCE)
    .eq("property_id", propertyId);
  if (error) throw new Error(error.message);
}
