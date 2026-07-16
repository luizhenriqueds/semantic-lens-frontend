import { describe, expect, it } from "vitest";
import { fuzzy, normalize } from "./normalize";

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
