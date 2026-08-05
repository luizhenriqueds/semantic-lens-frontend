import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  amountMatchesPlan,
  createSubscriptionCheckout,
  isBillingConfigured,
  isPaidRole,
  priceInCents,
  productIdFor,
} from "./abacate";
import { PLANS } from "@/lib/entitlements";

const INPUT = {
  productId: "prod_abc",
  externalId: "ext-1",
  completionUrl: "https://lavra.app/ok",
  returnUrl: "https://lavra.app/back",
};

const ok = (data: unknown) =>
  new Response(JSON.stringify({ data, error: null, success: true }), { status: 200 });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.ABACATEPAY_API_KEY = "abc_dev_key";
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ABACATEPAY_API_KEY;
  delete process.env.ABACATEPAY_PRODUCT_INVESTOR;
});

describe("plan mapping", () => {
  it("only sells the plans that have a price", () => {
    expect(isPaidRole("investor")).toBe(true);
    expect(isPaidRole("professional")).toBe(true);
    for (const role of ["anon", "basic", "platform", "", null, 7]) {
      expect(isPaidRole(role)).toBe(false);
    }
  });

  it("reads product ids at call time", () => {
    expect(productIdFor("investor")).toBeNull();
    process.env.ABACATEPAY_PRODUCT_INVESTOR = "prod_investor";
    expect(productIdFor("investor")).toBe("prod_investor");
  });

  it("converts the plan price to whole cents", () => {
    expect(priceInCents("investor")).toBe(PLANS.investor.price * 100);
    expect(priceInCents("professional")).toBe(PLANS.professional.price * 100);
  });

  // What catches a PLANS price edit that nobody mirrored on the AbacatePay product.
  it("accepts only the exact plan price", () => {
    const exact = priceInCents("investor");
    expect(amountMatchesPlan("investor", exact)).toBe(true);
    for (const wrong of [exact - 1, exact + 1, PLANS.investor.price]) {
      expect(amountMatchesPlan("investor", wrong)).toBe(false);
    }
  });

  it("reports whether billing is configured", () => {
    expect(isBillingConfigured()).toBe(true);
    delete process.env.ABACATEPAY_API_KEY;
    expect(isBillingConfigured()).toBe(false);
  });
});

describe("createSubscriptionCheckout", () => {
  it("posts a single card item and unwraps the envelope", async () => {
    fetchMock.mockResolvedValue(ok({ id: "bill_1", url: "https://pay", amount: 3900 }));

    const result = await createSubscriptionCheckout({ ...INPUT, metadata: { userId: "u1" } });

    expect(result).toEqual({ id: "bill_1", url: "https://pay", amount: 3900 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.abacatepay.com/v2/subscriptions/create");
    expect(init.headers.Authorization).toBe("Bearer abc_dev_key");
    expect(JSON.parse(init.body)).toMatchObject({
      items: [{ id: "prod_abc", quantity: 1 }],
      methods: ["CARD"],
      externalId: "ext-1",
      metadata: { userId: "u1" },
    });
  });

  it("throws before any request when the key is unset", async () => {
    delete process.env.ABACATEPAY_API_KEY;
    await expect(createSubscriptionCheckout(INPUT)).rejects.toThrow(/ABACATEPAY_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on a business error returned with HTTP 200", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: null, error: "produto inválido" }), { status: 200 }),
    );
    await expect(createSubscriptionCheckout(INPUT)).rejects.toThrow("produto inválido");
  });

  it("throws when success is false even with a data payload", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "bill_1" }, error: null, success: false }), {
        status: 200,
      }),
    );
    await expect(createSubscriptionCheckout(INPUT)).rejects.toThrow(/resposta inválida/);
  });

  it("carries the HTTP status through on a 4xx", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 401 }));
    await expect(createSubscriptionCheckout(INPUT)).rejects.toThrow("HTTP 401");
  });
});
