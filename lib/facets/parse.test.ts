import { describe, expect, it } from "vitest";
import { goalFromQuery, parseFacets } from "./parse";

const CITIES = ["Corumbá", "Campo Grande", "São Paulo"];

describe("parseFacets", () => {
  it("extracts type, city, bedrooms and price from a full query", () => {
    const f = parseFacets("apartamento 2 quartos em corumba ate 200 mil", CITIES);
    expect(f.type).toBe("Apartamento");
    expect(f.city).toBe("Corumbá");
    expect(f.bedroomsMin).toBe(2);
    expect(f.priceMax).toBe(200_000);
    expect(f.normalized).toBe("apartamento 2 quartos em corumba ate 200 mil");
  });

  it("maps type synonyms to the canonical label", () => {
    expect(parseFacets("apto no centro", CITIES).type).toBe("Apartamento");
    expect(parseFacets("lote grande", CITIES).type).toBe("Terreno");
    expect(parseFacets("sobrado familiar", CITIES).type).toBe("Casa");
  });

  it("matches multi-word cities and tolerates typos", () => {
    expect(parseFacets("casa em campo grande", CITIES).city).toBe("Campo Grande");
    expect(parseFacets("casa em sao paolo", CITIES).city).toBe("São Paulo");
  });

  it("parses millions and thousands in the price cap", () => {
    expect(parseFacets("casa ate 1,5 mi", CITIES).priceMax).toBe(1_500_000);
    expect(parseFacets("casa no maximo 350 mil", CITIES).priceMax).toBe(350_000);
  });

  it("detects an investment goal", () => {
    expect(parseFacets("apartamento para temporada", CITIES).goal).toBe("airbnb");
    expect(parseFacets("imovel para estudantes", CITIES).goal).toBe("student");
  });

  it("extracts a nearby POI with its category", () => {
    const f = parseFacets("apartamento perto da universidade federal", CITIES);
    expect(f.poi).toEqual({ name: "universidade federal", category: "university" });
  });

  it("treats a bare 'perto do centro' as locality, not a POI", () => {
    expect(parseFacets("casa perto do centro", CITIES).poi).toBeNull();
  });

  it("returns all-null facets for an empty-ish query", () => {
    const f = parseFacets("oi", CITIES);
    expect(f.type).toBeNull();
    expect(f.city).toBeNull();
    expect(f.bedroomsMin).toBeNull();
    expect(f.priceMax).toBeNull();
    expect(f.goal).toBeNull();
    expect(f.poi).toBeNull();
  });
});

describe("goalFromQuery", () => {
  it("resolves goals from keyword stems", () => {
    expect(goalFromQuery("reforma e revenda")).toBe("flip");
    expect(goalFromQuery("ponto comercial")).toBe("commercial");
    expect(goalFromQuery("apenas moradia")).toBeNull();
  });
});
