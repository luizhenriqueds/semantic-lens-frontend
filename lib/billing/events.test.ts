import { describe, expect, it } from "vitest";
import { effectOf, parseEvent } from "./events";

const flat = {
  event: "checkout.completed",
  eventId: "evt_1",
  externalId: "ext-1",
  billId: "bill_1",
  customerId: "cust_1",
  amount: 3900,
  devMode: true,
};

describe("effectOf", () => {
  it("maps the events we act on", () => {
    expect(effectOf("checkout.completed")).toBe("activate");
    expect(effectOf("subscription.completed")).toBe("activate");
    expect(effectOf("subscription.trial_started")).toBe("activate");
    expect(effectOf("subscription.renewed")).toBe("renew");
    expect(effectOf("subscription.cancelled")).toBe("cancel");
    expect(effectOf("checkout.refunded")).toBe("revoke");
    expect(effectOf("checkout.disputed")).toBe("revoke");
    expect(effectOf("checkout.lost")).toBe("revoke");
  });

  it("ignores every family that is not ours", () => {
    for (const event of [
      "transparent.completed",
      "payout.completed",
      "transfer.failed",
      "subscription.unheard_of",
      "",
    ]) {
      expect(effectOf(event)).toBe("ignore");
    }
  });
});

describe("parseEvent", () => {
  it("reads a flat payload", () => {
    expect(parseEvent(flat)).toMatchObject({
      event: "checkout.completed",
      eventKey: "evt_1",
      externalId: "ext-1",
      billId: "bill_1",
      customerId: "cust_1",
      amount: 3900,
      devMode: true,
    });
  });

  it("reads a payload nested under data.billing", () => {
    const parsed = parseEvent({
      event: "subscription.renewed",
      data: { billing: { id: "bill_9", customerId: "cust_9", amount: 7900 } },
    });
    expect(parsed).toMatchObject({
      event: "subscription.renewed",
      billId: "bill_9",
      customerId: "cust_9",
      amount: 7900,
    });
  });

  // The subs_ id is what cancellation needs, so it is worth finding under an unexpected key.
  it("finds prefixed ids under keys we did not anticipate", () => {
    const parsed = parseEvent({ event: "subscription.cancelled", data: { ref: "subs_zz" } });
    expect(parsed?.subscriptionId).toBe("subs_zz");
  });

  it("rejects anything without an event name", () => {
    for (const body of [null, "string", 42, [], { data: { id: "bill_1" } }]) {
      expect(parseEvent(body)).toBeNull();
    }
  });

  it("collapses a redelivery onto one key and separates distinct events", () => {
    const body = {
      event: "checkout.completed",
      billId: "bill_1",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    expect(parseEvent(body)!.eventKey).toBe(parseEvent(body)!.eventKey);
    expect(parseEvent(body)!.eventKey).not.toBe(
      parseEvent({ ...body, event: "checkout.refunded" })!.eventKey,
    );
  });

  it("prefers the provider event id over the derived digest", () => {
    expect(parseEvent(flat)!.eventKey).toBe("evt_1");
    const derived = parseEvent({ ...flat, eventId: undefined })!.eventKey;
    expect(derived).toHaveLength(64);
  });

  // Known limitation: two renewals in one month with no timestamp share a key. Correct for the
  // MONTHLY cycle, which is the only one we sell.
  it("buckets undated renewals by month", () => {
    const body = { event: "subscription.renewed", subscriptionId: "subs_1" };
    expect(parseEvent(body)!.eventKey).toBe(parseEvent(body)!.eventKey);
  });
});
