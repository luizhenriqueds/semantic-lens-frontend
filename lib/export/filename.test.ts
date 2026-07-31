import { describe, expect, it } from "vitest";
import { exportFilename, slugify } from "./filename";

describe("slugify", () => {
  it("strips diacritics and punctuation from a criteria description", () => {
    expect(slugify("Casa · em São Paulo/SP · desconto ≥ 20%")).toBe(
      "casa-em-sao-paulo-sp-desconto-20",
    );
    expect(slugify("Apartamento à venda em Brasília")).toBe("apartamento-a-venda-em-brasilia");
    expect(slugify("Ação, coração & manutenção")).toBe("acao-coracao-manutencao");
  });

  it("never leaves separator runs or edge dashes", () => {
    const out = slugify("  --- Casa   //  sobrado --- ");
    expect(out).toBe("casa-sobrado");
    expect(out).not.toMatch(/^-|-$|--/);
  });

  it("truncates on a separator boundary", () => {
    const out = slugify("casa em sao paulo com desconto acima de vinte por cento e financiamento");
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out).not.toMatch(/-$/);
    // The cut falls back to the last separator, so no token is left half-written.
    expect(out).toBe("casa-em-sao-paulo-com-desconto-acima-de-vinte-por-cento-e");
  });

  it("cuts mid-token only when there is no separator to fall back to", () => {
    expect(slugify("a".repeat(80))).toBe("a".repeat(60));
  });

  it("collapses a string with nothing usable to empty", () => {
    expect(slugify("···")).toBe("");
    expect(slugify("")).toBe("");
  });
});

describe("exportFilename", () => {
  const date = new Date(Date.UTC(2026, 6, 30, 2, 0, 0));

  it("composes base, slug and UTC date", () => {
    expect(exportFilename("imoveis", { label: "Casa · em São Paulo/SP", date, ext: "csv" })).toBe(
      "lavra-imoveis-casa-em-sao-paulo-sp-2026-07-30.csv",
    );
  });

  it("drops the slug when there is no label", () => {
    expect(exportFilename("imoveis", { label: null, date, ext: "csv" })).toBe(
      "lavra-imoveis-2026-07-30.csv",
    );
    expect(exportFilename("mercado", { date, ext: "pdf" })).toBe("lavra-mercado-2026-07-30.pdf");
  });

  it("uses the UTC day, so a UTC-3 evening does not roll back", () => {
    // 2026-07-30T02:00Z is still 2026-07-29 in São Paulo; the filename must not follow local time.
    expect(exportFilename("imoveis", { date, ext: "csv" })).toContain("2026-07-30");
  });

  it("produces a name with no character an OS would reject", () => {
    const name = exportFilename("imoveis", {
      label: 'Rua "A"/B: casa <grande> | 100%?*',
      date,
      ext: "csv",
    });
    expect(name).not.toMatch(/[/\\:*?"<>|]/);
    expect(name).not.toMatch(/[\u0000-\u001f]/);
  });
});
