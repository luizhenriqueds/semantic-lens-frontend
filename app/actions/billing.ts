"use server";

import { randomUUID } from "node:crypto";
import {
  cancelProviderSubscription,
  createSubscriptionCheckout,
  isBillingConfigured,
  priceIdFor,
  verifyPlanPrice,
} from "@/lib/billing/stripe";
import { CHECKOUT_PARAM, PLAN_TAB, type CheckoutFlag } from "@/lib/billing/checkoutFlag";
import { getStripeCustomerId, getUserSubscription } from "@/lib/data/billing";
import { getEntitlements } from "@/lib/entitlements/server";
import { isPaidRole, priceInCents, PLANS } from "@/lib/entitlements";
import type { Role } from "@/lib/entitlements";
import { withinQuota } from "@/lib/ratelimit/guards";
import { requireUser } from "@/lib/supabase/server";

export type CheckoutFailure = "auth" | "plan" | "active" | "config" | "rate" | "error";

export type CheckoutResult = { ok: true; url: string } | { ok: false; reason: CheckoutFailure };

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** The browser leaves for Stripe Checkout, so both ends of the round trip land on the plan tab and
 *  CheckoutReturnDialog picks the flag up from there. */
const returnTo = (flag: CheckoutFlag) =>
  `${site()}/settings?tab=${PLAN_TAB}&${CHECKOUT_PARAM}=${flag}`;

const session = () => requireUser().catch(() => null);

/** The real gate: PaywallDialog runs in the browser and this action is reachable directly. */
export async function startCheckout(target: Role): Promise<CheckoutResult> {
  const auth = await session();
  if (!auth) return { ok: false, reason: "auth" };
  const { supabase, user } = auth;

  // `target` is caller-supplied: this is what stops startCheckout("platform").
  if (!isPaidRole(target)) return { ok: false, reason: "plan" };

  const priceId = priceIdFor(target);
  if (!priceId || !isBillingConfigured()) return { ok: false, reason: "config" };

  const ent = await getEntitlements();
  // An admin already bypasses every gate, so a purchase would take money for nothing.
  if (ent.isAdmin) return { ok: false, reason: "plan" };
  // The trial clause is load-bearing: a trialling user already holds the target role, so a bare
  // rank check would block the single most likely conversion in the funnel.
  if (!ent.trial.endsAt && ent.plan.rank >= PLANS[target].rank)
    return { ok: false, reason: "plan" };

  // After the plan check, so a rejected caller never burns a paying account's budget.
  if (!(await withinQuota("checkout"))) return { ok: false, reason: "rate" };

  // The price check runs before the checkout row exists, so a drift leaves nothing to unwind. The
  // customer read is independent of it, so the two round trips overlap. Reusing the customer keeps
  // a resubscribe on one Stripe customer: the webhook fills users.stripe_customer_id only when
  // null, so a second customer would orphan the first.
  const [drift, customerId] = await Promise.all([
    verifyPlanPrice(target, priceId),
    getStripeCustomerId(supabase),
  ]);
  if (drift) {
    console.error(`[billing] price check failed on ${target}: ${drift}`);
    return { ok: false, reason: "config" };
  }

  const externalId = randomUUID();
  const { error: startError } = await supabase.rpc("start_subscription_checkout", {
    p_role: target,
    p_external_id: externalId,
  });
  if (startError) {
    const active = startError.message.includes("billing:active");
    if (!active) console.error(`[billing] checkout start failed: ${startError.message}`);
    return { ok: false, reason: active ? "active" : "error" };
  }

  try {
    const checkout = await createSubscriptionCheckout({
      priceId,
      externalId,
      userId: user.id,
      role: target,
      email: user.email,
      customerId,
      successUrl: returnTo("success"),
      cancelUrl: returnTo("cancel"),
    });

    await supabase.rpc("attach_subscription_checkout", {
      p_external_id: externalId,
      p_bill_id: checkout.id,
      p_amount_cents: priceInCents(target),
      p_checkout_url: checkout.url,
      p_dev_mode: !checkout.livemode,
    });

    return { ok: true, url: checkout.url };
  } catch (err) {
    console.error(`[billing] checkout create failed: ${(err as Error).message}`);
    await supabase.rpc("fail_subscription_checkout", { p_external_id: externalId });
    return { ok: false, reason: "error" };
  }
}

export type CancelResult =
  | { ok: true; endsAt: string | null }
  | { ok: false; reason: "auth" | "none" | "pending" | "error" };

export async function cancelSubscription(): Promise<CancelResult> {
  const auth = await session();
  if (!auth) return { ok: false, reason: "auth" };

  const subscription = await getUserSubscription(auth.supabase);
  if (!subscription || subscription.status !== "active") return { ok: false, reason: "none" };
  // Stripe sends the sub_... on the first webhook, so this only covers a hand-edited row.
  if (!subscription.providerSubscriptionId) return { ok: false, reason: "pending" };

  try {
    await cancelProviderSubscription(subscription.providerSubscriptionId);
  } catch (err) {
    console.error(`[billing] provider cancel failed: ${(err as Error).message}`);
    return { ok: false, reason: "error" };
  }

  const { data, error } = await auth.supabase.rpc("request_subscription_cancel", {
    p_id: subscription.id,
  });
  if (error) {
    // The charge is already stopped; the customer.subscription.updated webhook reconciles our row.
    console.error(`[billing] cancel bookkeeping failed: ${error.message}`);
    return { ok: true, endsAt: subscription.currentPeriodEnd };
  }
  return { ok: true, endsAt: (data as string) ?? subscription.currentPeriodEnd };
}

export type CheckoutState = { state: "pending" | "active" | "failed" | "none"; role: Role | null };

/** Polled while the user is back from Stripe Checkout but the webhook may not have landed. Reads
 *  the row directly rather than getEntitlements(), whose React cache() would serve a stale answer
 *  for the whole request. */
export async function checkoutStatus(): Promise<CheckoutState> {
  const auth = await session();
  if (!auth) return { state: "none", role: null };

  const subscription = await getUserSubscription(auth.supabase);
  if (!subscription) return { state: "none", role: null };

  const state =
    subscription.status === "active" || subscription.status === "cancelled"
      ? "active"
      : subscription.status === "pending"
        ? "pending"
        : "failed";

  return { state, role: subscription.role };
}
