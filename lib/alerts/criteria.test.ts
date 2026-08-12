import { describe, expect, it } from "vitest";
import { fromLegacyCriteria, isLegacyCriteria, sameCriteria, sanitizeCriteria } from "./criteria";

describe("sameCriteria", () => {
  it("ignores key order, so a set rebuilt from the URL matches the stored one", () => {
    expect(sameCriteria({ city: "Bauru", type: "Casa" }, { type: "Casa", city: "Bauru" })).toBe(
      true,
    );
  });

  it("sees a changed, added or removed filter", () => {
    expect(sameCriteria({ city: "Bauru" }, { city: "Marilia" })).toBe(false);
    expect(sameCriteria({ city: "Bauru" }, { city: "Bauru", min_bedrooms: 2 })).toBe(false);
    expect(sameCriteria({ city: "Bauru", min_bedrooms: 2 }, { city: "Bauru" })).toBe(false);
  });

  it("treats a missing set as different from any real one", () => {
    expect(sameCriteria(null, { city: "Bauru" })).toBe(false);
    expect(sameCriteria(undefined, null)).toBe(true);
  });

  it("compares OR branches by their contents", () => {
    expect(sameCriteria({ any: [{ type: "Casa" }] }, { any: [{ type: "Apartamento" }] })).toBe(
      false,
    );
    expect(
      sameCriteria({ any: [{ type: "Casa", uf: "SP" }] }, { any: [{ uf: "SP", type: "Casa" }] }),
    ).toBe(true);
  });
});

describe("sanitizeCriteria", () => {
  it("drops keys outside the contract, which would make the pipeline skip the alert", () => {
    expect(sanitizeCriteria({ city: "Bauru", propertyType: "Casa", nope: 1 })).toEqual({
      city: "Bauru",
    });
  });

  it("is null when nothing usable is left, so no alert matches everything", () => {
    expect(sanitizeCriteria({})).toBeNull();
    expect(sanitizeCriteria({ minDiscount: 20 })).toBeNull();
    expect(sanitizeCriteria({ q: "", poi_ids: [] })).toBeNull();
    expect(sanitizeCriteria(null)).toBeNull();
  });

  it("keeps an OR, and collapses it once a single branch survives", () => {
    expect(sanitizeCriteria({ any: [{ type: "Casa" }, { type: "Apartamento" }] })).toEqual({
      any: [{ type: "Casa" }, { type: "Apartamento" }],
    });
    expect(sanitizeCriteria({ any: [{ type: "Casa" }, { nope: 1 }] })).toEqual({ type: "Casa" });
    expect(sanitizeCriteria({ any: [] })).toBeNull();
  });
});

describe("fromLegacyCriteria", () => {
  it("renames a pre-contract row key for key", () => {
    expect(
      fromLegacyCriteria({
        q: "casa com piscina",
        uf: "SP",
        propertyType: "Casa",
        minDiscount: 20,
        maxPrice: 400_000,
        minBedrooms: 3,
        poiCats: ["university"],
        maxCenter: 1500,
      }),
    ).toEqual({
      q: "casa com piscina",
      uf: "SP",
      type: "Casa",
      min_discount: 20,
      max_price: 400_000,
      min_bedrooms: 3,
      poi_cats: ["university"],
      poi_radius_m: 2000,
      max_center_m: 1500,
    });
  });

  it("defaults a bare minimum score to the investment objective", () => {
    expect(fromLegacyCriteria({ minScore: 60 })).toEqual({
      score_key: "investment",
      score_min: 60,
    });
    expect(fromLegacyCriteria({ minScore: 60, scoreKey: "airbnb" })).toEqual({
      score_key: "airbnb",
      score_min: 60,
    });
  });
});

describe("isLegacyCriteria", () => {
  it("only flags rows that still carry pre-contract keys", () => {
    expect(isLegacyCriteria({ poiCats: ["university"] })).toBe(true);
    expect(isLegacyCriteria({ city: "Bauru", poi_cats: ["university"] })).toBe(false);
    expect(isLegacyCriteria({})).toBe(false);
    expect(isLegacyCriteria({ any: [{ type: "Casa" }] })).toBe(false);
  });
});
