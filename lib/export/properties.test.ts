import { describe, expect, it } from "vitest";
import { makeProperty } from "@/lib/__fixtures__/property";
import { CSV_BOM } from "./csv";
import { propertiesToCsv, propertyColumns } from "./properties";

const headers = (origin?: string) => propertyColumns({ origin }).map((c) => c.header);
const cells = (p: Parameters<typeof propertiesToCsv>[0][number], origin?: string) =>
  propertyColumns({ origin }).map((c) => c.value(p));
const cellFor = (header: string, p: ReturnType<typeof makeProperty>) =>
  cells(p)[headers().indexOf(header)];

describe("propertyColumns", () => {
  // Pinned on purpose: this is the guard against silent drift when a field is added to Property.
  it("has a stable column contract", () => {
    expect(headers()).toEqual([
      "Matrícula",
      "Título",
      "Tipo",
      "UF",
      "Cidade",
      "Bairro",
      "Endereço",
      "Área (m²)",
      "Quartos",
      "Vagas",
      "Ano de construção",
      "Ocupação",
      "Valor de avaliação (R$)",
      "Valor de venda (R$)",
      "Desconto (%)",
      "Preço por m² (R$)",
      "Modalidade",
      "Data do leilão",
      "Aceita financiamento",
      "Aceita FGTS",
      "Situação do anúncio",
      "Condomínio (regra)",
      "IPTU e tributos (regra)",
      "Nota Investimento",
      "Nota Flip",
      "Nota Liquidez",
      "Nota Aluguel por temporada",
      "Nota Estudantil",
      "Nota Familiar",
      "Nota Comercial",
      "Nota Conveniência",
      "Melhor uso",
      "Nota do melhor uso",
      "Nota da fachada",
      "Distância do centro (m)",
      "Região (H3)",
      "Latitude",
      "Longitude",
      "Link do anúncio",
    ]);
  });

  it("appends the ficha column only when an origin is supplied", () => {
    expect(headers()).toHaveLength(39);
    expect(headers("https://lavra.app")).toHaveLength(40);
    const row = cells(makeProperty({ id: "abc" }), "https://lavra.app");
    expect(row[row.length - 1]).toBe("https://lavra.app/property/abc");
    // A trailing slash on the origin must not double up.
    expect(cells(makeProperty({ id: "abc" }), "https://lavra.app/").pop()).toBe(
      "https://lavra.app/property/abc",
    );
  });

  it("leaves every unknown value blank, with no placeholder leaking through", () => {
    const bare = makeProperty({
      id: "",
      title: "",
      propertyType: "",
      uf: "",
      city: "",
      neighborhood: "",
      area: null,
      bedrooms: null,
      saleValue: null,
    });
    for (const cell of cells(bare)) {
      expect(cell).not.toBe("-");
      expect(cell).not.toContain("undefined");
      expect(cell).not.toContain("null");
      expect(cell).not.toContain("NaN");
    }
  });

  it("flattens scores into their named columns", () => {
    const p = makeProperty({ scores: { investment: 72, flip: 55 } });
    expect(cellFor("Nota Investimento", p)).toBe("72");
    expect(cellFor("Nota Flip", p)).toBe("55");
    expect(cellFor("Nota Liquidez", p)).toBe("");
    expect(cellFor("Nota Conveniência", p)).toBe("");
  });

  it("writes booleans and the listing state as words", () => {
    const on = makeProperty({ acceptsFinancing: true, acceptsFgts: false, inactive: true });
    expect(cellFor("Aceita financiamento", on)).toBe("Sim");
    expect(cellFor("Aceita FGTS", on)).toBe("Não");
    expect(cellFor("Situação do anúncio", on)).toBe("Inativo");
    expect(cellFor("Situação do anúncio", makeProperty())).toBe("Ativo");
  });

  it("derives preço por m² and blanks it rather than dividing by zero", () => {
    expect(cellFor("Preço por m² (R$)", makeProperty({ saleValue: 300000, area: 60 }))).toBe(
      "5000,00",
    );
    expect(cellFor("Preço por m² (R$)", makeProperty({ area: 0 }))).toBe("");
    expect(cellFor("Preço por m² (R$)", makeProperty({ area: null }))).toBe("");
    expect(cellFor("Preço por m² (R$)", makeProperty({ saleValue: null }))).toBe("");
  });

  it("maps the profile through its short label", () => {
    expect(cellFor("Melhor uso", makeProperty({ profile: "high_liquidity" }))).toBe("Liquidez");
    expect(cellFor("Melhor uso", makeProperty({ profile: null }))).toBe("");
  });
});

describe("propertiesToCsv", () => {
  it("survives values carrying the delimiter and quotes", () => {
    const csv = propertiesToCsv([makeProperty({ rawAddress: "Rua A; 10", title: 'Casa "azul"' })]);
    const row = csv.slice(CSV_BOM.length).split("\r\n")[1];
    expect(row).toContain('"Rua A; 10"');
    expect(row).toContain('"Casa ""azul"""');
    // Splitting naively over-counts, because the address carries a delimiter of its own; the
    // quoting is what keeps the row parseable.
    expect(row.split(";").length).toBeGreaterThan(headers().length);
  });

  it("emits a header row and one row per property", () => {
    const csv = propertiesToCsv([makeProperty({ id: "a" }), makeProperty({ id: "b" })]);
    expect(csv.split("\r\n")).toHaveLength(4);
  });
});
