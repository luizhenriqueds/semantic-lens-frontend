import { describe, expect, it } from "vitest";
import { criteriaToParams, parsePropertySearchParams, sortParam } from "./propertiesUrl";
import type { AlertCriteriaSet, PropertyFilters } from "@/lib/types";

const parse = (qs: string) =>
  parsePropertySearchParams(Object.fromEntries(new URLSearchParams(qs)));

const roundTrip = (c: AlertCriteriaSet): PropertyFilters => parse(criteriaToParams(c)).filters;

describe("criteriaToParams", () => {
  it("carries a named-place alert through the URL", () => {
    expect(
      roundTrip({
        type: "Casa",
        city: "Campo Grande",
        poi_ids: [1412752, 1410551],
        poi_radius_m: 3000,
      }),
    ).toEqual({
      type: "Casa",
      city: "Campo Grande",
      poiIds: [1412752, 1410551],
      poiRadiusM: 3000,
    });
  });

  it("carries every other contract key too", () => {
    expect(
      roundTrip({
        q: "vila moreira",
        uf: "SP",
        modalities: ["Leilão SFI"],
        min_bedrooms: 3,
        max_price: 400_000,
        min_area: 80,
        poi_cats: ["university", "hospital"],
        poi_radius_m: 1000,
        max_center_m: 1500,
        min_discount: 20,
        min_investment: 70,
        score_key: "airbnb",
        score_min: 60,
        financing: true,
        fgts: true,
        auction_within_days: 15,
      }),
    ).toEqual({
      q: "vila moreira",
      uf: "SP",
      modalities: ["Leilão SFI"],
      minBedrooms: 3,
      maxPrice: 400_000,
      minArea: 80,
      poiCats: ["university", "hospital"],
      poiRadiusM: 1000,
      maxCenterM: 1500,
      minDiscount: 20,
      minInvestment: 70,
      scoreKey: "airbnb",
      scoreMin: 60,
      financing: true,
      fgts: true,
      auctionWithinDays: 15,
    });
  });

  // A goal alert saves `score_key` with no floor (lib/alerts/criteria.ts), and the RPC narrows
  // on the key alone. Dropping it here used to land "Ajustar filtros" on the unfiltered list.
  it("keeps a goal that carries no floor", () => {
    expect(roundTrip({ type: "Casa", score_key: "flip" })).toEqual({
      type: "Casa",
      scoreKey: "flip",
    });
  });

  it("names the params exactly as the contract does", () => {
    expect(
      criteriaToParams({ type: "Casa", min_discount: 40, poi_ids: [1, 2], financing: true }),
    ).toBe("type=Casa&min_discount=40&poi_ids=1%2C2&financing=1");
  });
});

describe("legacy params", () => {
  it("still reads links saved under the old names", () => {
    expect(
      parse(
        "tipo=Casa&quartos=3&preco=400000&poi=university&raio=1000&goal=airbnb&goalMin=60&fin=1",
      ).filters,
    ).toEqual({
      type: "Casa",
      minBedrooms: 3,
      maxPrice: 400_000,
      poiCats: ["university"],
      poiRadiusM: 1000,
      scoreKey: "airbnb",
      scoreMin: 60,
      financing: true,
    });
  });

  it("prefers the contract key when a link carries both", () => {
    expect(parse("tipo=Casa&type=Apartamento").filters).toEqual({ type: "Apartamento" });
  });
});

describe("sort", () => {
  it("translates the URL value to the RPC's own vocabulary", () => {
    expect(parse("sort=discount").sort).toBe("desconto");
    expect(parse("sort=auction").sort).toBe("leilao");
    expect(parse("sort=price_asc").sort).toBe("menor");
    expect(sortParam("menor")).toBe("price_asc");
  });

  it("still accepts the old pt-BR values", () => {
    expect(parse("sort=leilao").sort).toBe("leilao");
    expect(parse("sort=menor").sort).toBe("menor");
  });

  it("falls back to the default for anything else", () => {
    expect(parse("sort=nonsense").sort).toBe("desconto");
    expect(parse("").sort).toBe("desconto");
  });
});
