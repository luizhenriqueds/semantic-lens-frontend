import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLANS } from "@/lib/entitlements";

const retrieve = vi.fn();

vi.mock("stripe", () => ({
  default: class {
    prices = { retrieve };
  },
}));

const { isBillingConfigured, priceIdFor, verifyPlanPrice } = await import("./stripe");

const price = (over: Record<string, unknown> = {}) => ({
  active: true,
  type: "recurring",
  currency: "brl",
  recurring: { interval: "month", interval_count: 1 },
  unit_amount: PLANS.investor.price * 100,
  ...over,
});

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_key";
});

afterEach(() => {
  retrieve.mockReset();
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_INVESTOR;
});

describe("configuration", () => {
  it("reads price ids at call time", () => {
    expect(priceIdFor("investor")).toBeNull();
    process.env.STRIPE_PRICE_INVESTOR = "price_investor";
    expect(priceIdFor("investor")).toBe("price_investor");
  });

  it("reports whether billing is configured", () => {
    expect(isBillingConfigured()).toBe(true);
    delete process.env.STRIPE_SECRET_KEY;
    expect(isBillingConfigured()).toBe(false);
  });
});

// What catches a PLANS price edit that nobody mirrored on the Stripe Price - and three drift
// classes a bare cents comparison would have waved through.
describe("verifyPlanPrice", () => {
  it("accepts a monthly BRL price at the plan amount", async () => {
    retrieve.mockResolvedValue(price());
    await expect(verifyPlanPrice("investor", "price_1")).resolves.toBeNull();
  });

  // Each case asserts which check fired, so an implementation that always rejects fails here.
  it.each([
    ["amount off by one", { unit_amount: PLANS.investor.price * 100 + 1 }, /^amount /],
    ["the other plan's amount", { unit_amount: PLANS.professional.price * 100 }, /^amount /],
    ["tiered pricing", { unit_amount: null }, /^amount /],
    ["wrong currency", { currency: "usd" }, /^currency usd/],
    ["annual cadence", { recurring: { interval: "year", interval_count: 1 } }, /^interval /],
    ["quarterly cadence", { recurring: { interval: "month", interval_count: 3 } }, /^interval /],
    ["archived price", { active: false }, /^archived/],
    ["one-off price", { type: "one_time", recurring: null }, /^type one_time/],
  ])("rejects %s", async (_label, over, expected) => {
    retrieve.mockResolvedValue(price(over));
    await expect(verifyPlanPrice("investor", "price_1")).resolves.toMatch(expected);
  });

  it("reports an unreachable Stripe rather than throwing", async () => {
    retrieve.mockRejectedValue(new Error("network down"));
    await expect(verifyPlanPrice("investor", "price_1")).resolves.toMatch(/^lookup failed/);
  });
});
