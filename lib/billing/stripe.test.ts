import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLANS } from "@/lib/entitlements";

const retrieve = vi.fn();
const list = vi.fn();

vi.mock("stripe", () => ({
  default: class {
    prices = { retrieve };
    invoices = { list };
  },
}));

const { isBillingConfigured, listInvoices, priceIdFor, verifyPlanPrice } = await import("./stripe");

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
  list.mockReset();
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

describe("listInvoices", () => {
  const invoice = (over: Record<string, unknown> = {}) => ({
    id: "in_1",
    number: "A1B2-0001",
    status: "paid",
    created: 1_700_000_000,
    status_transitions: { paid_at: 1_700_086_400 },
    amount_paid: 3900,
    total: 3900,
    invoice_pdf: "https://stripe.test/invoice.pdf",
    hosted_invoice_url: "https://stripe.test/invoice",
    ...over,
  });

  it("maps a paid invoice onto the payment date and its PDF", async () => {
    list.mockResolvedValue({ data: [invoice()] });
    await expect(listInvoices("cus_1")).resolves.toEqual([
      {
        id: "in_1",
        number: "A1B2-0001",
        issuedAt: new Date(1_700_086_400 * 1000).toISOString(),
        amountCents: 3900,
        status: "paid",
        fileUrl: "https://stripe.test/invoice.pdf",
      },
    ]);
  });

  it("drops drafts, which were never billed", async () => {
    list.mockResolvedValue({ data: [invoice({ status: "draft" }), invoice({ id: "in_2" })] });
    await expect(listInvoices("cus_1")).resolves.toMatchObject([{ id: "in_2" }]);
  });

  it("shows the total of an open invoice, whose amount_paid is still zero", async () => {
    list.mockResolvedValue({
      data: [invoice({ status: "open", amount_paid: 0, status_transitions: { paid_at: null } })],
    });
    const [open] = (await listInvoices("cus_1"))!;
    expect(open.amountCents).toBe(3900);
    expect(open.issuedAt).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  // Null, never []: an empty list would tell a paying customer they had never been charged.
  it("returns null when the read fails", async () => {
    list.mockRejectedValue(new Error("network down"));
    await expect(listInvoices("cus_1")).resolves.toBeNull();
  });
});
