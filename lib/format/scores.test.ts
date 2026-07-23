import { describe, expect, it } from "vitest";
import { makeProperty } from "@/lib/__fixtures__/property";
import { isFirstAuction, showDiscount, topGoals } from "./scores";

describe("isFirstAuction", () => {
  it("detects a first auction/praça", () => {
    expect(isFirstAuction("1º Leilão")).toBe(true);
    expect(isFirstAuction("1ª Praça")).toBe(true);
  });

  it("is false for later rounds and missing values", () => {
    expect(isFirstAuction("2º Leilão")).toBe(false);
    expect(isFirstAuction(null)).toBe(false);
    expect(isFirstAuction(undefined)).toBe(false);
  });
});

describe("showDiscount", () => {
  it("shows a positive discount outside the first auction", () => {
    expect(showDiscount(makeProperty({ discount: 20, modality: "2º Leilão" }))).toBe(true);
  });

  it("hides it when the discount is absent, zero, or it is a first auction", () => {
    expect(showDiscount(makeProperty({ discount: null }))).toBe(false);
    expect(showDiscount(makeProperty({ discount: 0 }))).toBe(false);
    expect(showDiscount(makeProperty({ discount: 30, modality: "1º Leilão" }))).toBe(false);
  });
});

describe("topGoals", () => {
  it("ranks the highest-scoring profiles and skips null scores", () => {
    const p = makeProperty({ scores: { airbnb: 80, flip: 60, liquidity: 95 } });
    const goals = topGoals(p, 2);
    expect(goals.map((g) => g.key)).toEqual(["high_liquidity", "airbnb"]);
    expect(goals[0].score).toBe(95);
  });

  it("returns an empty list when no profile is scored", () => {
    expect(topGoals(makeProperty())).toEqual([]);
  });
});
