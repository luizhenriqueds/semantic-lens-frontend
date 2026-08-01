import { describe, expect, it } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
  it("keeps internal paths, query and hash included", () => {
    expect(safeRedirect("/market")).toBe("/market");
    expect(safeRedirect("/properties?view=analysis#top")).toBe("/properties?view=analysis#top");
  });

  it("falls back when there is nothing to honour", () => {
    expect(safeRedirect(null)).toBe("/dashboard");
    expect(safeRedirect("")).toBe("/dashboard");
  });

  it("refuses anything that can leave the origin", () => {
    for (const hostile of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "market",
    ]) {
      expect(safeRedirect(hostile)).toBe("/dashboard");
    }
  });
});
