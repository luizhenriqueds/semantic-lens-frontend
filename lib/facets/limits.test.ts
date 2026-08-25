import { describe, expect, it } from "vitest";
import { canonicalQuery } from "./normalize";
import { parseFacets, simplifyFacets } from "./parse";
import { clampQuery, MAX_PROPERTIES_Q_TOKENS, MAX_QUERY_CHARS, MAX_QUERY_TOKENS } from "./limits";

const CITIES = ["Campo Grande", "Sao Paulo"];
const facets = (q: string) => parseFacets(q, CITIES);

const REAL = "apartamento de 3 quartos para reformar e revender na zona sul ate 300 mil";

describe("clampQuery", () => {
  it("leaves a real query untouched", () => {
    expect(clampQuery(REAL)).toBe(REAL);
    expect(REAL.length).toBeLessThan(MAX_QUERY_CHARS);
  });

  it("collapses whitespace", () => {
    expect(clampQuery("  casa   em \n campo grande ")).toBe("casa em campo grande");
  });

  it("cuts on a word boundary and stays under the cap", () => {
    const long = "casa ".repeat(80);
    const out = clampQuery(long);
    expect(out.length).toBeLessThanOrEqual(MAX_QUERY_CHARS);
    expect(out.endsWith("casa")).toBe(true);
  });

  it("hard-truncates a single unbroken token", () => {
    expect(clampQuery("a".repeat(5000))).toHaveLength(MAX_QUERY_CHARS);
  });

  it("caps the token count even when every token is short", () => {
    const out = clampQuery("a b c d e f g h i j k l m n o p q r s t u v");
    expect(out.split(" ")).toHaveLength(MAX_QUERY_TOKENS);
  });

  it("is idempotent, so the client and server caps cannot split one cache key", () => {
    for (const q of [REAL, "casa ".repeat(80), "a".repeat(5000), "x y ".repeat(40)]) {
      const once = clampQuery(q);
      expect(clampQuery(once)).toBe(once);
    }
  });

  it("honours a tighter token budget for the /properties box", () => {
    const place = "jardim novo santo antonio sao jose do rio preto sp casa";
    const out = clampQuery(place, MAX_QUERY_CHARS, MAX_PROPERTIES_Q_TOKENS);
    // An AND with fewer terms is a superset, so dropping the tail widens the match, never breaks it.
    expect(out.split(" ")).toHaveLength(MAX_PROPERTIES_Q_TOKENS);
    expect(place.startsWith(out)).toBe(true);
  });
});

describe("simplifyFacets", () => {
  it("leaves ordinary queries alone", () => {
    for (const q of [
      "casa para familia em campo grande",
      "apartamento 2 quartos ate 200 mil",
      "imovel com boa liquidez",
      "casa perto do hospital",
    ]) {
      expect(simplifyFacets(facets(q)).dropped).toEqual([]);
    }
  });

  it("keeps one branch: the named place beats the centre and the goal", () => {
    const f = { ...facets("casa perto do shopping campo grande"), center: true, goal: "liquidez" };
    const { facets: out, dropped } = simplifyFacets(f as never);
    expect(out.poi).not.toBeNull();
    expect(out.center).toBe(false);
    expect(out.goal).toBeNull();
    expect(dropped).toEqual(["proximidade do centro", "objetivo"]);
  });

  it("drops hard filters past the budget, cheapest intent last", () => {
    const f = {
      ...facets("casa em campo grande"),
      priceMax: 200000,
      bedroomsMin: 2,
      parkingMin: 1,
      bathroomsMin: 2,
    };
    const { facets: out, dropped } = simplifyFacets(f as never);
    expect(out.type).toBe("Casa");
    expect(out.priceMax).toBe(200000);
    expect(out.bedroomsMin).toBe(2);
    expect(out.parkingMin).toBeNull();
    expect(out.bathroomsMin).toBeNull();
    expect(dropped).toEqual(["vagas", "banheiros"]);
  });

  it("does not mutate its input", () => {
    const f = { ...facets("casa em campo grande"), center: true, goal: "liquidez" };
    simplifyFacets(f as never);
    expect(f.goal).toBe("liquidez");
  });
});

describe("canonicalQuery", () => {
  it("clamps, so every /search entry point is bounded without its own guard", () => {
    expect(canonicalQuery("Casa ".repeat(80)).length).toBeLessThanOrEqual(MAX_QUERY_CHARS);
  });

  it("still folds padded counts", () => {
    expect(canonicalQuery("Casa 02 Quartos")).toBe("casa 2 quartos");
  });
});
