import { describe, expect, it } from "vitest";
import { EMPTY } from "@/lib/format";
import {
  CSV_BOM,
  csvBool,
  csvCell,
  csvDate,
  csvInt,
  csvNumber,
  toCsv,
  type CsvColumn,
} from "./csv";

describe("csvCell", () => {
  it("leaves a plain value unquoted", () => {
    expect(csvCell("Apartamento")).toBe("Apartamento");
  });

  it("quotes delimiters, quotes, newlines and edge whitespace", () => {
    expect(csvCell("Casa; sobrado")).toBe('"Casa; sobrado"');
    expect(csvCell('Rua "A"')).toBe('"Rua ""A"""');
    expect(csvCell("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
    expect(csvCell(" Centro ")).toBe('" Centro "');
  });

  it("renders a missing value as blank, never as the display placeholder", () => {
    for (const v of [null, undefined, ""]) expect(csvCell(v)).toBe("");
    // Guards against someone importing EMPTY here: a blank must stay blank so MÉDIA() skips it.
    expect(csvCell(null)).not.toBe(EMPTY);
  });

  it("neutralises formulas in untrusted edital text", () => {
    expect(csvCell("=SUM(A1)")).toBe('"\'=SUM(A1)"');
    expect(csvCell("+1")).toBe('"\'+1"');
    expect(csvCell("@cmd")).toBe('"\'@cmd"');
    expect(csvCell("\tTAB")).toBe('"\'\tTAB"');
  });

  it("does not mangle a negative number, because numbers never go through csvCell", () => {
    expect(csvNumber(-15, 0)).toBe("-15");
    expect(csvInt(-15)).toBe("-15");
  });
});

describe("csvNumber and csvInt", () => {
  it("uses a comma decimal and no thousands separator", () => {
    expect(csvNumber(1234.5, 1)).toBe("1234,5");
    expect(csvNumber(1234.5, 2)).toBe("1234,50");
    expect(csvNumber(1_234_567.89)).toBe("1234567,89");
    expect(csvNumber(1_234_567.89)).not.toContain(".");
  });

  it("rounds integers and blanks anything not finite", () => {
    expect(csvInt(72.6)).toBe("73");
    for (const v of [null, undefined, NaN, Infinity, -Infinity]) {
      expect(csvNumber(v)).toBe("");
      expect(csvInt(v)).toBe("");
    }
  });
});

describe("csvDate", () => {
  it("reformats an ISO date without constructing a Date", () => {
    expect(csvDate("2026-07-30T00:00:00+00:00")).toBe("30/07/2026");
    expect(csvDate("2026-07-30")).toBe("30/07/2026");
    // A late-evening UTC-3 timestamp keeps its own civil day rather than rolling forward.
    expect(csvDate("2026-07-30T23:30:00-03:00")).toBe("30/07/2026");
  });

  it("blanks unparseable input", () => {
    for (const v of [null, undefined, "", "amanhã", "30/07/2026"]) expect(csvDate(v)).toBe("");
  });
});

describe("csvBool", () => {
  it("is Sim/Não and never blank for a real boolean", () => {
    expect(csvBool(true)).toBe("Sim");
    expect(csvBool(false)).toBe("Não");
    expect(csvBool(null)).toBe("");
  });
});

describe("toCsv", () => {
  const cols: CsvColumn<{ a: string; b: number }>[] = [
    { header: "Coluna A", value: (r) => csvCell(r.a) },
    { header: "Coluna B", value: (r) => csvInt(r.b) },
  ];

  it("emits exactly one BOM, a header row and CRLF terminators", () => {
    const out = toCsv([{ a: "x", b: 1 }], cols);
    expect(out.startsWith(CSV_BOM)).toBe(true);
    expect(out.split(CSV_BOM)).toHaveLength(2);
    expect(out.slice(CSV_BOM.length).split("\r\n")[0]).toBe("Coluna A;Coluna B");
    expect(out.endsWith("\r\n")).toBe(true);
  });

  it("emits one line per row plus the header and the trailing terminator", () => {
    const out = toCsv(
      [
        { a: "x", b: 1 },
        { a: "y", b: 2 },
      ],
      cols,
    );
    expect(out.split("\r\n")).toHaveLength(4);
  });

  it("still emits the header for an empty row set", () => {
    expect(toCsv([], cols)).toBe(`${CSV_BOM}Coluna A;Coluna B\r\n`);
  });
});
