import { describe, expect, it } from "vitest";
import { propertyAge } from "./age";

describe("propertyAge", () => {
  it("returns years elapsed for a plausible year", () => {
    expect(propertyAge(2000, 2026)).toBe(26);
    expect(propertyAge(2026, 2026)).toBe(0);
  });

  it("returns null for missing or out-of-range years", () => {
    expect(propertyAge(null, 2026)).toBeNull();
    expect(propertyAge(1799, 2026)).toBeNull(); // too old
    expect(propertyAge(2030, 2026)).toBeNull(); // in the future
  });
});
