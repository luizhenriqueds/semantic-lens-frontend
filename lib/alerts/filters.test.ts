import { describe, expect, it } from "vitest";
import { criteriaChips, describeCriteria } from "./filters";

describe("describeCriteria", () => {
  it("reads a filter set back as a phrase", () => {
    expect(
      describeCriteria({
        uf: "SP",
        city: "São Paulo",
        type: "Casa",
        max_price: 400_000,
        min_discount: 20,
      }),
    ).toBe("Casa · em São Paulo/SP · desconto ≥ 20% · até R$ 400 mil");
  });

  it("labels resolved places without names, as the send pipeline does", () => {
    expect(describeCriteria({ poi_ids: [1412752], poi_radius_m: 3000 })).toBe(
      "Perto do local selecionado (3,0 km)",
    );
    expect(describeCriteria({ poi_ids: [1, 2] })).toBe("Perto dos locais selecionados (2,0 km)");
  });

  it("names the collection an alert was saved from", () => {
    const labels = { clusters: { 12: "Compactos para renda" } };
    expect(describeCriteria({ cluster_id: 12 }, labels)).toBe("Compactos para renda");
    expect(describeCriteria({ cluster_id: 12, type: "Apartamento" }, labels)).toBe(
      "Apartamento · Compactos para renda",
    );
  });

  it("still describes a collection when its name was not loaded", () => {
    expect(describeCriteria({ cluster_id: 12 })).toBe("Coleção");
  });

  it("joins the branches of an OR", () => {
    expect(describeCriteria({ any: [{ type: "Casa" }, { type: "Apartamento" }] })).toBe(
      "Casa ou Apartamento",
    );
  });
});

describe("criteriaChips", () => {
  it("gives every category its own chip, at the shared radius", () => {
    expect(criteriaChips({ poi_cats: ["university", "hospital"], poi_radius_m: 1000 })).toEqual([
      "Universidade · até 1,0 km",
      "Hospital · até 1,0 km",
    ]);
  });

  it("defaults the radius when the criteria leave it out", () => {
    expect(criteriaChips({ poi_cats: ["university"] })).toEqual(["Universidade · até 2,0 km"]);
  });

  it("chips a collection by name", () => {
    expect(criteriaChips({ cluster_id: 12 }, { clusters: { 12: "Compactos para renda" } })).toEqual(
      ["Compactos para renda"],
    );
    expect(criteriaChips({ cluster_id: 12 })).toEqual(["Coleção"]);
  });

  it("keeps each branch of an OR whole", () => {
    expect(
      criteriaChips({ any: [{ type: "Casa", city: "Bauru" }, { type: "Apartamento" }] }),
    ).toEqual(["Casa · Bauru", "Apartamento"]);
  });
});
