import { describe, expect, it } from "vitest";
import { EXPORT_ERROR, EXPORT_ROW_CAP, exportToast, type ExportFailure } from "./messages";

describe("EXPORT_ERROR", () => {
  it("covers every failure reason with real copy", () => {
    const reasons: ExportFailure[] = ["auth", "plan", "filter", "empty", "error"];
    expect(Object.keys(EXPORT_ERROR).sort()).toEqual([...reasons].sort());
    for (const r of reasons) expect(EXPORT_ERROR[r].length).toBeGreaterThan(0);
  });
});

describe("EXPORT_ROW_CAP", () => {
  // A product decision, not a tuning knob: the export is a working set, not the whole base.
  it("caps a file at 1.000 rows", () => {
    expect(EXPORT_ROW_CAP).toBe(1000);
  });
});

describe("exportToast", () => {
  it("reports the count with pt-BR grouping", () => {
    expect(exportToast(1234, false)).toContain("1.234");
    expect(exportToast(1234, false)).not.toContain("primeiros");
    expect(exportToast(1, false)).toBe("1 imóvel exportado");
  });

  it("names both the cap and the real total when truncated", () => {
    const msg = exportToast(12418, true);
    expect(msg).toContain("12.418");
    expect(msg).toContain(EXPORT_ROW_CAP.toLocaleString("pt-BR"));
    expect(msg).toContain("Refine os filtros");
  });
});
