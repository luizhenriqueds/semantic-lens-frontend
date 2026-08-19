import type Stripe from "stripe";

/** No `renew` (which apply_subscription_event still accepts): it adds a month relative to the row,
 *  so redeliveries compound. Every payment is an `activate` carrying Stripe's own period end. */
export type Effect = "activate" | "cancel" | "revoke" | "ignore";

export function effectOf(event: Stripe.Event): Effect {
  switch (event.type) {
    case "checkout.session.completed":
      return event.data.object.mode === "subscription" ? "activate" : "ignore";
    case "invoice.paid":
      return subscriptionIdOfInvoice(event.data.object) ? "activate" : "ignore";
    case "customer.subscription.updated":
      // State, not previous_attributes: an out-of-order redelivery reads the same answer.
      return event.data.object.cancel_at_period_end ? "cancel" : "ignore";
    case "customer.subscription.deleted":
      // Not `revoke`: both routes here - a scheduled cancel reaching term, or dunning giving up -
      // have already let role_expires_at elapse, so the clock has demoted the user already.
      return "cancel";
    case "charge.refunded":
      // Fires for partial refunds too, where the flag stays false.
      return event.data.object.refunded ? "revoke" : "ignore";
    case "charge.dispute.created":
      return "revoke";
    default:
      return "ignore";
  }
}

type Ref = string | { id: string } | null | undefined;

/** Stripe returns either a bare id or the expanded object, depending on the event. */
export const idOf = (value: Ref): string | null =>
  typeof value === "string" ? value : (value?.id ?? null);

/** Unix seconds, on the item since Basil moved periods off the subscription. */
export function periodEndOf(subscription: Stripe.Subscription): string | null {
  const seconds = subscription.items.data[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

export const externalIdOf = (subscription: Stripe.Subscription): string | null =>
  subscription.metadata?.external_id || null;

/** Invoices lost their top-level `subscription` in Basil; it now hangs off the parent union. */
export function subscriptionIdOfInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  return parent?.type === "subscription_details"
    ? idOf(parent.subscription_details?.subscription)
    : null;
}

export const customerIdOf = (object: { customer?: Ref }): string | null => idOf(object.customer);
