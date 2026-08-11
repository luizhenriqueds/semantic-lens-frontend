import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPropertiesForExport, isListable } from "./propertyList";
import { makeProperty } from "@/lib/__fixtures__/property";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc,
    from: () => ({ select: () => ({ not: () => ({ eq: () => ({ gt: () => ({}) }) }) }) }),
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  },
}));

const TIMEOUT = { message: "canceling statement due to statement timeout" };

const load = () => getPropertiesForExport({ city: "Ribeirão Preto" }, "desconto", 10);

beforeEach(() => {
  vi.useFakeTimers();
  rpc.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("property_list_page", () => {
  it("throws when the query keeps timing out", async () => {
    rpc.mockResolvedValue({ data: null, error: TIMEOUT });
    const promise = load();
    // Attached before the timers run: the rejection would otherwise be unhandled.
    const settled = expect(promise).rejects.toThrow(/statement timeout/);
    await vi.runAllTimersAsync();
    await settled;
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("resolves empty when the query genuinely returns no rows", async () => {
    rpc.mockResolvedValue({ data: { items: [], total: 0 }, error: null });
    await expect(load()).resolves.toEqual({ items: [], total: 0 });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});

describe("zero-price rows", () => {
  it("drops them from a list read", async () => {
    rpc.mockResolvedValue({
      data: {
        total: 2,
        items: [
          { property_id: "1", investment: 80, sale_value: 150000 },
          { property_id: "2", investment: 80, sale_value: 0 },
        ],
      },
      error: null,
    });
    const { items } = await load();
    expect(items.map((p) => p.id)).toEqual(["1"]);
  });

  it("keeps them out of isListable", () => {
    const scored = { scores: { investment: 70 } };
    expect(isListable(makeProperty(scored))).toBe(true);
    expect(isListable(makeProperty({ ...scored, saleValue: 0 }))).toBe(false);
    expect(isListable(makeProperty({ ...scored, saleValue: null }))).toBe(false);
  });
});
