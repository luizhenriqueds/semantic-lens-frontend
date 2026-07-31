"use server";

import { createClient } from "@/lib/supabase/server";

export type WaitlistResult = { ok: true; alreadyJoined: boolean } | { ok: false };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Open to visitors: the API waitlist is pitched on the landing page, before any account.
 *  Deduplication lives in the RPC (migration 0081), which upserts on a citext primary key. */
export async function joinApiWaitlist(
  email: string,
  source: string,
  uses: string[],
): Promise<WaitlistResult> {
  const trimmed = email.trim();
  if (!EMAIL.test(trimmed) || !source.trim() || !uses.length) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_api_waitlist", {
    p_email: trimmed,
    p_source: source,
    p_uses: uses,
  });
  if (error) {
    console.error(`[actions] api waitlist join failed: ${error.message}`);
    return { ok: false };
  }
  return { ok: true, alreadyJoined: data === true };
}
