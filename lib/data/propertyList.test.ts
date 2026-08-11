import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPropertiesForExport } from "./propertyList";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc,
    from: () => ({ select: () => ({ not: () => ({ eq: () => ({}) }) }) }),
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  },
}));

const TIMEOUT = { message: "canceling statement due to statement timeout" };

// Read through the export entry point: it hits the same loader without `cached`, so the
// unstable_cache layer never runs here.
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
