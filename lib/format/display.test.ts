import { describe, expect, it } from "vitest";
import { deriveTitle, fmtDate, fmtDist, money, moneyShort, titleCase } from "./display";

const EMPTY = "—";

describe("money", () => {
  it("formats BRL with pt-BR thousands separators", () => {
    expect(money(1_500_000)).toBe("R$ 1.500.000");
    expect(money(0)).toBe("R$ 0");
  });

  it("returns the empty placeholder for null/undefined", () => {
    expect(money(null)).toBe(EMPTY);
    expect(money(undefined)).toBe(EMPTY);
  });
});

describe("moneyShort", () => {
  it("abbreviates millions and thousands", () => {
    expect(moneyShort(1_500_000)).toBe("R$ 1,5 mi");
    expect(moneyShort(250_000)).toBe("R$ 250 mil");
  });

  it("returns the empty placeholder for null", () => {
    expect(moneyShort(null)).toBe(EMPTY);
  });
});

describe("titleCase", () => {
  it("capitalizes words longer than two chars, leaving connectors lower", () => {
    expect(titleCase("APARTAMENTO em são paulo")).toBe("Apartamento em São Paulo");
  });
});

describe("fmtDist", () => {
  it("formats metres under 1km and kilometres above", () => {
    expect(fmtDist(500)).toBe("500 m");
    expect(fmtDist(1500)).toBe("1,5 km");
    expect(fmtDist(null)).toBe(EMPTY);
  });
});

describe("deriveTitle", () => {
  it("uses bedroom count when present", () => {
    expect(deriveTitle("Casa", 3, "Centro")).toBe("Casa 3 dormitórios");
    expect(deriveTitle("Casa", 1, "Centro")).toBe("Casa 1 dormitório");
  });

  it("falls back to neighborhood, then a generic label", () => {
    expect(deriveTitle("", null, "Centro")).toBe("Imóvel em Centro");
    expect(deriveTitle("Terreno", null, "")).toBe("Terreno");
  });
});

describe("fmtDate", () => {
  it("returns null for missing or invalid dates", () => {
    expect(fmtDate(null)).toBeNull();
    expect(fmtDate("not-a-date")).toBeNull();
  });

  it("returns a formatted string for a valid ISO date", () => {
    expect(typeof fmtDate("2026-03-05")).toBe("string");
  });
});
