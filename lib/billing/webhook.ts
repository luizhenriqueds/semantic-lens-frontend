import type Stripe from "stripe";
import {
  customerIdOf,
  effectOf,
  externalIdOf,
  idOf,
  periodEndOf,
  subscriptionIdOfInvoice,
  type Effect,
} from "@/lib/billing/events";

/** Arguments of public.apply_subscription_event. `p_bill_id` holds a Checkout Session id (cs_...):
 *  the column predates Stripe, but nothing reads its prefix. */
type SubscriptionEventArgs = {
  p_effect: Exclude<Effect, "ignore">;
  p_event: string;
  p_event_key: string;
  p_external_id: string | null;
  p_bill_id: string | null;
  p_subs_id: string | null;
  p_customer_id: string | null;
  p_period_end: string | null;
  p_amount_cents: number | null;
  p_occurred_at: string;
  p_dev_mode: boolean;
  p_raw: unknown;
};

/** Injected so the mapping is testable without a network. */
export type EventLookups = {
  getSubscription: (id: string) => Promise<Stripe.Subscription>;
  getCharge: (id: string) => Promise<Stripe.Charge>;
};

/** What an event tells us about the account it belongs to. A refund identifies only a customer;
 *  a checkout fills every field. */
type Correlation = Pick<
  SubscriptionEventArgs,
  "p_external_id" | "p_bill_id" | "p_subs_id" | "p_customer_id" | "p_period_end" | "p_amount_cents"
>;

const UNCORRELATED: Correlation = {
  p_external_id: null,
  p_bill_id: null,
  p_subs_id: null,
  p_customer_id: null,
  p_period_end: null,
  p_amount_cents: null,
};

/** RPC arguments for an event, or null when there is nothing to apply. Throws only when a Stripe
 *  read fails. */
export async function toEventArgs(
  event: Stripe.Event,
  lookups: EventLookups,
): Promise<SubscriptionEventArgs | null> {
  const effect = effectOf(event);
  if (effect === "ignore") return null;

  const correlation = await correlate(event, lookups);
  if (!correlation) return null;

  return {
    ...UNCORRELATED,
    ...correlation,
    p_effect: effect,
    p_event: event.type,
    // Reused verbatim on redelivery, so billing_events dedupes for free.
    p_event_key: event.id,
    p_occurred_at: new Date(event.created * 1000).toISOString(),
    // Inverted: livemode true is production, where dev_mode must be false.
    p_dev_mode: !event.livemode,
    p_raw: event,
  };
}

async function correlate(
  event: Stripe.Event,
  lookups: EventLookups,
): Promise<Partial<Correlation> | null> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = idOf(session.subscription);
      if (!subscriptionId) return null;
      const subscription = await lookups.getSubscription(subscriptionId);
      return {
        p_external_id: session.client_reference_id ?? externalIdOf(subscription),
        p_bill_id: session.id,
        p_subs_id: subscriptionId,
        p_customer_id: customerIdOf(session),
        p_period_end: periodEndOf(subscription),
        p_amount_cents: session.amount_total,
      };
    }

    case "invoice.paid": {
      const invoice = event.data.object;
      const subscriptionId = subscriptionIdOfInvoice(invoice);
      if (!subscriptionId) return null;
      // external_id comes off the subscription, never the invoice: the invoice's own metadata is
      // a snapshot taken at finalisation, routinely empty on a first purchase.
      const subscription = await lookups.getSubscription(subscriptionId);
      return {
        p_external_id: externalIdOf(subscription),
        p_subs_id: subscriptionId,
        p_customer_id: customerIdOf(invoice),
        p_period_end: periodEndOf(subscription),
        p_amount_cents: invoice.amount_paid,
      };
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      return {
        p_external_id: externalIdOf(subscription),
        p_subs_id: subscription.id,
        p_customer_id: customerIdOf(subscription),
        p_period_end: periodEndOf(subscription),
      };
    }

    // A refund or chargeback identifies only the customer, which apply_subscription_event
    // correlates on as a last resort, scoped to pending and active rows.
    case "charge.refunded":
      return onlyCustomer(customerIdOf(event.data.object));

    case "charge.dispute.created": {
      // A Dispute carries no customer, so the charge is the only way back to the account.
      const chargeId = idOf(event.data.object.charge);
      if (!chargeId) return null;
      return onlyCustomer(customerIdOf(await lookups.getCharge(chargeId)));
    }

    default:
      return null;
  }
}

const onlyCustomer = (id: string | null): Partial<Correlation> | null =>
  id ? { p_customer_id: id } : null;
