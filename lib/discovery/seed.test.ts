import { describe, expect, it } from "vitest";
import { daySeed, localDay, railSeed, seededShuffle } from "./seed";

const at = (iso: string) => new Date(iso);

describe("localDay", () => {
  it("uses São Paulo, not UTC", () => {
    // 02:00Z on the 28th is still the 27th in São Paulo (UTC-3).
    expect(localDay(at("2026-07-28T02:00:00Z"))).toBe("2026-07-27");
    expect(localDay(at("2026-07-28T04:00:00Z"))).toBe("2026-07-28");
  });
});

describe("daySeed", () => {
  it("is stable within a day", () => {
    expect(daySeed("u1", at("2026-07-27T09:00:00Z"))).toBe(
      daySeed("u1", at("2026-07-27T21:00:00Z")),
    );
  });

  it("changes the next day", () => {
    expect(daySeed("u1", at("2026-07-27T12:00:00Z"))).not.toBe(
      daySeed("u1", at("2026-07-28T12:00:00Z")),
    );
  });

  it("separates users", () => {
    const now = at("2026-07-27T12:00:00Z");
    expect(daySeed("u1", now)).not.toBe(daySeed("u2", now));
  });

  it("is stable for a signed-out visitor", () => {
    const now = at("2026-07-27T12:00:00Z");
    expect(daySeed(null, now)).toBe(daySeed(null, now));
  });
});

describe("seededShuffle", () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8];

  it("is deterministic for a seed", () => {
    expect(seededShuffle(xs, 42)).toEqual(seededShuffle(xs, 42));
  });

  it("differs across seeds", () => {
    expect(seededShuffle(xs, 42)).not.toEqual(seededShuffle(xs, 43));
  });

  it("keeps every element and does not mutate the input", () => {
    const out = seededShuffle(xs, 7);
    expect(out.slice().sort()).toEqual(xs);
    expect(xs).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("handles empty and single-element inputs", () => {
    expect(seededShuffle([], 1)).toEqual([]);
    expect(seededShuffle(["a"], 1)).toEqual(["a"]);
  });
});

describe("railSeed", () => {
  it("decorrelates rails sharing a day seed", () => {
    expect(railSeed(99, "discount")).not.toBe(railSeed(99, "budget"));
    expect(railSeed(99, "discount")).toBe(railSeed(99, "discount"));
  });
});
