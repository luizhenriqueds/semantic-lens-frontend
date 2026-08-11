"use server";

import { headers } from "next/headers";
import { getAlert } from "@/lib/data/alerts";
import {
  getClusters,
  getMatchedForExport,
  getPropertiesByIds,
  getPropertiesForExport,
  hybridSearch,
  isListable,
} from "@/lib/data";
import { criteriaLabels, describeCriteria, hasAnyCriteria, isAnyCriteria } from "@/lib/alerts";
import { spreadByLocality } from "@/lib/diversify";
import { toRpcFilters } from "@/lib/filters/contract";
import { sortProperties, type SearchSort } from "@/lib/searchSort";
import { getEntitlements } from "@/lib/entitlements/server";
import { isRateLimitError, withinQuota } from "@/lib/ratelimit/guards";
import { requireUser } from "@/lib/supabase/server";
import { EXPORT_ROW_CAP, exportFilename, propertiesToCsv, type ExportFailure } from "@/lib/export";
import type { AlertCriteria, Property, PropertyFilters, PropertySort } from "@/lib/types";

export type ExportResult =
  | { ok: true; filename: string; csv: string; total: number; truncated: boolean }
  | { ok: false; reason: ExportFailure };

// The real gate: `require("export")` runs in the browser and this action is reachable directly.
async function guard(): Promise<
  { ok: true; origin?: string } | { ok: false; reason: ExportFailure }
> {
  try {
    await requireUser();
  } catch {
    return { ok: false, reason: "auth" };
  }
  const ent = await getEntitlements();
  if (!ent.can("export")) return { ok: false, reason: "plan" };
  // After the plan check, so a rejected free user never burns a paying account's budget.
  if (!(await withinQuota("export"))) return { ok: false, reason: "rate" };
  return { ok: true, origin: (await headers()).get("origin") ?? undefined };
}

function build(
  rows: Property[],
  total: number,
  base: string,
  label: string | null,
  origin?: string,
): ExportResult {
  if (!rows.length) return { ok: false, reason: "empty" };
  return {
    ok: true,
    filename: exportFilename(base, { label, date: new Date(), ext: "csv" }),
    csv: propertiesToCsv(rows, { origin }),
    total,
    truncated: total > rows.length,
  };
}

export async function exportPropertiesCsv(
  filters: PropertyFilters,
  sort: PropertySort,
): Promise<ExportResult> {
  const gate = await guard();
  if (!gate.ok) return gate;

  // No unfiltered dumps of the whole base: the UI hides the button, and this is what enforces it.
  const rpc = toRpcFilters(filters);
  if (!hasAnyCriteria(rpc)) return { ok: false, reason: "filter" };

  // The read throws on a failed query rather than resolving empty, so "nothing matched" and
  // "the query never ran" stay distinguishable in the toast.
  const page = await getPropertiesForExport(filters, sort, EXPORT_ROW_CAP).catch(() => null);
  if (!page) return { ok: false, reason: "error" };
  return build(page.items, page.total, "imoveis", await criteriaLabel(rpc), gate.origin);
}

export async function exportSearchCsv(query: string, sort: SearchSort): Promise<ExportResult> {
  const gate = await guard();
  if (!gate.ok) return gate;

  const q = query.trim();
  if (!q) return { ok: false, reason: "empty" };

  // Mirrors SearchResults so the file matches what the user sees; hybridSearch is cached.
  let items: Property[];
  try {
    const result = await hybridSearch(q);
    const found = result.items ?? (await getPropertiesByIds(result.hits.map((h) => h.id)));
    const byId = new Map(found.filter((p) => isListable(p)).map((p) => [p.id, p]));
    items = spreadByLocality(
      result.hits.map((h) => byId.get(h.id)).filter((p): p is Property => p != null),
    );
  } catch (err) {
    return { ok: false, reason: isRateLimitError(err) ? "rate" : "error" };
  }

  const ordered = sortProperties(items, sort);
  return build(ordered, ordered.length, "busca", q, gate.origin);
}

export async function exportAlertMatchesCsv(
  alertId: string,
  sort: PropertySort,
): Promise<ExportResult> {
  const gate = await guard();
  if (!gate.ok) return gate;

  // RLS scopes the row, so one account cannot read another's alert.
  const { supabase } = await requireUser();
  const alert = await getAlert(supabase, alertId);
  if (!alert?.criteria || isAnyCriteria(alert.criteria)) return { ok: false, reason: "empty" };

  const page = await getMatchedForExport(alert.criteria, sort, EXPORT_ROW_CAP).catch(() => null);
  if (!page) return { ok: false, reason: "error" };
  const label = alert.name || (await criteriaLabel(alert.criteria));
  return build(page.items, page.total, "alerta", label, gate.origin);
}

// describeCriteria answers "Novos imóveis" for an empty set - alert language, wrong on a file.
// Labelled like every screen is, so a collection-filtered file is not named "coleção".
async function criteriaLabel(c: AlertCriteria): Promise<string | null> {
  if (!hasAnyCriteria(c)) return null;
  return describeCriteria(c, criteriaLabels(await getClusters()));
}
