import { describe, expect, it } from "vitest";
import { makeProperty } from "@/lib/__fixtures__/property";
import {
  filterPortfolio,
  NO_PORTFOLIO_FILTERS,
  portfolioOptions,
  sortPortfolio,
} from "./portfolio";

const items = [
  makeProperty({ id: "a", uf: "MS", city: "Campo Grande", neighborhood: "Jardim Aeroporto" }),
  makeProperty({
    id: "b",
    uf: "SP",
    city: "São Paulo",
    neighborhood: "Perdizes",
    propertyType: "Casa",
  }),
];

describe("filterPortfolio", () => {
  it("keeps everything when no filter is set", () => {
    expect(filterPortfolio(items, NO_PORTFOLIO_FILTERS)).toHaveLength(2);
  });

  it("matches the text filter without accents or case", () => {
    expect(filterPortfolio(items, { ...NO_PORTFOLIO_FILTERS, q: "sao paulo" })).toEqual([items[1]]);
    expect(filterPortfolio(items, { ...NO_PORTFOLIO_FILTERS, q: "PERDIZES" })).toEqual([items[1]]);
  });

  it("ANDs the state and type filters", () => {
    expect(filterPortfolio(items, { q: "", uf: "MS", type: "Casa" })).toHaveLength(0);
    expect(filterPortfolio(items, { q: "", uf: "SP", type: "Casa" })).toEqual([items[1]]);
  });
});

describe("sortPortfolio", () => {
  it("leaves the saved order untouched", () => {
    expect(sortPortfolio(items, "recent")).toBe(items);
  });

  it("puts the nearest auction first and undated listings last", () => {
    const dated = makeProperty({ id: "soon", auctionDate: "2026-08-10T14:00:00+00:00" });
    const later = makeProperty({ id: "later", auctionDate: "2026-12-10T14:00:00+00:00" });
    const undated = makeProperty({ id: "none" });
    expect(sortPortfolio([undated, later, dated], "auction").map((p) => p.id)).toEqual([
      "soon",
      "later",
      "none",
    ]);
  });

  it("orders by price in both directions", () => {
    const cheap = makeProperty({ id: "cheap", saleValue: 100 });
    const dear = makeProperty({ id: "dear", saleValue: 900 });
    expect(sortPortfolio([dear, cheap], "price_asc").map((p) => p.id)).toEqual(["cheap", "dear"]);
    expect(sortPortfolio([cheap, dear], "price_desc").map((p) => p.id)).toEqual(["dear", "cheap"]);
  });
});

describe("portfolioOptions", () => {
  it("offers only the values the carteira holds, sorted", () => {
    expect(portfolioOptions(items)).toEqual({
      ufs: ["MS", "SP"],
      types: ["Apartamento", "Casa"],
    });
  });
});
