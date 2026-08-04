import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkLimit, rateLimitHeaders, type LimitBackend, type LimitDecision } from "./limiter";

const IDENTITY = "i:203.0.113.4";

const decision = (over: Partial<LimitDecision> = {}): LimitDecision => ({
  success: true,
  limit: 10,
  remaining: 9,
  reset: 1_000,
  ...over,
});

/** One result per window, in policy order, so a dual-window policy can deny on just one. */
function stubBackend(...results: LimitDecision[]) {
  let call = 0;
  return vi.fn<LimitBackend>(async () => results[Math.min(call++, results.length - 1)]);
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  process.env.RATELIMIT_PAGE_ANON = "10/60";
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.RATELIMIT_ENABLED;
  delete process.env.RATELIMIT_SHADOW;
  delete process.env.RATELIMIT_PAGE_ANON;
});

describe("checkLimit", () => {
  it("does not touch the backend at all when both flags are off", async () => {
    const backend = stubBackend(decision({ success: false }));
    await expect(checkLimit("page", IDENTITY, "anon", backend)).resolves.toMatchObject({
      success: true,
    });
    expect(backend).toHaveBeenCalledTimes(0);
  });

  it("allows under the limit and denies over it", async () => {
    process.env.RATELIMIT_ENABLED = "true";
    const under = await checkLimit("page", IDENTITY, "anon", stubBackend(decision()));
    expect(under.success).toBe(true);

    const over = await checkLimit(
      "page",
      IDENTITY,
      "anon",
      stubBackend(decision({ success: false, remaining: 0 })),
    );
    expect(over.success).toBe(false);
  });

  it("checks but never blocks in shadow mode", async () => {
    process.env.RATELIMIT_SHADOW = "true";
    const backend = stubBackend(decision({ success: false }));
    await expect(checkLimit("page", IDENTITY, "anon", backend)).resolves.toMatchObject({
      success: true,
    });
    expect(backend).toHaveBeenCalledTimes(1);
  });

  it("fails open when the backend throws", async () => {
    process.env.RATELIMIT_ENABLED = "true";
    const backend: LimitBackend = async () => {
      throw new Error("upstash down");
    };
    await expect(checkLimit("page", IDENTITY, "anon", backend)).resolves.toMatchObject({
      success: true,
    });
    expect(console.warn).toHaveBeenCalled();
  });

  it("denies when either window denies, and reports the furthest reset", async () => {
    process.env.RATELIMIT_ENABLED = "true";
    process.env.RATELIMIT_PAGE_ANON = "10/60,100/3600";
    const backend = stubBackend(
      decision({ success: true, reset: 1_000 }),
      decision({ success: false, reset: 900_000 }),
    );

    const result = await checkLimit("page", IDENTITY, "anon", backend);
    expect(backend).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ success: false, reset: 900_000 });
  });
});

describe("rateLimitHeaders", () => {
  it("reports a whole number of seconds, never below one", () => {
    const headers = rateLimitHeaders(decision({ reset: Date.now() + 100 }));
    expect(headers["Retry-After"]).toBe("1");
    expect(headers["Cache-Control"]).toBe("no-store");
  });

  it("mirrors the decision", () => {
    const headers = rateLimitHeaders(decision({ limit: 42, remaining: -3, reset: 5_000 }));
    expect(headers["X-RateLimit-Limit"]).toBe("42");
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["X-RateLimit-Reset"]).toBe("5000");
  });
});
