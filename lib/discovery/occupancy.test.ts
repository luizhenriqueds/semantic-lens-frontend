import { describe, expect, it } from "vitest";
import { isVacant } from "./occupancy";

describe("isVacant", () => {
  it("matches the values the base actually holds", () => {
    expect(isVacant("Desocupado")).toBe(true);
    expect(isVacant("Ocupado")).toBe(false);
    expect(isVacant(null)).toBe(false);
    expect(isVacant(undefined)).toBe(false);
  });

  it("is not fooled by 'Ocupado' being a substring of 'Desocupado'", () => {
    expect(isVacant("desocupada")).toBe(true);
  });
});
