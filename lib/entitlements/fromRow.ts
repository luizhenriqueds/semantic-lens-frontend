import { entitlementsFor, toRole } from "./plans";
import type { Entitlements } from "./plans";

/** Shared so the server read and the browser read cannot drift and disagree about one account. */
export const USER_COLS = "role,is_admin,role_expires_at,trial_started_at,role_source";

export type UserRow = {
  role?: unknown;
  is_admin?: unknown;
  role_expires_at?: string | null;
  trial_started_at?: string | null;
  role_source?: unknown;
};

/** Row -> entitlements for a signed-in account; `null` when the users row has not landed yet.
 *  The anon case short-circuits at the call site and never reaches here. */
export function entitlementsFromRow(data: UserRow | null): Entitlements {
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
}
