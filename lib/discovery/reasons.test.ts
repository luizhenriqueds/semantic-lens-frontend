import { describe, expect, it } from "vitest";
import { BRT_OFFSET_MS } from "@/lib/auctionTime";
import { makeProperty } from "@/lib/__fixtures__/property";
import { auctionCountdown, heroReasons, reasonsFor } from "./reasons";

const NOW = new Date("2026-07-27T12:00:00Z");

// Stored auction_date is BRT labelled +00:00, so it reads three hours behind the real instant.
const inHours = (h: number) =>
  new Date(NOW.getTime() + h * 3_600_000 - BRT_OFFSET_MS).toISOString();

describe("auctionCountdown", () => {
  it("bands by urgency", () => {
    expect(auctionCountdown(inHours(0.5), NOW)).toBe("encerra em menos de 1h");
    expect(auctionCountdown(inHours(6), NOW)).toBe("encerra em 6h");
    expect(auctionCountdown(inHours(48), NOW)).toBe("encerra em 2 dias");
    expect(auctionCountdown(inHours(25), NOW)).toBe("encerra em 1 dia");
  });

  it("is null for a missing, invalid or past date", () => {
    expect(auctionCountdown(null, NOW)).toBeNull();
    expect(auctionCountdown("not a date", NOW)).toBeNull();
    expect(auctionCountdown(inHours(-1), NOW)).toBeNull();
  });
});

describe("reasonsFor", () => {
  it("never returns more than three chips", () => {
    const p = makeProperty({
      discount: 60,
      modality: "2º Leilão",
      auctionDate: inHours(3),
      acceptsFinancing: true,
      occupancyStatus: "Desocupado",
      profile: "airbnb",
      scores: { investment: 90, airbnb: 95 },
    });
    expect(reasonsFor(p, { rail: "closing", now: NOW })).toHaveLength(3);
  });

  it("leads the goal rail with the goal score, marked", () => {
    const p = makeProperty({ scores: { investment: 70, flip: 88 } });
    const [first] = reasonsFor(p, { rail: "goal", goal: "flip", now: NOW });
    expect(first).toEqual({ key: "goal", text: "Flip 88", tone: "on" });
  });

  it("omits the discount chip on a 1ª praça listing", () => {
    const p = makeProperty({ discount: 45, modality: "1º Leilão", scores: { investment: 80 } });
    expect(reasonsFor(p, { rail: "discount", now: NOW }).map((r) => r.key)).not.toContain(
      "discount",
    );
  });

  it("keeps the discount chip when the listing is past the 1ª praça", () => {
    const p = makeProperty({ discount: 45, modality: "2º Leilão", scores: { investment: 80 } });
    expect(reasonsFor(p, { rail: "discount", now: NOW })[0]).toEqual({
      key: "discount",
      text: "45% abaixo da avaliação",
      tone: "on",
    });
  });

  it("marks the deadline as urgent", () => {
    const p = makeProperty({ auctionDate: inHours(4), scores: { investment: 70 } });
    expect(reasonsFor(p, { rail: "closing", now: NOW })[0]).toMatchObject({ tone: "hot" });
  });

  it("only claims the same region when the anchor agrees", () => {
    const p = makeProperty({ city: "Fortaleza", scores: { investment: 70 } });
    const keys = (anchorCity?: string) =>
      reasonsFor(p, { rail: "saved", anchorCity, now: NOW }).map((r) => r.key);
    expect(keys("Fortaleza")).toContain("region");
    expect(keys("Recife")).not.toContain("region");
  });

  it("shows price per m² on the budget rail", () => {
    const p = makeProperty({ saleValue: 90_000, area: 45, scores: { investment: 70 } });
    expect(reasonsFor(p, { rail: "budget", now: NOW })[0].text).toBe("R$ 2.000/m²");
  });

  it("never repeats a chip key", () => {
    const p = makeProperty({ acceptsFinancing: true, scores: { investment: 70 } });
    const keys = reasonsFor(p, { rail: "financing", now: NOW }).map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("degrades to an empty list when nothing is known", () => {
    expect(reasonsFor(makeProperty(), { rail: "saved", now: NOW })).toEqual([]);
  });
});

describe("heroReasons", () => {
  it("leads with the investment score and caps at five lines", () => {
    const p = makeProperty({
      discount: 55,
      modality: "2º Leilão",
      appraisedValue: 200_000,
      auctionDate: inHours(10),
      occupancyStatus: "Desocupado",
      profile: "family",
      visualScore: 82,
      scores: { investment: 88, family: 91 },
    });
    const out = heroReasons(p, NOW);
    expect(out[0].strong).toBe("Nota 88 de 100");
    expect(out.length).toBeLessThanOrEqual(5);
  });

  it("does not claim a discount on a 1ª praça listing", () => {
    const p = makeProperty({
      discount: 55,
      modality: "1º Leilão",
      appraisedValue: 200_000,
      scores: { investment: 88 },
    });
    expect(heroReasons(p, NOW).some((r) => r.strong.includes("abaixo da avaliação"))).toBe(false);
  });
});
