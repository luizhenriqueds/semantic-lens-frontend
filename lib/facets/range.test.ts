import { describe, expect, it } from "vitest";
import { makeProperty } from "@/lib/__fixtures__/property";
import { matchesRange, parseRange, rangeHref, rangeLabel } from "./range";

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

describe("matchesRange", () => {
  const range = { dim: "price", from: 100000, to: 200000 } as const;

  it("includes the lower bound and excludes the upper", () => {
    expect(matchesRange(makeProperty({ saleValue: 100000 }), range)).toBe(true);
    expect(matchesRange(makeProperty({ saleValue: 199999 }), range)).toBe(true);
    expect(matchesRange(makeProperty({ saleValue: 200000 }), range)).toBe(false);
    expect(matchesRange(makeProperty({ saleValue: 99999 }), range)).toBe(false);
  });

  it("excludes properties missing the value", () => {
    expect(matchesRange(makeProperty({ saleValue: null }), range)).toBe(false);
  });

  it("keeps an open-ended bucket unbounded above", () => {
    const open = { dim: "price", from: 1_000_000, to: Infinity } as const;
    expect(matchesRange(makeProperty({ saleValue: 9_000_000 }), open)).toBe(true);
  });

  // The discount histogram only counts discounts > 0, so the 0-10% bucket must not
  // pick up the zero-discount properties that were never charted.
  it("excludes zero discounts from the lowest discount bucket", () => {
    const bucket = { dim: "discount", from: 0, to: 10 } as const;
    expect(matchesRange(makeProperty({ discount: 0 }), bucket)).toBe(false);
    expect(matchesRange(makeProperty({ discount: 5 }), bucket)).toBe(true);
  });

  it("reads the investment score out of scores", () => {
    const bucket = { dim: "invest", from: 80, to: 90 } as const;
    expect(matchesRange(makeProperty({ scores: { investment: 85 } }), bucket)).toBe(true);
    expect(matchesRange(makeProperty({ scores: { investment: 70 } }), bucket)).toBe(false);
  });
});

describe("rangeHref", () => {
  it("round-trips through parseRange", () => {
    const url = new URL(rangeHref("area", 60, 80), "http://x");
    expect(parseRange(url.searchParams.get("dim")!, "60", "80")).toEqual({
      dim: "area",
      from: 60,
      to: 80,
    });
  });

  it("leaves the upper bound empty when open-ended", () => {
    expect(rangeHref("price", 1_000_000, Infinity)).toContain("to=&");
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
