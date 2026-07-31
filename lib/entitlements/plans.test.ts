import { describe, expect, it } from "vitest";
import { CURATED_ALERTS } from "@/lib/alerts/curated";
import { entitlementsFor, PLANS, requiredPlan, SELLABLE_PLANS, toRole, TRIAL_ROLE } from "./plans";
import type { Feature, Role } from "./plans";

const ent = (role: Role, isAdmin = false) => entitlementsFor(role, isAdmin);

describe("plan matrix", () => {
  it("anon and basic have no paid feature", () => {
    const paid: Feature[] = [
      "groups",
      "recommendations",
      "advancedFilters",
      "analysisView",
      "calendarView",
      "market",
      "regions",
      "export",
      "curatedAlerts",
    ];
    for (const f of paid) {
      expect(ent("anon").can(f), `anon ${f}`).toBe(false);
      expect(ent("basic").can(f), `basic ${f}`).toBe(false);
    }
  });

  it("basic can save, anon cannot", () => {
    expect(ent("basic").can("favorites")).toBe(true);
    expect(ent("basic").can("savedSearches")).toBe(true);
    expect(ent("anon").can("favorites")).toBe(false);
    expect(ent("anon").can("savedSearches")).toBe(false);
  });

  it("investor unlocks groups, advanced filters and analysis but not calendar or market", () => {
    const e = ent("investor");
    for (const f of ["groups", "advancedFilters", "analysisView", "recommendations"] as Feature[]) {
      expect(e.can(f), f).toBe(true);
    }
    for (const f of ["calendarView", "market", "regions", "export"] as Feature[]) {
      expect(e.can(f), f).toBe(false);
    }
  });

  it("professional and platform unlock everything", () => {
    for (const role of ["professional", "platform"] as Role[]) {
      const e = ent(role);
      for (const f of Object.keys(PLANS.professional.features) as Feature[]) {
        expect(e.can(f), `${role} ${f}`).toBe(true);
      }
    }
  });

  it("caps only basic, and lifts them from investor up", () => {
    expect(ent("basic").limit("favorites")).toBe(10);
    expect(ent("basic").limit("savedSearches")).toBe(3);
    for (const role of ["investor", "professional", "platform"] as Role[]) {
      expect(ent(role).limit("favorites"), role).toBeNull();
      expect(ent(role).limit("savedSearches"), role).toBeNull();
    }
  });

  it("recommendation caps grow with the plan", () => {
    expect(ent("basic").limit("recommendations")).toBe(0);
    expect(ent("investor").limit("recommendations")).toBe(5);
    expect(ent("professional").limit("recommendations")).toBe(10);
  });

  it("admin bypasses every gate and cap without changing the plan label", () => {
    const e = ent("basic", true);
    for (const f of Object.keys(PLANS.basic.features) as Feature[]) expect(e.can(f), f).toBe(true);
    expect(e.limit("favorites")).toBeNull();
    expect(e.limit("savedSearches")).toBeNull();
    expect(e.plan.label).toBe(PLANS.basic.label);
  });

  it("atLeast follows the rank order", () => {
    expect(ent("investor").atLeast("professional")).toBe(false);
    expect(ent("professional").atLeast("investor")).toBe(true);
    expect(ent("platform").atLeast("professional")).toBe(true);
    expect(ent("basic", true).atLeast("professional")).toBe(true);
  });

  // The rank column is duplicated in public.role_rank() (migration 0077) and ROLE_RANK in the
  // batch repo; professional and platform must stay tied there too.
  it("ranks match the SQL role_rank definition", () => {
    expect(PLANS.basic.rank).toBe(1);
    expect(PLANS.investor.rank).toBe(2);
    expect(PLANS.professional.rank).toBe(3);
    expect(PLANS.platform.rank).toBe(3);
  });

  it("requiredPlan names the cheapest plan that unlocks a feature", () => {
    expect(requiredPlan("favorites").role).toBe("basic");
    expect(requiredPlan("groups").role).toBe("investor");
    expect(requiredPlan("market").role).toBe("professional");
    expect(requiredPlan("regions").role).toBe("professional");
  });

  it("toRole rejects anon and unknown values so a bad row cannot escalate", () => {
    expect(toRole("platform")).toBe("platform");
    expect(toRole("anon")).toBe("basic");
    expect(toRole("superuser")).toBe("basic");
    expect(toRole(undefined)).toBe("basic");
  });

  it("only the sellable plans are offered, cheapest first", () => {
    expect(SELLABLE_PLANS.map((p) => p.role)).toEqual(["basic", "investor", "professional"]);
  });

  it("an expired trial reads as basic, and only investor is self-serve", () => {
    const expired = entitlementsFor("basic", false, {
      eligible: false,
      endsAt: null,
      expired: true,
    });
    expect(expired.can("groups")).toBe(false);
    expect(expired.limit("favorites")).toBe(10);
    expect(expired.trial.eligible).toBe(false);
    expect(TRIAL_ROLE).toBe("investor");
    expect(requiredPlan("market").role).not.toBe(TRIAL_ROLE);
  });

  it("paid plans carry a price and a pitch for the checkout wall", () => {
    expect(PLANS.basic.price).toBe(0);
    expect(PLANS.investor.price).toBeGreaterThan(0);
    expect(PLANS.professional.price).toBeGreaterThan(PLANS.investor.price);
    for (const role of ["investor", "professional"] as Role[]) {
      expect(PLANS[role].pitch?.length, role).toBeGreaterThan(0);
    }
  });

  it("no curated alert is offered below investor", () => {
    for (const a of CURATED_ALERTS) {
      expect(ent("basic").atLeast(a.minRole), a.slug).toBe(false);
      expect(ent("professional").atLeast(a.minRole), a.slug).toBe(true);
    }
  });
});
