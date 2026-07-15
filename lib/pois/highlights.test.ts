import { describe, expect, it } from "vitest";
import type { Poi } from "@/lib/types";
import { regionHighlights } from "./highlights";

let id = 0;
const poi = (category: string, name: string | null): Poi => ({
  id: id++,
  category,
  name,
  lat: 0,
  lon: 0,
});

describe("regionHighlights", () => {
  it("drops unnamed POIs and non-anchor categories", () => {
    const out = regionHighlights([
      poi("hospital", null),
      poi("fuel", "Posto Shell"),
      poi("hospital", "Hospital Central"),
    ]);
    expect(out.map((p) => p.name)).toEqual(["Hospital Central"]);
  });

  it("deduplicates by name within a category (case-insensitive)", () => {
    const out = regionHighlights([poi("bank", "Itaú"), poi("bank", "itaú")]);
    expect(out).toHaveLength(1);
  });

  it("caps per category and round-robins across categories for diversity", () => {
    const pois = [
      ...["A", "B", "C", "D"].map((n) => poi("supermarket", `Super ${n}`)),
      poi("hospital", "Hospital X"),
    ];
    const out = regionHighlights(pois, { perCat: 3, total: 12 });
    // hospital outranks supermarket, so it comes first; supermarket capped at 3
    expect(out[0].name).toBe("Hospital X");
    expect(out.filter((p) => p.category === "supermarket")).toHaveLength(3);
  });

  it("respects the total cap", () => {
    const pois = Array.from({ length: 30 }, (_, i) => poi("park", `Parque ${i}`));
    expect(regionHighlights(pois, { total: 12, perCat: 30 })).toHaveLength(12);
  });
});
