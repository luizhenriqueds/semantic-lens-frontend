"use server";

import { requireUser } from "@/lib/supabase/server";

/** Eligibility and the 7-day window live in public.start_investor_trial() - `role` is not
 *  writable by `authenticated`, so the RPC is the only path up. */
export async function startInvestorTrial(): Promise<boolean> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("start_investor_trial");
  if (error) {
    console.error(`[actions] trial start failed: ${error.message}`);
    return false;
  }
  return data != null;
}
