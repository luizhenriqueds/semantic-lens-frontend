import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { toEventArgs, type EventLookups } from "./webhook";
import {
  CREATED,
  PERIOD_END_ISO,
  stripeEvent as event,
  stripeSubscription,
} from "@/lib/__fixtures__/stripe";

const SUBSCRIPTION = stripeSubscription();

const lookups = (over: Partial<EventLookups> = {}): EventLookups => ({
  getSubscription: vi.fn().mockResolvedValue(SUBSCRIPTION),
  getCharge: vi.fn().mockResolvedValue({ customer: "cus_1" } as Stripe.Charge),
  ...over,
});

const CHECKOUT = event("checkout.session.completed", {
  id: "cs_1",
  mode: "subscription",
  subscription: "sub_1",
  customer: "cus_1",
  client_reference_id: "ext-1",
  amount_total: 3900,
});

// Stripe fires this alongside the checkout event on a first purchase, and its metadata snapshot is
// routinely empty there.
const FIRST_INVOICE = event("invoice.paid", {
  customer: "cus_1",
  amount_paid: 3900,
  parent: {
    type: "subscription_details",
    subscription_details: { subscription: "sub_1", metadata: {} },
  },
});

describe("toEventArgs", () => {
  it("returns null for an event we do not act on", async () => {
    expect(await toEventArgs(event("invoice.payment_failed", {}), lookups())).toBeNull();
  });

  it("returns null when the event cannot be correlated to an account", async () => {
    const uncorrelatable = [
      event("checkout.session.completed", { mode: "subscription", subscription: null }),
      event("charge.refunded", { refunded: true, customer: null }),
      event("charge.dispute.created", { charge: null }),
    ];
    for (const e of uncorrelatable) {
      expect(await toEventArgs(e, lookups())).toBeNull();
    }
  });

  it("carries Stripe's own event id, timestamp and inverted livemode", async () => {
    const args = await toEventArgs(CHECKOUT, lookups());
    expect(args).toMatchObject({
      p_event_key: "evt_1",
      p_event: "checkout.session.completed",
      p_occurred_at: new Date(CREATED * 1000).toISOString(),
      p_dev_mode: true,
    });
    expect(
      (
        await toEventArgs(
          event("charge.refunded", { refunded: true, customer: "cus_1" }, { livemode: true }),
          lookups(),
        )
      )?.p_dev_mode,
    ).toBe(false);
  });

  // The trap the whole design is built around: both events fire for one payment, so they must
  // converge rather than compound.
  it("resolves the first purchase's two events to the same activation", async () => {
    const fromCheckout = await toEventArgs(CHECKOUT, lookups());
    const fromInvoice = await toEventArgs(FIRST_INVOICE, lookups());

    for (const args of [fromCheckout, fromInvoice]) {
      expect(args).toMatchObject({
        p_effect: "activate",
        p_external_id: "ext-1",
        p_subs_id: "sub_1",
        p_customer_id: "cus_1",
        p_period_end: PERIOD_END_ISO,
      });
    }
  });

  it("resolves an invoice's external id from the subscription, never the metadata snapshot", async () => {
    const getSubscription = vi.fn().mockResolvedValue(SUBSCRIPTION);
    const args = await toEventArgs(FIRST_INVOICE, lookups({ getSubscription }));
    expect(getSubscription).toHaveBeenCalledWith("sub_1");
    expect(args?.p_external_id).toBe("ext-1");
  });

  it("files the checkout session as the bill id and its total as the amount", async () => {
    const args = await toEventArgs(CHECKOUT, lookups());
    expect(args).toMatchObject({ p_bill_id: "cs_1", p_amount_cents: 3900 });
  });

  it("reads a subscription event inline, without a lookup", async () => {
    const deps = lookups();
    const args = await toEventArgs(event("customer.subscription.deleted", SUBSCRIPTION), deps);
    expect(deps.getSubscription).not.toHaveBeenCalled();
    expect(args).toMatchObject({ p_effect: "cancel", p_subs_id: "sub_1", p_external_id: "ext-1" });
  });

  it("correlates a refund on the customer alone", async () => {
    const args = await toEventArgs(
      event("charge.refunded", { refunded: true, customer: "cus_1" }),
      lookups(),
    );
    expect(args).toMatchObject({
      p_effect: "revoke",
      p_customer_id: "cus_1",
      p_external_id: null,
      p_subs_id: null,
      p_period_end: null,
    });
  });

  it("retrieves the charge for a dispute, which carries no customer of its own", async () => {
    const getCharge = vi.fn().mockResolvedValue({ customer: "cus_7" } as Stripe.Charge);
    const args = await toEventArgs(
      event("charge.dispute.created", { charge: "ch_1" }),
      lookups({ getCharge }),
    );
    expect(getCharge).toHaveBeenCalledWith("ch_1");
    expect(args).toMatchObject({ p_effect: "revoke", p_customer_id: "cus_7" });
  });

  it("propagates a lookup failure so the route can ask Stripe to retry", async () => {
    const getSubscription = vi.fn().mockRejectedValue(new Error("stripe down"));
    await expect(toEventArgs(CHECKOUT, lookups({ getSubscription }))).rejects.toThrow(
      "stripe down",
    );
  });
});
