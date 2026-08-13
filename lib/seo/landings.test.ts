import { describe, expect, it } from "vitest";
import { LANDING_GROUPS, SEO_LANDINGS, getLanding } from "./landings";
import { SITE_NAME } from "./site";
import { resolveLandingFilters } from "./resolve";
import { slugify } from "./slug";
import { UF_NAME } from "./ufs";
import type { FilterOptions } from "@/lib/types";

const OPTIONS: FilterOptions = {
  ufs: Object.keys(UF_NAME),
  cities: [
    { uf: "RJ", city: "RIO DE JANEIRO" },
    { uf: "SP", city: "SAO PAULO" },
    { uf: "GO", city: "GOIANIA" },
    { uf: "DF", city: "BRASILIA" },
    { uf: "PR", city: "CURITIBA" },
    { uf: "SC", city: "FLORIANOPOLIS" },
    { uf: "MG", city: "BELO HORIZONTE" },
    { uf: "BA", city: "SALVADOR" },
    { uf: "PE", city: "RECIFE" },
    { uf: "RS", city: "PORTO ALEGRE" },
  ],
  types: ["Apartamento", "Casa", "Sobrado", "Terreno", "Sala Comercial"],
  modalities: ["1º Leilão", "2º Leilão", "Venda Direta"],
  poiCategories: [],
  visualScore: true,
};

describe("slugify", () => {
  it("folds diacritics and hyphenates", () => {
    expect(slugify("São Paulo")).toBe("sao-paulo");
    expect(slugify("GOIÂNIA")).toBe("goiania");
    expect(slugify("Sala Comercial")).toBe("sala-comercial");
  });
});

describe("SEO_LANDINGS", () => {
  it("has unique kebab-case slugs", () => {
    const slugs = SEO_LANDINGS.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("gives every landing the copy the page and its metadata need", () => {
    for (const l of SEO_LANDINGS) {
      expect(l.h1, l.slug).toBeTruthy();
      expect(l.title, l.slug).toBeTruthy();
      expect(l.countSuffix, l.slug).toBeTruthy();
      expect(l.lead, l.slug).toBeTruthy();
      expect(l.body.length, l.slug).toBeGreaterThan(0);
    }
  });

  it("keeps titles inside the length Google renders", () => {
    // Built from SITE_NAME rather than spelled out: a rebrand must move this bound with it.
    for (const l of SEO_LANDINGS)
      expect(`${l.title} | ${SITE_NAME}`.length, l.slug).toBeLessThanOrEqual(70);
  });

  it("assigns every landing to a declared group", () => {
    const groups = new Set(LANDING_GROUPS.map((g) => g.group));
    for (const l of SEO_LANDINGS) expect(groups.has(l.group), l.slug).toBe(true);
  });

  it("resolves every landing against a representative catalogue", () => {
    for (const l of SEO_LANDINGS) {
      expect(resolveLandingFilters(l, OPTIONS), l.slug).not.toBeNull();
    }
  });

  it("keeps the auction-stage landings apart", () => {
    const first = resolveLandingFilters(getLanding("primeiro-leilao")!, OPTIONS);
    const second = resolveLandingFilters(getLanding("segundo-leilao")!, OPTIONS);
    expect(first).toEqual({ modalities: ["1º Leilão"] });
    expect(second).toEqual({ modalities: ["2º Leilão"] });
  });

  it("resolves a city slug back to the stored casing", () => {
    expect(resolveLandingFilters(getLanding("sao-paulo-sp")!, OPTIONS)).toEqual({
      uf: "SP",
      city: "SAO PAULO",
    });
  });

  it("returns null when the catalogue value is gone", () => {
    const bare = { ...OPTIONS, types: [], cities: [] };
    expect(resolveLandingFilters(getLanding("apartamento")!, bare)).toBeNull();
    expect(resolveLandingFilters(getLanding("sao-paulo-sp")!, bare)).toBeNull();
  });

  it("does not gate price and discount landings on the catalogue", () => {
    const bare = { ...OPTIONS, ufs: [], types: [], cities: [], modalities: [] };
    expect(resolveLandingFilters(getLanding("ate-200-mil")!, bare)).toEqual({ maxPrice: 200_000 });
    expect(resolveLandingFilters(getLanding("desconto-acima-de-50")!, bare)).toEqual({
      minDiscount: 50,
    });
  });
});
