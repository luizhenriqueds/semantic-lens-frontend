import { describe, expect, it } from "vitest";
import { spreadByLocality } from "./diversify";
import { makeProperty } from "./__fixtures__/property";

const at = (id: string, neighborhood: string) =>
  makeProperty({ id, city: "Goiânia", neighborhood });

describe("spreadByLocality", () => {
  it("moves a locality's surplus behind the other localities", () => {
    const items = [
      at("1", "Estrela Dalva"),
      at("2", "Estrela Dalva"),
      at("3", "Estrela Dalva"),
      at("4", "Estrela Dalva"),
      at("5", "Centro"),
      at("6", "Setor Oeste"),
    ];
    expect(spreadByLocality(items).map((p) => p.id)).toEqual(["1", "2", "5", "6", "3", "4"]);
  });

  it("keeps a diverse list untouched", () => {
    const items = [at("1", "Centro"), at("2", "Setor Oeste"), at("3", "Jardim América")];
    expect(spreadByLocality(items).map((p) => p.id)).toEqual(["1", "2", "3"]);
  });

  it("separates identical neighbourhood names in different cities", () => {
    const items = [
      makeProperty({ id: "1", city: "Rio de Janeiro", neighborhood: "Centro" }),
      makeProperty({ id: "2", city: "Rio de Janeiro", neighborhood: "Centro" }),
      makeProperty({ id: "3", city: "Campo Grande", neighborhood: "Centro" }),
      makeProperty({ id: "4", city: "Rio de Janeiro", neighborhood: "Centro" }),
    ];
    expect(spreadByLocality(items).map((p) => p.id)).toEqual(["1", "2", "3", "4"]);
  });
});
