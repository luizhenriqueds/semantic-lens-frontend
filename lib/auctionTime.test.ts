import { describe, expect, it } from "vitest";
import { makeProperty } from "@/lib/__fixtures__/property";
import { auctionInstant, auctionPassed, stillOpen } from "./auctionTime";

const NOW = new Date("2026-07-27T12:00:00Z");
const at = (iso: string | null) => makeProperty({ auctionDate: iso });

describe("auctionInstant", () => {
  it("reads the stored wall clock as BRT, not as the UTC it claims to be", () => {
    // 10:00 in Brasília is 13:00Z, however the column labels it.
    expect(auctionInstant("2026-07-23T10:00:00+00:00")).toBe(Date.parse("2026-07-23T13:00:00Z"));
  });

  it("is null for the open-ended listings and for junk", () => {
    expect(auctionInstant(null)).toBeNull();
    expect(auctionInstant("")).toBeNull();
    expect(auctionInstant("not a date")).toBeNull();
  });
});

describe("auctionPassed", () => {
  it("keeps a listing whose auction is still hours away in Brasília", () => {
    // Stored 10:00 = 13:00Z, an hour after NOW, even though the raw string looks two hours past.
    expect(auctionPassed(at("2026-07-27T10:00:00+00:00"), NOW)).toBe(false);
  });

  it("drops one whose auction has already run", () => {
    expect(auctionPassed(at("2026-07-27T08:00:00+00:00"), NOW)).toBe(true);
    expect(auctionPassed(at("2026-07-26T22:00:00+00:00"), NOW)).toBe(true);
  });

  it("never drops a listing without a date - those are offered indefinitely", () => {
    expect(auctionPassed(at(null), NOW)).toBe(false);
  });

  it("does not depend on the machine's timezone, only on the instant", () => {
    const p = at("2026-07-27T10:00:00+00:00");
    expect(auctionPassed(p, new Date("2026-07-27T12:59:59Z"))).toBe(false);
    expect(auctionPassed(p, new Date("2026-07-27T13:00:01Z"))).toBe(true);
  });
});

describe("stillOpen", () => {
  it("leaves the survivors in order, so the rail backfills from what is left", () => {
    const pool = [
      at("2026-07-27T08:00:00+00:00"),
      at(null),
      at("2026-07-27T10:00:00+00:00"),
      at("2026-07-20T10:00:00+00:00"),
    ];
    expect(stillOpen(pool, NOW)).toEqual([pool[1], pool[2]]);
  });
});
