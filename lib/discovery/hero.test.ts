import { describe, expect, it } from "vitest";
import { makeProperty } from "@/lib/__fixtures__/property";
import { pickHero } from "./hero";

const shot = (id: string, visualScore: number | null, image: string | null = "img.jpg") =>
  makeProperty({ id, visualScore, image, city: `City ${id}` });

describe("pickHero", () => {
  it("prefers a well-photographed property", () => {
    const pool = [shot("1", 40), shot("2", 82), shot("3", 38)];
    expect(pickHero(pool, 12)?.id).toBe("2");
  });

  it("falls back to the raw pool when nothing clears the visual floor", () => {
    const pool = [shot("1", 40), shot("2", 38)];
    expect(pickHero(pool, 12)).not.toBeNull();
  });

  it("never picks a property without a photo", () => {
    const pool = [shot("1", 90, null), shot("2", 40)];
    expect(pickHero(pool, 12)?.id).toBe("2");
  });

  it("is null when no property has a photo", () => {
    expect(pickHero([shot("1", 90, null)], 12)).toBeNull();
    expect(pickHero([], 12)).toBeNull();
  });

  it("is deterministic for a seed", () => {
    const pool = [shot("1", 80), shot("2", 82), shot("3", 90)];
    expect(pickHero(pool, 5)?.id).toBe(pickHero(pool, 5)?.id);
  });
});
