import { supabase } from "@/lib/supabase";
import type { PriceHistoryPoint, Recommendation, ScoreExplain, ScoreTerm } from "@/lib/types";
import { cached, num, rows, withRetry } from "./client";

const dashless = (s: string) => s.replace(/[—–]/g, "-");
const IMPACTS = ["ajuda", "neutro", "pesa"];

// The `components` JSONB is heavy, so it is fetched per-property rather than
// joined into the bulk properties result.
async function loadScoreExplain(id: string): Promise<ScoreExplain | null> {
  const res = await withRetry(() =>
    supabase
      .from("property_scores")
      .select("components")
      .eq("property_id", id)
      .eq("score_version", 1)
      .limit(1),
  );
  const inv = rows<any>("property-score-explain", res)[0]?.components?.investment;
  if (!Array.isArray(inv)) return null;

  let summary: string | null = null;
  const terms: ScoreTerm[] = [];
  for (const c of inv) {
    if (!c || c.available === false) continue;
    if (c.feature === "resumo") {
      summary = c.text ? dashless(c.text) : null;
    } else if (c.label && IMPACTS.includes(c.impact)) {
      terms.push({
        feature: String(c.feature ?? ""),
        label: String(c.label),
        detail: c.detail ? dashless(c.detail) : null,
        impact: c.impact,
        weight: num(c.weight),
        contribution: num(c.contribution),
      });
    }
  }
  if (!summary && !terms.length) return null;
  terms.sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0));
  return { summary, terms };
}

export const getScoreExplain = cached(loadScoreExplain, "property-score-explain");

async function loadPriceHistory(id: string): Promise<PriceHistoryPoint[]> {
  const res = await withRetry(() =>
    supabase
      .from("listings")
      .select("appraised_value,sale_value,discount,modality,auction_date,snapshot_date")
      .eq("property_id", id)
      .order("snapshot_date", { ascending: true }),
  );

  const raw = rows<any>("price-history", res)
    .filter((l) => l.snapshot_date && l.sale_value != null)
    .map((l) => ({
      date: String(l.snapshot_date),
      saleValue: num(l.sale_value),
      appraisedValue: num(l.appraised_value),
      discount: num(l.discount),
      modality: l.modality || null,
    }));

  // Drop interior snapshots whose price and modality didn't change so the chart shows real
  // movements rather than scraping cadence, but always keep the first and last.
  const out: PriceHistoryPoint[] = [];
  for (let i = 0; i < raw.length; i++) {
    const prev = out[out.length - 1];
    const isLast = i === raw.length - 1;
    const same = prev && prev.saleValue === raw[i].saleValue && prev.modality === raw[i].modality;
    if (same && !isLast) continue;
    out.push(raw[i]);
  }
  return out;
}

export const getPriceHistory = cached(loadPriceHistory, "price-history");

async function loadRecommendations(id: string): Promise<Recommendation[]> {
  const res = await withRetry(() =>
    supabase
      .from("property_recommendations")
      .select("kind,rank,similarity,rec_property_id")
      .eq("property_id", id)
      .order("rank", { ascending: true }),
  );
  return rows<any>("property-recommendations", res)
    .filter((r) => r.kind === "similar" || r.kind === "visual")
    .map((r) => ({
      recId: String(r.rec_property_id),
      kind: r.kind as Recommendation["kind"],
      rank: num(r.rank) ?? 0,
      similarity: num(r.similarity),
    }));
}

export const getRecommendations = cached(loadRecommendations, "property-recommendations");
