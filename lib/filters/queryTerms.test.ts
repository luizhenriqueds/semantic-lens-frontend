import { describe, expect, it } from "vitest";
import { parseQueryTerms } from "./queryTerms";

describe("parseQueryTerms", () => {
  it("splits a bedroom count out of the text", () => {
    expect(parseQueryTerms("apartamento 2 dormitórios")).toEqual({
      q: "apartamento",
      bedroomsEq: 2,
    });
  });

  it("recognises a noun that is still being typed", () => {
    expect(parseQueryTerms("apartamento 2 dor")).toEqual({ q: "apartamento", bedroomsEq: 2 });
    expect(parseQueryTerms("apartamento 2 d")).toEqual({
      q: "apartamento 2 d",
      bedroomsEq: undefined,
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
      expect(parseQueryTerms(`casa 3 ${noun}`)).toEqual({ q: "casa", bedroomsEq: 3 });
    }
  });

  // q is shown back in alert descriptions and chips, so its casing has to survive.
  it("keeps the text as typed", () => {
    expect(parseQueryTerms("Apartamento 2 quartos em Campo Grande")).toEqual({
      q: "Apartamento em Campo Grande",
      bedroomsEq: 2,
    });
  });

  it("reads the term wherever it sits", () => {
    expect(parseQueryTerms("2 quartos campo grande")).toEqual({
      q: "campo grande",
      bedroomsEq: 2,
    });
  });

  it("keeps a query with no bedroom term untouched", () => {
    for (const q of ["apartamento", "apartamento em campo grande", "casa com piscina"]) {
      expect(parseQueryTerms(q)).toEqual({ q, bedroomsEq: undefined });
    }
  });

  // A bare number is a street or neighbourhood number as often as a bedroom count.
  it("ignores a number with no noun after it", () => {
    expect(parseQueryTerms("apartamento 2")).toEqual({
      q: "apartamento 2",
      bedroomsEq: undefined,
    });
    expect(parseQueryTerms("setor 3 brasilia")).toEqual({
      q: "setor 3 brasilia",
      bedroomsEq: undefined,
    });
  });

  it("rejects counts no listing would have", () => {
    expect(parseQueryTerms("casa 0 quartos").bedroomsEq).toBeUndefined();
    expect(parseQueryTerms("casa 99 quartos").bedroomsEq).toBeUndefined();
  });

  it("takes the first count when several are typed", () => {
    expect(parseQueryTerms("casa 2 quartos 4 dormitórios")).toEqual({
      q: "casa",
      bedroomsEq: 2,
    });
  });

  it("normalises whitespace and handles an empty query", () => {
    expect(parseQueryTerms("  casa   2   quartos  ")).toEqual({ q: "casa", bedroomsEq: 2 });
    expect(parseQueryTerms("")).toEqual({ q: "", bedroomsEq: undefined });
    expect(parseQueryTerms("2 quartos")).toEqual({ q: "", bedroomsEq: 2 });
  });
});
