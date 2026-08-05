import { describe, expect, it } from "vitest";
import { goalFromQuery, isPureGoal, isStructural, parseFacets } from "./parse";

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
    expect(parseFacets("ap 2 quartos", CITIES).type).toBe("Apartamento");
    expect(parseFacets("lote grande", CITIES).type).toBe("Terreno");
  });

  it("keeps sobrado as its own type", () => {
    expect(parseFacets("sobrado familiar", CITIES).type).toBe("Sobrado");
  });

  it("matches multi-word cities and tolerates typos", () => {
    expect(parseFacets("casa em campo grande", CITIES).city).toBe("Campo Grande");
    expect(parseFacets("casa em sao paolo", CITIES).city).toBe("São Paulo");
  });

  it("never fuzzy-matches a single-word city from ordinary Portuguese", () => {
    const cities = [...CITIES, "Paraí", "Resende", "Barão", "Queiroz", "Pinheiro", "Machado"];
    const queries = [
      "apartamento para airbnb",
      "imovel para revender",
      "apartamento barato",
      "quero uma casa com quintal",
      "casa para investir dinheiro",
      "casa em condominio fechado",
    ];
    for (const q of queries) expect(parseFacets(q, cities).city).toBeNull();
    expect(parseFacets("casa em parai", cities).city).toBe("Paraí");
    expect(parseFacets("apartamento em resende", cities).city).toBe("Resende");
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
    expect(f.poi).toMatchObject({ name: "universidade federal", category: "university" });
  });

  it("ends the POI phrase where the next facet begins", () => {
    const a = parseFacets("apartamento perto da usp ate 200 mil", CITIES);
    expect(a.poi?.name).toBe("usp");
    expect(a.priceMax).toBe(200_000);

    const b = parseFacets("casa perto do hospital com 3 quartos", CITIES);
    expect(b.poi?.name).toBe("hospital");
    expect(b.bedroomsMin).toBe(3);
  });

  it("extracts parking and bathroom counts as hard facets", () => {
    const f = parseFacets("apartamento com 2 vagas e 2 banheiros", CITIES);
    expect(f.parkingMin).toBe(2);
    expect(f.bathroomsMin).toBe(2);
    expect(parseFacets("casa com garagem", CITIES).parkingMin).toBeNull();
  });

  it("ends the POI phrase at a purpose clause", () => {
    const f = parseFacets("imovel proximo a ufms para estudantes", CITIES);
    expect(f.poi?.name).toBe("ufms");
    expect(f.goal).toBe("student");
  });

  it("keeps stopwords inside a POI name", () => {
    const f = parseFacets("casa perto do hospital das clinicas", CITIES);
    expect(f.poi?.name).toBe("hospital das clinicas");
  });

  it("keeps the city-qualified spelling of a POI alongside the stripped one", () => {
    const f = parseFacets("casa perto do shopping campo grande", CITIES);
    expect(f.poi?.name).toBe("shopping");
    expect(f.poi?.fullName).toBe("shopping campo grande");
  });

  it("builds a lexical query without the words no listing contains", () => {
    const f = parseFacets("apartamento de 2 quartos ate 150 mil em campo grande", CITIES);
    expect(f.lexical).toBe("apartamento 2 quartos campo grande");
    expect(f.normalized).toBe("apartamento de 2 quartos ate 150 mil em campo grande");
    expect(parseFacets("casa perto de hospital", CITIES).lexical).toBe("casa hospital");
  });

  it("detects an investment goal without shadowing the specific ones", () => {
    expect(parseFacets("imovel para investir", CITIES).goal).toBe("investment");
    expect(parseFacets("sala comercial para investimento", CITIES).goal).toBe("commercial");
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

describe("isPureGoal", () => {
  const pure = (q: string) => isPureGoal(parseFacets(q, CITIES));

  it("is true when the goal words are the whole query", () => {
    expect(pure("Comprar, reformar e revender")).toBe(true);
    expect(pure("imóvel com boa liquidez")).toBe(true);
    expect(pure("imóvel para renda de aluguel de temporada")).toBe(true);
  });

  it("counts type and city as hard filters, not description", () => {
    expect(pure("apartamento para revender em Campo Grande")).toBe(true);
  });

  it("counts a bedroom/parking count as a hard filter too", () => {
    expect(pure("apartamento 2 quartos airbnb")).toBe(true);
    expect(pure("casa 3 quartos 2 vagas para renda de temporada")).toBe(true);
  });

  it("is false when a bathroom count is present - goal_top can't filter on it", () => {
    expect(pure("apartamento 2 banheiros airbnb")).toBe(false);
  });

  it("is false when the query also describes the property", () => {
    expect(pure("apartamento amplo em zona comercial")).toBe(false);
    expect(pure("casa com piscina para temporada")).toBe(false);
  });

  it("is false without a goal, or when another branch owns the query", () => {
    expect(pure("casa com quintal")).toBe(false);
    expect(pure("imóvel perto da ufms")).toBe(false);
    expect(pure("apartamento perto do centro")).toBe(false);
  });
});

describe("isStructural", () => {
  const structural = (q: string) => isStructural(parseFacets(q, CITIES));

  it("is true when every word became a hard filter", () => {
    expect(structural("casa 02 quartos")).toBe(true);
    expect(structural("apartamento 2 quartos")).toBe(true);
    expect(structural("casa 3 quartos 2 vagas em Campo Grande")).toBe(true);
    expect(structural("apartamento")).toBe(true);
  });

  it("tolerates locality filler around the facets", () => {
    expect(structural("apartamento 2 quartos no bairro")).toBe(true);
  });

  it("is false when the query still describes the property", () => {
    expect(structural("casa 2 quartos com piscina")).toBe(false);
    expect(structural("apartamento reformado")).toBe(false);
    expect(structural("casa com quintal grande")).toBe(false);
  });

  it("is false with no hard filter at all", () => {
    expect(structural("imovel bonito")).toBe(false);
  });

  it("is false for bathrooms, which only the retrieval RPC can filter on", () => {
    expect(structural("casa 2 quartos 2 banheiros")).toBe(false);
  });

  it("leaves the branches that own the query alone", () => {
    expect(structural("casa 2 quartos para temporada")).toBe(false);
    expect(structural("apartamento perto da ufms")).toBe(false);
    expect(structural("apartamento perto do centro")).toBe(false);
  });
});
