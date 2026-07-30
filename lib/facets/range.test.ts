import { describe, expect, it } from "vitest";
import { parseRange, rangeHref, rangeLabel } from "./range";

describe("parseRange", () => {
  it("reads a bounded bucket", () => {
    expect(parseRange("price", "100000", "200000")).toEqual({
      dim: "price",
      from: 100000,
      to: 200000,
    });
  });

  it("treats an empty upper bound as open-ended", () => {
    expect(parseRange("price", "1000000", "")).toEqual({
      dim: "price",
      from: 1000000,
      to: Infinity,
    });
  });

  it("rejects unknown or missing dimensions", () => {
    expect(parseRange("bogus", "0", "10")).toBeUndefined();
    expect(parseRange(undefined, "0", "10")).toBeUndefined();
  });

  it("rejects a non-numeric lower bound", () => {
    expect(parseRange("price", "abc", "10")).toBeUndefined();
  });
});

describe("rangeHref", () => {
  it("round-trips through parseRange", () => {
    const url = new URL(rangeHref("area", 60, 80), "http://x");
    const sp = url.searchParams;
    expect(parseRange(sp.get("range_dim")!, sp.get("range_from")!, sp.get("range_to")!)).toEqual({
      dim: "area",
      from: 60,
      to: 80,
    });
  });

  it("leaves the upper bound empty when open-ended", () => {
    expect(rangeHref("price", 1_000_000, Infinity)).toContain("range_to=&");
  });
});

describe("rangeLabel", () => {
  it("labels bounded and open-ended buckets", () => {
    expect(rangeLabel({ dim: "area", from: 60, to: 80 })).toBe("Área: 60 m² – 80 m²");
    expect(rangeLabel({ dim: "invest", from: 90, to: Infinity })).toBe(
      "Nota de investimento: 90 ou mais",
    );
  });
});
