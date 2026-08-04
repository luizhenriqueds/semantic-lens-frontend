import { investmentScore, money, PROFILE_SHORT, scoreForProfile, showDiscount } from "@/lib/format";
import { auctionInstant } from "@/lib/auctionTime";
import { moneyM2 } from "@/lib/market";
import type { ProfileKey, Property } from "@/lib/types";
import { isVacant } from "./occupancy";

// Chips say why this rail surfaced the card, so they change per rail: the deadline rail
// says "encerra em 6h", the budget rail the price per m².
const MAX_CHIPS = 3;

export type ReasonTone = "plain" | "on" | "hot";
export type Reason = { key: string; text: string; tone: ReasonTone };

export type RailKind =
  | "saved"
  | "closing"
  | "goal"
  | "discount"
  | "budget"
  | "vacant"
  | "financing"
  | "modality-change"
  | "payment-change"
  | "price-drop";

export type ReasonContext = {
  rail: RailKind;
  goal?: ProfileKey;
  anchorCity?: string;
  // Injected rather than read from the clock, so the countdown thresholds are testable.
  now: Date;
};

const HOUR = 3_600_000;

export function auctionCountdown(iso: string | null, now: Date): string | null {
  // Read straight, the stored value is three hours early - see lib/auctionTime.
  const t = auctionInstant(iso);
  if (t == null) return null;
  const hours = (t - now.getTime()) / HOUR;
  if (hours < 0) return null;
  if (hours < 1) return "encerra em menos de 1h";
  if (hours < 24) return `encerra em ${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `encerra em ${days} dia${days > 1 ? "s" : ""}`;
}

function scoreReason(p: Property, label = "Nota"): Reason | null {
  const n = investmentScore(p);
  if (n == null) return null;
  return { key: "score", text: `${label} ${Math.round(n)}`, tone: n >= 80 ? "on" : "plain" };
}

// `discount` on a 1ª praça listing is the gap to the appraisal, not a markdown.
function discountReason(p: Property): Reason | null {
  if (!showDiscount(p)) return null;
  return { key: "discount", text: `${Math.round(p.discount!)}% abaixo da avaliação`, tone: "on" };
}

function pricePerM2Reason(p: Property): Reason | null {
  if (p.saleValue == null || !p.area) return null;
  return { key: "m2", text: moneyM2(p.saleValue / p.area), tone: "plain" };
}

export function reasonsFor(p: Property, ctx: ReasonContext): Reason[] {
  const out: (Reason | null)[] = [];

  switch (ctx.rail) {
    case "goal": {
      const v = ctx.goal ? scoreForProfile(p, ctx.goal) : null;
      if (ctx.goal && v != null) {
        out.push({ key: "goal", text: `${PROFILE_SHORT[ctx.goal]} ${Math.round(v)}`, tone: "on" });
      }
      out.push(scoreReason(p, "Nota geral"));
      break;
    }
    case "closing": {
      const dl = auctionCountdown(p.auctionDate, ctx.now);
      if (dl) out.push({ key: "deadline", text: dl, tone: "hot" });
      out.push(scoreReason(p), discountReason(p));
      break;
    }
    case "discount":
      out.push(discountReason(p), scoreReason(p));
      break;
    case "budget":
      out.push(pricePerM2Reason(p), scoreReason(p));
      break;
    case "vacant":
      out.push({ key: "vacant", text: "Desocupado", tone: "on" }, scoreReason(p));
      break;
    case "financing":
      out.push({ key: "financing", text: "Aceita financiamento", tone: "on" }, scoreReason(p));
      break;
    // The change log records that one of the two started, not which.
    case "payment-change": {
      const how = [p.acceptsFinancing && "financiamento", p.acceptsFgts && "FGTS"]
        .filter(Boolean)
        .join("/");
      out.push({ key: "financing", text: `Passou a aceitar ${how}`, tone: "on" }, scoreReason(p));
      break;
    }
    case "modality-change":
      if (p.modality) out.push({ key: "modality", text: `Agora: ${p.modality}`, tone: "on" });
      out.push(scoreReason(p), discountReason(p));
      break;
    // The log records that a drop happened, not by how much, so the chip cannot name a value.
    case "price-drop":
      out.push(
        { key: "price-drop", text: "Preço reduzido", tone: "hot" },
        discountReason(p),
        scoreReason(p),
      );
      break;
    case "saved":
      if (ctx.anchorCity && p.city === ctx.anchorCity) {
        out.push({ key: "region", text: "Mesma região", tone: "plain" });
      }
      out.push(scoreReason(p), discountReason(p));
      break;
  }

  // Fill leftover slots with whatever else is true, weakest signals last.
  out.push(
    p.acceptsFinancing ? { key: "financing", text: "Aceita financiamento", tone: "plain" } : null,
    isVacant(p.occupancyStatus) ? { key: "vacant", text: "Desocupado", tone: "plain" } : null,
    p.profile
      ? { key: "profile", text: `Ideal p/ ${PROFILE_SHORT[p.profile]}`, tone: "plain" }
      : null,
  );

  const seen = new Set<string>();
  const chips: Reason[] = [];
  for (const r of out) {
    if (!r || seen.has(r.key)) continue;
    seen.add(r.key);
    chips.push(r);
    if (chips.length === MAX_CHIPS) break;
  }
  return chips;
}

// The hero is full-width, so it gets sentences rather than chips.
export function heroReasons(p: Property, now: Date): { strong: string; lead: string }[] {
  const out: { strong: string; lead: string }[] = [];

  const nota = investmentScore(p);
  if (nota != null) {
    out.push({
      strong: `Nota ${Math.round(nota)} de 100`,
      lead: " - está entre os melhores da base nesta rodada.",
    });
  }
  if (showDiscount(p) && p.appraisedValue != null) {
    out.push({
      strong: `${Math.round(p.discount!)}% abaixo da avaliação oficial`,
      lead: ` (${money(p.appraisedValue)}).`,
    });
  }
  if (isVacant(p.occupancyStatus)) {
    out.push({ strong: "Desocupado", lead: " - sem custo nem prazo de desocupação." });
  } else if (p.occupancyStatus) {
    out.push({
      strong: "Imóvel ocupado",
      lead: " - considere o prazo de desocupação antes de arrematar.",
    });
  }
  if (p.profile) {
    const v = scoreForProfile(p, p.profile);
    out.push({
      strong: `Melhor uso: ${PROFILE_SHORT[p.profile]}`,
      lead: v != null ? ` (nota ${Math.round(v)}).` : ".",
    });
  }
  const dl = auctionCountdown(p.auctionDate, now);
  if (dl) {
    out.push({
      strong: dl.charAt(0).toUpperCase() + dl.slice(1),
      lead: p.modality ? ` · ${p.modality}.` : ".",
    });
  }
  return out.slice(0, 5);
}
