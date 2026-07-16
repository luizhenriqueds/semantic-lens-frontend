import { describe, expect, it } from "vitest";
import { makeProperty } from "@/lib/__fixtures__/property";
import { countMatches, hasAnyFilter, matchesFilters } from "./filters";

describe("matchesFilters", () => {
  it("matches on location, price and discount", () => {
    const p = makeProperty({ uf: "SP", city: "São Paulo", saleValue: 300_000, discount: 25 });
    expect(matchesFilters(p, { uf: "SP", maxPrice: 400_000, minDiscount: 20 })).toBe(true);
    expect(matchesFilters(p, { uf: "RJ" })).toBe(false);
    expect(matchesFilters(p, { maxPrice: 250_000 })).toBe(false);
    expect(matchesFilters(p, { minDiscount: 30 })).toBe(false);
  });

  it("enforces a minimum score against the chosen objective", () => {
    const p = makeProperty({ scores: { investment: 70, airbnb: 40 } });
    expect(matchesFilters(p, { minScore: 60 })).toBe(true); // defaults to investment
    expect(matchesFilters(p, { minScore: 60, scoreKey: "airbnb" })).toBe(false);
  });

  it("requires POIs within the given radius", () => {
    const p = makeProperty({ nearestPoi: { university: 800 } });
    expect(matchesFilters(p, { poiCats: ["university"], poiRadius: 1000 })).toBe(true);
    expect(matchesFilters(p, { poiCats: ["university"], poiRadius: 500 })).toBe(false);
    expect(matchesFilters(p, { poiCats: ["hospital"] })).toBe(false); // not linked
  });

  it("matches everything with an empty filter", () => {
    expect(matchesFilters(makeProperty(), {})).toBe(true);
  });
});

describe("countMatches", () => {
  it("counts only the properties passing the filter", () => {
    const props = [
      makeProperty({ id: "a", uf: "SP" }),
      makeProperty({ id: "b", uf: "RJ" }),
      makeProperty({ id: "c", uf: "SP" }),
    ];
    expect(countMatches(props, { uf: "SP" })).toBe(2);
  });
});

describe("hasAnyFilter", () => {
  it("is false for an empty filter and true once any field is set", () => {
    expect(hasAnyFilter({})).toBe(false);
    expect(hasAnyFilter({ city: "São Paulo" })).toBe(true);
    expect(hasAnyFilter({ poiCats: [] })).toBe(false);
    expect(hasAnyFilter({ poiCats: ["university"] })).toBe(true);
  });
});
