import { describe, expect, it } from "vitest";
import { makeProperty } from "@/lib/__fixtures__/property";
import { seededPick } from "./sample";

const inCity = (id: string, city: string) => makeProperty({ id, city });

const pool = [
  inCity("1", "Rio de Janeiro"),
  inCity("2", "Rio de Janeiro"),
  inCity("3", "Rio de Janeiro"),
  inCity("4", "Rio de Janeiro"),
  inCity("5", "São Paulo"),
  inCity("6", "Fortaleza"),
  inCity("7", "Goiânia"),
];

describe("seededPick", () => {
  it("is deterministic for a seed", () => {
    expect(seededPick(pool, 4, "r", 7).map((p) => p.id)).toEqual(
      seededPick(pool, 4, "r", 7).map((p) => p.id),
    );
  });

  it("caps a city at two before falling back to the rest", () => {
    const cities = seededPick(pool, 4, "r", 7).map((p) => p.city);
    expect(cities.filter((c) => c === "Rio de Janeiro").length).toBeLessThanOrEqual(2);
  });

  it("relaxes the cap when the pool is short", () => {
    const allRio = [inCity("1", "Rio"), inCity("2", "Rio"), inCity("3", "Rio")];
    expect(seededPick(allRio, 3, "r", 7)).toHaveLength(3);
  });

  it("honours exclude", () => {
    const ids = seededPick(pool, 7, "r", 7, { exclude: new Set(["1", "5"]) }).map((p) => p.id);
    expect(ids).not.toContain("1");
    expect(ids).not.toContain("5");
    expect(ids).toHaveLength(5);
  });

  it("returns the whole pool when it is smaller than n", () => {
    expect(seededPick(pool, 50, "r", 7)).toHaveLength(pool.length);
  });

  it("returns nothing for an empty pool", () => {
    expect(seededPick([], 10, "r", 7)).toEqual([]);
  });

  it("does not mutate the pool", () => {
    const before = pool.map((p) => p.id);
    seededPick(pool, 4, "r", 7);
    expect(pool.map((p) => p.id)).toEqual(before);
  });
});
