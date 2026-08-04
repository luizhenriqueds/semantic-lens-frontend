import type { SupabaseClient } from "@supabase/supabase-js";
import { isPaidRole, type PaidRole } from "@/lib/billing/abacate";

export type SubscriptionStatus =
  "pending" | "active" | "cancelled" | "expired" | "refunded" | "failed";

export type Subscription = {
  id: string;
  role: PaidRole;
  status: SubscriptionStatus;
  amountCents: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Null until a webhook tells us the subs_... id, which is what cancellation needs. */
  providerSubscriptionId: string | null;
};

const COLUMNS =
  "id,role,status,amount_cents,current_period_end,cancel_at_period_end,provider_subscription_id";

/** The account's latest subscription, whatever its state - the checkout return dialog needs to see
 *  a pending row, and the settings panel a cancelled one. RLS scopes it, so no .eq() is needed. */
export async function getUserSubscription(db: SupabaseClient): Promise<Subscription | null> {
  const { data, error } = await db
    .from("subscriptions")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) console.error(`[data] subscription load failed: ${error.message}`);
  if (!data || !isPaidRole(data.role)) return null;

  return {
    id: data.id as string,
    role: data.role,
    status: data.status as SubscriptionStatus,
    amountCents: (data.amount_cents as number) ?? null,
    currentPeriodEnd: (data.current_period_end as string) ?? null,
    cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
    providerSubscriptionId: (data.provider_subscription_id as string) ?? null,
  };
}
