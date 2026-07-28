import { describe, expect, it } from "vitest";
import { canonicalQuery, escapeLike, fuzzy, normalize } from "./normalize";

describe("normalize", () => {
  it("lowercases, strips accents and collapses whitespace", () => {
    expect(normalize("  São   Paulo  ")).toBe("sao paulo");
    expect(normalize("CORUMBÁ")).toBe("corumba");
    expect(normalize("Ártico É Frio")).toBe("artico e frio");
  });

  it("is idempotent", () => {
    const once = normalize("Três Corações");
    expect(normalize(once)).toBe(once);
  });
});

describe("canonicalQuery", () => {
  it("collapses zero-padded counts onto the plain number", () => {
    expect(canonicalQuery("Casa 02 Quartos")).toBe("casa 2 quartos");
    expect(canonicalQuery("apto 03 dorm 02 vagas")).toBe("apto 3 dorm 2 vagas");
    expect(canonicalQuery("007 casas")).toBe("7 casas");
  });

  it("leaves digits inside a token alone", () => {
    expect(canonicalQuery("ate R$ 100.000")).toBe("ate r$ 100.000");
    expect(canonicalQuery("bloco a0203")).toBe("bloco a0203");
    expect(canonicalQuery("casa 0")).toBe("casa 0");
  });

  it("agrees with normalize on queries without padding", () => {
    expect(canonicalQuery("  São   Paulo 2 quartos ")).toBe(normalize("  São   Paulo 2 quartos "));
  });

  it("is idempotent", () => {
    const once = canonicalQuery("Casa 02 Quartos");
    expect(canonicalQuery(once)).toBe(once);
  });
});

describe("escapeLike", () => {
  it("neutralises LIKE metacharacters", () => {
    expect(escapeLike("_a%")).toBe("\\_a\\%");
    expect(escapeLike("hospital das clinicas")).toBe("hospital das clinicas");
  });
});

describe("fuzzy", () => {
  it("matches exact tokens", () => {
    expect(fuzzy("casa", "casa")).toBe(true);
  });

  it("matches on a >=5 char prefix", () => {
    expect(fuzzy("apartamentos", "apartamento")).toBe(true);
    // short keywords do not get prefix matching
    expect(fuzzy("salas", "sala")).toBe(false);
  });

  it("tolerates typos within a length-scaled edit budget", () => {
    expect(fuzzy("apartemento", "apartamento")).toBe(true); // 1 substitution
    expect(fuzzy("tereno", "terreno")).toBe(true); // 1 deletion
  });

  it("rejects tokens beyond the edit budget", () => {
    expect(fuzzy("apto", "casa")).toBe(false);
    expect(fuzzy("aptos", "apto")).toBe(false); // short keyword, no fuzziness
  });
});
