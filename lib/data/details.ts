import { supabase } from "@/lib/supabase";
import type { PriceHistoryPoint, Recommendation, ScoreExplain, ScoreTerm } from "@/lib/types";
import { cached, num, rows, withRetry } from "./client";

const dashless = (s: string) => s.replace(/[--]/g, "-");
const IMPACTS = ["ajuda", "neutro", "pesa"];

// The `components` JSONB is heavy, so it is fetched per-property rather than
// joined into the bulk properties result.
async function loadScoreExplain(id: string): Promise<ScoreExplain | null> {
  const res = await withRetry(
    () =>
      supabase
        .from("property_scores")
        .select("components")
        .eq("property_id", id)
        .eq("score_version", 1)
        .limit(1),
    { retryTimeouts: true },
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

// Heavy text kept out of property_list_mv, fetched per-id on the detail page.
// `last_seen` rides along: it is the day the batch last found the listing on Caixa.
async function loadPropertyDetailText(
  id: string,
): Promise<{ description: string | null; visualNote: string | null; lastSeen: string | null }> {
  const res = await withRetry(
    () =>
      supabase
        .from("properties")
        .select("canonical_description,visual_note,last_seen")
        .eq("property_id", id)
        .limit(1),
    { retryTimeouts: true },
  );
  const row = rows<any>("property-detail-text", res)[0];
  return {
    description: row?.canonical_description || null,
    visualNote: row?.visual_note || null,
    lastSeen: row?.last_seen || null,
  };
}

export const getPropertyDetailText = cached(loadPropertyDetailText, "property-detail-text");

// `listings` rows are intervals dated at their *last* live day; the chart wants starts, so each
// is dated from where the previous ended and `first_seen` opens the series.
async function loadPriceHistory(id: string): Promise<PriceHistoryPoint[]> {
  const [listed, prop] = await Promise.all([
    withRetry(
      () =>
        supabase
          .from("listings")
          .select("appraised_value,sale_value,discount,modality,snapshot_date")
          .eq("property_id", id)
          .order("snapshot_date", { ascending: true })
          .order("id", { ascending: true }),
      { retryTimeouts: true },
    ),
    withRetry(
      () => supabase.from("properties").select("first_seen").eq("property_id", id).limit(1),
      { retryTimeouts: true },
    ),
  ]);

  const raw = rows<any>("price-history", listed).filter(
    (l) => l.snapshot_date && l.sale_value != null,
  );
  if (!raw.length) return [];

  const firstSeen = rows<any>("price-history-first-seen", prop)[0]?.first_seen;
  const start = String(raw[0].snapshot_date);
  const opened = firstSeen && String(firstSeen) < start ? String(firstSeen) : start;

  const at = (l: any, date: string): PriceHistoryPoint => ({
    date,
    saleValue: num(l.sale_value),
    appraisedValue: num(l.appraised_value),
    discount: num(l.discount),
    modality: l.modality || null,
  });

  const out = raw.map((l, i) => at(l, i === 0 ? opened : String(raw[i - 1].snapshot_date)));

  // Closes the last interval, so a listing that never moved reads as a flat line, not a dot.
  const last = raw[raw.length - 1];
  if (String(last.snapshot_date) > out[out.length - 1].date) {
    out.push(at(last, String(last.snapshot_date)));
  }
  return out;
}

export const getPriceHistory = cached(loadPriceHistory, "price-history");

async function loadRecommendations(id: string): Promise<Recommendation[]> {
  const res = await withRetry(
    () =>
      supabase
        .from("property_recommendations")
        .select("kind,rank,similarity,rec_property_id")
        .eq("property_id", id)
        .order("rank", { ascending: true }),
    { retryTimeouts: true },
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
