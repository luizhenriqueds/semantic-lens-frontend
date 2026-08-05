import { cache } from "react";
import { getUser } from "@/lib/supabase/server";
import { entitlementsFor, toRole } from "./plans";
import type { Entitlements } from "./plans";

// React cache, never the cross-request `cached()` in lib/data/client.ts - that would serve one
// account's plan to another. RLS scopes the row, so no .eq() is needed.
export const getEntitlements = cache(async (): Promise<Entitlements> => {
  const { supabase, user } = await getUser();
  if (!user) return entitlementsFor("anon", false);

  const { data, error } = await supabase
    .from("users")
    .select("role,is_admin,role_expires_at,trial_started_at,role_source")
    .maybeSingle();
  if (error) console.error(`[entitlements] role load failed: ${error.message}`);

  // Mirrors public.user_role_of() (migration 0079): an expired paid role reads as basic.
  const expiresAt = (data?.role_expires_at as string) ?? null;
  const expired = !!expiresAt && new Date(expiresAt).getTime() < Date.now();
  const storedRole = toRole(data?.role);
  const role = expired ? "basic" : storedRole;

  const started = data?.trial_started_at != null;
  // role_expires_at carries both a trial end and a paid period end, so role_source is what keeps
  // the UI from telling a paying customer their "teste grátis" is running.
  const paid = data?.role_source === "subscription";
  return entitlementsFor(role, Boolean(data?.is_admin), {
    // start_investor_trial() tests the stored role; offering it on the downgraded one always fails.
    eligible: !!data && !started && storedRole === "basic",
    endsAt: expired || paid ? null : expiresAt,
    expired: started && role === "basic",
  });
});
