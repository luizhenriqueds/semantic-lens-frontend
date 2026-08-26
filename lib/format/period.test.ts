import { describe, expect, it } from "vitest";
import { periodLabel } from "./period";

describe("periodLabel", () => {
  it("reports days below the 60-day boundary", () => {
    expect(periodLabel("2026-07-19", "2026-07-30")).toBe("11 dias");
    expect(periodLabel("2026-06-01", "2026-06-30")).toBe("29 dias");
    // 59 stays in days (capped), 60 crosses into months.
    expect(periodLabel("2026-01-01", "2026-03-01")).toBe("30 dias");
    expect(periodLabel("2026-01-01", "2026-03-02")).toBe("2 meses");
  });

  it("caps a day span at 30", () => {
    expect(periodLabel("2026-06-01", "2026-07-01")).toBe("30 dias");
    expect(periodLabel("2026-06-01", "2026-07-02")).toBe("30 dias");
    expect(periodLabel("2026-06-01", "2026-07-15")).toBe("30 dias");
  });

  it("reports months up to two years, then years", () => {
    expect(periodLabel("2026-01-01", "2026-06-01")).toBe("5 meses");
    // 23 months stays in months; 730 days is 24 months and tips over to years.
    expect(periodLabel("2024-08-01", "2026-07-01")).toBe("23 meses");
    expect(periodLabel("2024-07-01", "2026-07-01")).toBe("2 anos");
    expect(periodLabel("2020-01-01", "2026-01-01")).toBe("6 anos");
  });

  it("uses singular forms", () => {
    expect(periodLabel("2026-07-29", "2026-07-30")).toBe("1 dia");
    expect(periodLabel("2026-01-01", "2026-03-05")).toBe("2 meses");
    expect(periodLabel("2026-01-01", "2026-04-01")).toBe("3 meses");
  });

  it("never renders a zero or negative span", () => {
    // A same-day history reads as one day rather than "0 dias".
    expect(periodLabel("2026-07-30", "2026-07-30")).toBe("1 dia");
    expect(periodLabel("2026-07-30", "2026-07-01")).toBe("1 dia");
  });

  it("ignores the time and offset portion of an ISO timestamp", () => {
    // The same civil days must produce the same label whatever the process TZ is, which is why
    // the helper never constructs a Date from the full string.
    expect(periodLabel("2026-07-19T00:00:00+00:00", "2026-07-30T23:59:59-03:00")).toBe("11 dias");
    expect(periodLabel("2026-07-19T23:00:00-03:00", "2026-07-30")).toBe("11 dias");
  });

  it("returns null for unparseable input", () => {
    expect(periodLabel("", "2026-07-30")).toBeNull();
    expect(periodLabel("ontem", "2026-07-30")).toBeNull();
    expect(periodLabel("2026-07-30", "30/07/2026")).toBeNull();
    expect(periodLabel("2026-13-01", "2026-07-30")).toBeNull();
  });
});
