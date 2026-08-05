import { describe, expect, it } from "vitest";
import { readCheckoutFlag, withoutCheckoutParam } from "./checkoutFlag";

describe("readCheckoutFlag", () => {
  it("accepts only the two flags the provider sends us back with", () => {
    expect(readCheckoutFlag("success")).toBe("success");
    expect(readCheckoutFlag("cancel")).toBe("cancel");
    for (const raw of [null, "", "1", "SUCCESS", "done"]) {
      expect(readCheckoutFlag(raw)).toBeNull();
    }
  });
});

describe("withoutCheckoutParam", () => {
  it("drops the flag and keeps everything else", () => {
    expect(withoutCheckoutParam("/settings", "tab=plano&checkout=success")).toBe(
      "/settings?tab=plano",
    );
  });

  it("drops the question mark when nothing is left", () => {
    expect(withoutCheckoutParam("/settings", "checkout=cancel")).toBe("/settings");
    expect(withoutCheckoutParam("/settings", "")).toBe("/settings");
  });
});
