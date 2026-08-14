import { describe, expect, it } from "vitest";
import { loginHref } from "./loginHref";

describe("loginHref", () => {
  it("carries the target, query included", () => {
    expect(loginHref("/property/123")).toBe("/login?redirect=%2Fproperty%2F123");
    expect(loginHref("/properties?city=SP")).toBe("/login?redirect=%2Fproperties%3Fcity%3DSP");
  });

  it("falls back to a plain /login when there is no target", () => {
    expect(loginHref(null)).toBe("/login");
    expect(loginHref(undefined)).toBe("/login");
    expect(loginHref("")).toBe("/login");
  });

  it("never carries an auth page, which would loop", () => {
    expect(loginHref("/login")).toBe("/login");
    expect(loginHref("/login?redirect=%2Fmarket")).toBe("/login");
    expect(loginHref("/register")).toBe("/login");
  });
});
