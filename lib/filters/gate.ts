import { PATH_FEATURE, VIEW_FEATURE } from "@/lib/entitlements";
import type { Entitlements, Feature } from "@/lib/entitlements";
import { parsePropertySearchParams } from "./propertiesUrl";
import type { AlertCriteria, AlertCriteriaSet, PropertyFilters } from "@/lib/types";

// Filters travel as PropertyFilters (parsed URL) and as AlertCriteriaSet (persisted criteria);
// the free ones are spelled the same in both. An allowlist, so a filter added later is gated
// until it is deliberately opened rather than leaking to every plan.
const FREE = new Set(["q", "uf", "city", "type", "modalities", "h3"]);

const featureFor = (key: string): Feature =>
  key === "clusterId" || key === "cluster_id" ? "groups" : "advancedFilters";

function gate<T extends object>(input: T, ent: Entitlements): { allowed: T; locked: Feature[] } {
  const allowed = { ...input };
  const locked = new Set<Feature>();

  for (const key of Object.keys(allowed) as (keyof T & string)[]) {
    if (FREE.has(key) || allowed[key] === undefined) continue;
    const feature = featureFor(key);
    if (ent.can(feature)) continue;
    locked.add(feature);
    delete allowed[key];
  }

  return { allowed, locked: [...locked] };
}

/** A deep link carries the same filters the drawer builds, so the plan has to be enforced on the
 *  parsed query too - otherwise any rail or shared URL hands a locked filter to a lower plan. */
export function gateFilters(filters: PropertyFilters, ent: Entitlements) {
  const { allowed, locked } = gate(filters, ent);
  return { filters: allowed, lockedFilters: locked };
}

/** Enforced on the way in because criteria outlive the request. Not a guarantee on its own: a
 *  role can expire after the write, which is why the batch mailer re-checks before sending. */
export const gateCriteria = (c: AlertCriteria, ent: Entitlements): AlertCriteria =>
  "any" in c
    ? { any: c.any.map((set) => gate(set, ent).allowed) }
    : (gate(c as AlertCriteriaSet, ent).allowed as AlertCriteria);

/** null when the plan cannot use what the destination carries: a "ver todos" that silently drops
 *  half the filters, or lands on an upgrade wall, is worse than no link at all. */
export function unlockedHref(href: string, ent: Entitlements): string | null {
  const [path, query] = href.split("?");

  const pathFeature = PATH_FEATURE[path];
  if (pathFeature && !ent.can(pathFeature)) return null;
  if (!query) return href;

  const sp = Object.fromEntries(new URLSearchParams(query));
  const { filters, view } = parsePropertySearchParams(sp);
  const viewFeature = VIEW_FEATURE[view];
  if (viewFeature && !ent.can(viewFeature)) return null;

  return gateFilters(filters, ent).lockedFilters.length ? null : href;
}
