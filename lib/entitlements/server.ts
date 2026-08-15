import { cache } from "react";
import { getUser } from "@/lib/supabase/server";
import { entitlementsFromRow, USER_COLS } from "./fromRow";
import { entitlementsFor } from "./plans";
import type { Entitlements } from "./plans";

// React cache, never the cross-request `cached()` in lib/data/client.ts - that would serve one
// account's plan to another. RLS scopes the row, so no .eq() is needed.
export const getEntitlements = cache(async (): Promise<Entitlements> => {
  const { supabase, user } = await getUser();
  if (!user) return entitlementsFor("anon", false);

  const { data, error } = await supabase.from("users").select(USER_COLS).maybeSingle();
  if (error) console.error(`[entitlements] role load failed: ${error.message}`);

  return entitlementsFromRow(data);
});
