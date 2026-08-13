import { describe, expect, it } from "vitest";
import { matchesWebhookSecret } from "./secret";

const SECRET = "s3cr3t-do-webhook";
const url = (qs = "") => new URL(`https://leilaoindex.com.br/api/webhooks/abacatepay${qs}`);
const headers = (init: Record<string, string> = {}) => new Headers(init);

describe("matchesWebhookSecret", () => {
  it("accepts the secret on every channel we support", () => {
    expect(matchesWebhookSecret(url(`?webhookSecret=${SECRET}`), headers(), SECRET)).toBe(true);
    for (const header of ["x-abacatepay-secret", "x-webhook-secret", "webhook-secret"]) {
      expect(matchesWebhookSecret(url(), headers({ [header]: SECRET }), SECRET)).toBe(true);
    }
    expect(
      matchesWebhookSecret(url(), headers({ authorization: `Bearer ${SECRET}` }), SECRET),
    ).toBe(true);
  });

  it("rejects a wrong secret, including a prefix of the right one", () => {
    for (const wrong of ["nope", SECRET.slice(0, -1), `${SECRET}x`, ""]) {
      expect(matchesWebhookSecret(url(`?webhookSecret=${wrong}`), headers(), SECRET)).toBe(false);
    }
  });

  it("rejects everything when no secret is configured", () => {
    expect(matchesWebhookSecret(url(`?webhookSecret=${SECRET}`), headers(), undefined)).toBe(false);
    expect(matchesWebhookSecret(url(`?webhookSecret=${SECRET}`), headers(), "")).toBe(false);
  });

  it("rejects a request that presents nothing", () => {
    expect(matchesWebhookSecret(url(), headers(), SECRET)).toBe(false);
  });

  // timingSafeEqual throws on a length mismatch, so the digest has to come first.
  it("does not throw on a wildly different length", () => {
    expect(
      matchesWebhookSecret(url(), headers({ "x-webhook-secret": "x".repeat(5000) }), SECRET),
    ).toBe(false);
  });
});
