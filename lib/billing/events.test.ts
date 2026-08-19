import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  PERIOD_END,
  stripeEvent as event,
  stripeSubscription as subscription,
} from "@/lib/__fixtures__/stripe";
import {
  customerIdOf,
  effectOf,
  externalIdOf,
  periodEndOf,
  subscriptionIdOfInvoice,
} from "./events";

describe("effectOf", () => {
  it("activates on a completed subscription checkout", () => {
    expect(
      effectOf(
        event("checkout.session.completed", { mode: "subscription", subscription: "sub_1" }),
      ),
    ).toBe("activate");
  });

  // Whether a session can be correlated is toEventArgs' question, not this one.
  it("ignores a checkout that is not a subscription", () => {
    expect(
      effectOf(event("checkout.session.completed", { mode: "payment", subscription: "sub_1" })),
    ).toBe("ignore");
  });

  it("activates on a subscription invoice", () => {
    const invoice = {
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } },
    };
    expect(effectOf(event("invoice.paid", invoice))).toBe("activate");
  });

  it("ignores a one-off invoice", () => {
    expect(effectOf(event("invoice.paid", { parent: { type: "quote_details" } }))).toBe("ignore");
  });

  it("cancels only when the subscription is actually scheduled to end", () => {
    expect(
      effectOf(
        event("customer.subscription.updated", subscription({ cancel_at_period_end: true })),
      ),
    ).toBe("cancel");
    // Fires on every renewal too, where nothing has changed for us.
    expect(effectOf(event("customer.subscription.updated", subscription()))).toBe("ignore");
    expect(effectOf(event("customer.subscription.deleted", subscription()))).toBe("cancel");
  });

  it("revokes on a full refund but not a partial one", () => {
    expect(effectOf(event("charge.refunded", { refunded: true, customer: "cus_1" }))).toBe(
      "revoke",
    );
    expect(effectOf(event("charge.refunded", { refunded: false, customer: "cus_1" }))).toBe(
      "ignore",
    );
  });

  it("revokes on a chargeback", () => {
    expect(effectOf(event("charge.dispute.created", { charge: "ch_1" }))).toBe("revoke");
  });

  it("ignores everything we did not subscribe to", () => {
    for (const type of [
      "invoice.payment_failed",
      "invoice.payment_succeeded",
      "customer.subscription.created",
      "checkout.session.expired",
      "payout.paid",
    ]) {
      expect(effectOf(event(type, {}))).toBe("ignore");
    }
  });
});

describe("periodEndOf", () => {
  // Basil moved the period off the subscription and onto its items; reading the old path silently
  // yields undefined rather than throwing.
  it("reads the item period, not a top-level current_period_end", () => {
    const legacy = subscription({ current_period_end: 1 } as Record<string, unknown>);
    expect(periodEndOf(legacy)).toBe(new Date(PERIOD_END * 1000).toISOString());
  });

  it("returns null when there are no items", () => {
    expect(periodEndOf(subscription({ items: { data: [] } }))).toBeNull();
  });
});

describe("id readers", () => {
  it("reads the external id from subscription metadata", () => {
    expect(externalIdOf(subscription())).toBe("ext-1");
    expect(externalIdOf(subscription({ metadata: {} }))).toBeNull();
  });

  it("reads the invoice subscription from the parent union", () => {
    const invoice = {
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_9" } },
    } as unknown as Stripe.Invoice;
    expect(subscriptionIdOfInvoice(invoice)).toBe("sub_9");
    expect(subscriptionIdOfInvoice({ parent: null } as unknown as Stripe.Invoice)).toBeNull();
  });

  it("unwraps an expanded customer object as well as a bare id", () => {
    expect(customerIdOf({ customer: "cus_1" })).toBe("cus_1");
    expect(customerIdOf({ customer: { id: "cus_2" } as Stripe.Customer })).toBe("cus_2");
    expect(customerIdOf({ customer: null })).toBeNull();
  });
});
