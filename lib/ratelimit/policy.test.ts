import { afterEach, describe, expect, it } from "vitest";
import { policyFor, type Bucket, type Tier } from "./policy";

const BUCKETS: Bucket[] = ["page", "search", "export", "image"];
const TIERS: Tier[] = ["anon", "authed", "basic", "investor", "professional", "platform"];

afterEach(() => {
  delete process.env.RATELIMIT_SEARCH_ANON;
  delete process.env.RATELIMIT_PAGE_AUTHED;
});

describe("policyFor", () => {
  it("resolves a usable window for every bucket and tier", () => {
    for (const bucket of BUCKETS) {
      for (const tier of TIERS) {
        const { primary } = policyFor(bucket, tier);
        expect(primary.limit).toBeGreaterThan(0);
        expect(primary.windowMs).toBeGreaterThan(0);
      }
    }
  });

  it("never gives an anonymous caller more than a paying one", () => {
    for (const bucket of BUCKETS) {
      const anon = policyFor(bucket, "anon").primary.limit;
      for (const tier of TIERS) {
        expect(policyFor(bucket, tier).primary.limit).toBeGreaterThanOrEqual(anon);
      }
    }
  });

  it("gives a named plan the generic authed budget when the bucket does not price it", () => {
    expect(policyFor("image", "basic")).toEqual(policyFor("image", "authed"));
    expect(policyFor("search", "basic")).not.toEqual(policyFor("search", "authed"));
  });

  it("parses a single-window override", () => {
    process.env.RATELIMIT_SEARCH_ANON = "3/30";
    expect(policyFor("search", "anon")).toEqual({
      primary: { limit: 3, windowMs: 30_000 },
      secondary: undefined,
    });
  });

  it("parses both windows of an override", () => {
    process.env.RATELIMIT_PAGE_AUTHED = "10/60,100/3600";
    expect(policyFor("page", "authed")).toEqual({
      primary: { limit: 10, windowMs: 60_000 },
      secondary: { limit: 100, windowMs: 3_600_000 },
    });
  });

  it("falls back to the default when an override is malformed", () => {
    const expected = policyFor("search", "anon");
    for (const bad of ["nonsense", "8", "8/", "0/60", "-1/60", "8/x"]) {
      process.env.RATELIMIT_SEARCH_ANON = bad;
      expect(policyFor("search", "anon")).toEqual(expected);
    }
  });
});
