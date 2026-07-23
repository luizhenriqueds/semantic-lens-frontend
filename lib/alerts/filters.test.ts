import { describe, expect, it } from "vitest";
import { alertToPropertyFilters, hasAnyFilter } from "./filters";

describe("hasAnyFilter", () => {
  it("is false for an empty filter and true once any field is set", () => {
    expect(hasAnyFilter({})).toBe(false);
    expect(hasAnyFilter({ city: "São Paulo" })).toBe(true);
    expect(hasAnyFilter({ poiCats: [] })).toBe(false);
    expect(hasAnyFilter({ poiCats: ["university"] })).toBe(true);
  });
});

describe("alertToPropertyFilters", () => {
  it("maps alert fields onto the server filter contract", () => {
    expect(
      alertToPropertyFilters({
        uf: "SP",
        city: "São Paulo",
        propertyType: "Casa",
        maxPrice: 400_000,
        minDiscount: 20,
        poiCats: ["university"],
      }),
    ).toEqual({
      uf: "SP",
      city: "São Paulo",
      type: "Casa",
      maxPrice: 400_000,
      minDiscount: 20,
      poiCats: ["university"],
      poiRadiusM: 2000,
    });
  });

  it("defaults a bare minimum score to the investment objective", () => {
    expect(alertToPropertyFilters({ minScore: 60 })).toEqual({
      scoreKey: "investment",
      scoreMin: 60,
    });
    expect(alertToPropertyFilters({ minScore: 60, scoreKey: "airbnb" })).toEqual({
      scoreKey: "airbnb",
      scoreMin: 60,
    });
  });
});
