import { describe, expect, it } from "vitest";
import { entitlementsFor } from "@/lib/entitlements";
import type { Role } from "@/lib/entitlements";
import { toRpcFilters } from "./contract";
import { gateCriteria, gateFilters, unlockedHref } from "./gate";
import type { PropertyFilters } from "@/lib/types";

const ent = (role: Role) => entitlementsFor(role, false);

const FREE: PropertyFilters = { q: "casa", uf: "SP", city: "Santos", type: "Casa", h3: "8a28" };

// The drawer sections every plan gets: "Imóvel" and "Leilão e pagamento".
const OPEN_ADVANCED: PropertyFilters = {
  maxPrice: 100_000,
  minArea: 40,
  minBedrooms: 2,
  financing: true,
  fgts: true,
  auctionWithinDays: 7,
  firstSeenWithinDays: 30,
  changeKinds: ["modality", "price_drop"],
  changedWithinDays: 30,
};

const ADVANCED: PropertyFilters = {
  ...OPEN_ADVANCED,
  minDiscount: 58,
  minInvestment: 60,
  minVisualScore: 70,
  maxCenterM: 3000,
  poiCats: ["school"],
  poiRadiusM: 2000,
  scoreKey: "flip",
  scoreMin: 80,
  range: { dim: "price", from: 0, to: 100 },
};

describe("gateFilters", () => {
  it("drops the gated filters a deep link carries for a plan without them", () => {
    const { filters, lockedFilters } = gateFilters({ ...FREE, ...ADVANCED }, ent("basic"));
    expect(filters).toEqual({ ...FREE, ...OPEN_ADVANCED });
    expect(lockedFilters).toEqual(["advancedFilters"]);
  });

  it("keeps the sections open to every plan, on the lowest plan and anon alike", () => {
    for (const role of ["anon", "basic"] as const) {
      const asked = { ...FREE, ...OPEN_ADVANCED };
      expect(gateFilters(asked, ent(role)), role).toEqual({ filters: asked, lockedFilters: [] });
    }
  });

  it("keeps them all once the plan includes advanced filters", () => {
    const asked = { ...FREE, ...ADVANCED };
    const { filters, lockedFilters } = gateFilters(asked, ent("investor"));
    expect(filters).toEqual(asked);
    expect(lockedFilters).toEqual([]);
  });

  it("gates the group filter separately, since it is its own feature", () => {
    expect(gateFilters({ clusterId: 3 }, ent("basic"))).toEqual({
      filters: {},
      lockedFilters: ["groups"],
    });
    expect(gateFilters({ clusterId: 3 }, ent("investor")).filters).toEqual({ clusterId: 3 });
  });

  it("reports nothing locked when the URL only carries free filters", () => {
    expect(gateFilters(FREE, ent("anon"))).toEqual({ filters: FREE, lockedFilters: [] });
  });
});

describe("unlockedHref", () => {
  // Every "ver todos" the dashboard rails offer, in the order the page renders them.
  const RAIL_LINKS = [
    "/properties?auction_within_days=7&view=calendar",
    "/properties?min_discount=58&min_investment=60&sort=discount",
    "/properties?max_price=100000&min_investment=68&sort=score",
    "/properties?financing=1&min_investment=60&sort=score",
    "/regions",
  ];

  it("offers none of the rail links to a plan without advanced filters", () => {
    for (const href of RAIL_LINKS) expect(unlockedHref(href, ent("basic")), href).toBeNull();
  });

  it("offers every rail link once the plan covers the destination", () => {
    for (const href of RAIL_LINKS) expect(unlockedHref(href, ent("professional")), href).toBe(href);
  });

  it("keeps a link whose filters are free on every plan", () => {
    const href = "/properties?city=Santos&sort=score";
    expect(unlockedHref(href, ent("anon"))).toBe(href);
  });

  it("gates the locked view even when the filters are free", () => {
    expect(unlockedHref("/properties?view=calendar", ent("investor"))).toBeNull();
    expect(unlockedHref("/properties?view=analysis", ent("investor"))).not.toBeNull();
  });

  it("gates a whole-feature destination that carries no query", () => {
    expect(unlockedHref("/groups", ent("basic"))).toBeNull();
    expect(unlockedHref("/groups", ent("investor"))).toBe("/groups");
    expect(unlockedHref("/portfolio", ent("basic"))).toBe("/portfolio");
  });
});

describe("gateCriteria", () => {
  // Pins the allowlist against the other shape: anything toRpcFilters emits for a gated filter
  // has to be gated on the criteria side too.
  it("covers every RPC key the gated filters serialise to", () => {
    const gated = gateCriteria(toRpcFilters({ ...ADVANCED, clusterId: 3 }), ent("basic"));
    expect(gated).toEqual(toRpcFilters(OPEN_ADVANCED));
  });

  it("leaves the free keys alone and gates each branch of an OR set", () => {
    const rpc = toRpcFilters({ ...FREE, ...ADVANCED });
    const kept = toRpcFilters({ ...FREE, ...OPEN_ADVANCED });
    expect(gateCriteria({ any: [rpc, rpc] }, ent("basic"))).toEqual({ any: [kept, kept] });
  });
});
