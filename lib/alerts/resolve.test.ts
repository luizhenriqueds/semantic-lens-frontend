import { describe, expect, it, vi } from "vitest";
import { resolveQueryCriteria } from "./resolve";

// Stands in for the search pipeline's own query parsing and `resolve_pois` lookup.
vi.mock("@/lib/data", async () => {
  const { canonicalQuery, normalize, parseFacets } = await import("@/lib/facets");
  const cities = ["Campo Grande", "Bauru"];
  const pois = [
    { id: 11, name: "UFMS - Campus de Campo Grande", category: "university" },
    { id: 12, name: "UFMS - Campus do Pantanal", category: "university" },
    { id: 13, name: "UFMS - Campus de Três Lagoas", category: "university" },
    { id: 21, name: "UCDB - Universidade Católica Dom Bosco", category: "university" },
    { id: 31, name: "Hospital Regional de Mato Grosso do Sul", category: "hospital" },
  ];
  return {
    parseQuery: async (q: string) => parseFacets(canonicalQuery(q), cities),
    searchPoisByName: async (poi: { name: string }) => {
      const terms = normalize(poi.name)
        .split(" ")
        .filter((t) => t.length >= 3);
      return pois.filter((p) => terms.some((t) => normalize(p.name).includes(t)));
    },
  };
});

describe("resolveQueryCriteria", () => {
  it("resolves a named place to every id that carries the name", async () => {
    expect(await resolveQueryCriteria("apartamento perto da UFMS")).toEqual({
      criteria: { type: "Apartamento", poi_ids: [11, 12, 13], poi_radius_m: 2000 },
      dropped: [],
    });
  });

  it("resolves a specific place to the one id", async () => {
    const { criteria } = await resolveQueryCriteria("casa perto do hospital regional");
    expect(criteria).toEqual({ type: "Casa", poi_ids: [31], poi_radius_m: 2000 });
  });

  it("uses categories for category intent", async () => {
    const { criteria } = await resolveQueryCriteria("casa em Bauru perto de um hospital");
    expect(criteria).toEqual({
      type: "Casa",
      city: "Bauru",
      poi_cats: ["hospital"],
      poi_radius_m: 2000,
    });
  });

  it("never carries the query text through as `q`", async () => {
    const { criteria } = await resolveQueryCriteria("apartamento com piscina aquecida em Bauru");
    expect(criteria).toEqual({ type: "Apartamento", city: "Bauru" });
  });

  it("says which parts it left out", async () => {
    expect(await resolveQueryCriteria("casa perto do bar do ze com 2 vagas")).toEqual({
      criteria: { type: "Casa" },
      dropped: ["vagas de garagem", "“perto de Bar do ze”"],
    });
  });

  it("is null when nothing in the phrase maps to a filter", async () => {
    expect(await resolveQueryCriteria("algo interessante")).toEqual({
      criteria: null,
      dropped: [],
    });
  });
});
