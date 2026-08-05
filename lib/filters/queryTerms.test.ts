import { describe, expect, it } from "vitest";
import { parseQueryTerms } from "./queryTerms";

describe("parseQueryTerms", () => {
  it("splits a bedroom count out of the text", () => {
    expect(parseQueryTerms("apartamento 2 dormitórios")).toEqual({
      q: "apartamento",
      minBedrooms: 2,
    });
  });

  it("accepts the spellings people actually type", () => {
    const nouns = [
      "dormitório",
      "dormitorios",
      "dorm",
      "dorms",
      "quarto",
      "quartos",
      "qto",
      "suíte",
    ];
    for (const noun of nouns) {
      expect(parseQueryTerms(`casa 3 ${noun}`)).toEqual({ q: "casa", minBedrooms: 3 });
    }
  });

  // q is shown back in alert descriptions and chips, so its casing has to survive.
  it("keeps the text as typed", () => {
    expect(parseQueryTerms("Apartamento 2 quartos em Campo Grande")).toEqual({
      q: "Apartamento em Campo Grande",
      minBedrooms: 2,
    });
  });

  it("reads the term wherever it sits", () => {
    expect(parseQueryTerms("2 quartos campo grande")).toEqual({
      q: "campo grande",
      minBedrooms: 2,
    });
  });

  it("keeps a query with no bedroom term untouched", () => {
    for (const q of ["apartamento", "apartamento em campo grande", "casa com piscina"]) {
      expect(parseQueryTerms(q)).toEqual({ q, minBedrooms: undefined });
    }
  });

  // A bare number is a street or neighbourhood number as often as a bedroom count.
  it("ignores a number with no noun after it", () => {
    expect(parseQueryTerms("apartamento 2")).toEqual({
      q: "apartamento 2",
      minBedrooms: undefined,
    });
    expect(parseQueryTerms("setor 3 brasilia")).toEqual({
      q: "setor 3 brasilia",
      minBedrooms: undefined,
    });
  });

  it("rejects counts no listing would have", () => {
    expect(parseQueryTerms("casa 0 quartos").minBedrooms).toBeUndefined();
    expect(parseQueryTerms("casa 99 quartos").minBedrooms).toBeUndefined();
  });

  it("takes the first count when several are typed", () => {
    expect(parseQueryTerms("casa 2 quartos 4 dormitórios")).toEqual({
      q: "casa",
      minBedrooms: 2,
    });
  });

  it("normalises whitespace and handles an empty query", () => {
    expect(parseQueryTerms("  casa   2   quartos  ")).toEqual({ q: "casa", minBedrooms: 2 });
    expect(parseQueryTerms("")).toEqual({ q: "", minBedrooms: undefined });
    expect(parseQueryTerms("2 quartos")).toEqual({ q: "", minBedrooms: 2 });
  });
});
