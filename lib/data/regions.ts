import { supabase } from "@/lib/supabase";
import { titleCase } from "@/lib/format";
import { streetOf } from "@/lib/geo";
import {
  regionComboKey,
  regionTags,
  REGION_SORT_KEYS,
  type RegionInsightKey,
  type RegionListItem,
  type RegionsIndex,
  type RegionSortKey,
} from "@/lib/region";
import type { Region } from "@/lib/types";
import { cached, DETAIL_REVALIDATE, num, REVALIDATE, rows, withRetry } from "./client";

function mapScores(s: any): Region["scores"] {
  return {
    convenience: num(s?.convenience),
    walkability: num(s?.walkability),
    commercial: num(s?.commercial),
    airbnb: num(s?.airbnb),
    student: num(s?.student),
    family: num(s?.family),
  };
}

// /regions ranks ~9k cells by a blend of the sort keys. Shipping them all to the browser
// cost megabytes, so the rankings for every possible chip combination are built here and
// only the regions that actually surface are serialized.
const RANK_LIMIT = 30;

const slim = (r: Region): RegionListItem => ({
  h3: r.h3,
  name: r.name,
  city: r.city,
  subLabel: r.subLabel,
  numProps: r.numProps,
  scores: r.scores,
  tags: regionTags(r),
});

// Share of the population strictly below each value, in [0, 1]. A value's first index in
// the sorted array is exactly the count of values below it.
function percentiles(values: number[]): number[] {
  const n = values.length;
  const below = new Map<number, number>();
  [...values]
    .sort((a, b) => a - b)
    .forEach((v, i) => {
      if (!below.has(v)) below.set(v, i);
    });
  return values.map((v) => (n > 1 ? below.get(v)! / (n - 1) : 1));
}

function buildIndex(regions: Region[]): RegionsIndex {
  const ranked = regions.filter((r) => r.numProps > 0);

  const pct = new Map<RegionSortKey, number[]>();
  for (const k of REGION_SORT_KEYS) {
    pct.set(
      k,
      percentiles(ranked.map((r) => (k === "numProps" ? r.numProps : (r.scores[k] ?? 0)))),
    );
  }

  const items: RegionListItem[] = [];
  const indexOf = new Map<string, number>();
  const intern = (r: Region) => {
    const known = indexOf.get(r.h3);
    if (known != null) return known;
    const i = items.push(slim(r)) - 1;
    indexOf.set(r.h3, i);
    return i;
  };

  const rankings: Record<string, number[]> = {};
  const blended = new Float64Array(ranked.length);
  // 15 combinations for 4 keys; keep the key list short or this grows as 2^n.
  for (let mask = 1; mask < 1 << REGION_SORT_KEYS.length; mask++) {
    const keys = REGION_SORT_KEYS.filter((_, i) => mask & (1 << i));
    // Summed, not averaged: the divisor is constant within a combo, so the order is the same.
    blended.fill(0);
    for (const k of keys) {
      const p = pct.get(k)!;
      for (let i = 0; i < blended.length; i++) blended[i] += p[i];
    }
    rankings[regionComboKey(keys)] = [...ranked.keys()]
      .sort((a, b) => blended[b] - blended[a] || ranked[b].numProps - ranked[a].numProps)
      .slice(0, RANK_LIMIT)
      .map((i) => intern(ranked[i]));
  }

  const bestBy = (field: RegionInsightKey) => {
    let top: Region | null = null;
    for (const r of regions) {
      if (!top || (r.scores[field] ?? 0) > (top.scores[field] ?? 0)) top = r;
    }
    return top ? intern(top) : null;
  };

  return {
    total: regions.length,
    totalProps: regions.reduce((s, r) => s + r.numProps, 0),
    items,
    rankings,
    best: {
      airbnb: bestBy("airbnb"),
      student: bestBy("student"),
      family: bestBy("family"),
      convenience: bestBy("convenience"),
      commercial: bestBy("commercial"),
    },
  };
}

const hasProfile = (r: any) =>
  r.convenience != null ||
  r.walkability != null ||
  r.commercial != null ||
  r.airbnb != null ||
  r.student != null ||
  r.family != null;

const PAGE = 1000;

const regionIndexPage = (i: number, count?: "exact") =>
  withRetry(() =>
    supabase
      .rpc("region_index", {}, count ? { count } : undefined)
      .order("h3")
      .range(i * PAGE, (i + 1) * PAGE - 1),
  );

async function loadRegionsIndex(): Promise<Region[]> {
  // region_index() joins cells + scores + dna + counts server-side; page it in parallel
  // since PostgREST caps each response at 1000 rows. Page 0 carries the total, so sizing
  // the fanout costs no extra query.
  const firstPage = await regionIndexPage(0, "exact");
  const total = (firstPage as { count?: number | null }).count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const restPages = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => regionIndexPage(i + 1)),
  );
  const idxRows = [firstPage, ...restPages].flatMap((r) => rows<any>("region_index", r));

  const regions = idxRows.filter(hasProfile).map((r): Region => ({
    h3: r.h3,
    name: r.neighborhood_label ?? "Região",
    city: titleCase(r.city ?? ""),
    subLabel: streetOf(r.sub_label),
    numProps: Number(r.num_props ?? 0),
    scores: mapScores(r),
    dna: (r.dna as Region["dna"]) ?? null,
    topTags: (r.top_tags as string[]) ?? [],
    summary: null,
    counts: {},
    nearest: {},
    neighbors: [],
  }));

  // Keep the sub-label only where it disambiguates same-named regions.
  const byName = new Map<string, Region[]>();
  for (const r of regions) {
    const key = `${r.city}||${r.name}`;
    const group = byName.get(key);
    if (group) group.push(r);
    else byName.set(key, [r]);
  }
  for (const group of byName.values()) {
    if (group.length < 2) for (const r of group) r.subLabel = null;
  }
  return regions;
}

// Module-level rather than unstable_cache, so the refresh can happen off the request path.
let regionsCache: { at: number; promise: Promise<RegionsIndex> } | null = null;
let refreshing = false;

function loadRegions(): Promise<RegionsIndex> {
  return loadRegionsIndex().then(buildIndex);
}

export function getRegions(): Promise<RegionsIndex> {
  const now = Date.now();
  if (!regionsCache) {
    regionsCache = {
      at: now,
      promise: loadRegions().catch((e) => {
        regionsCache = null;
        throw e;
      }),
    };
  } else if (now - regionsCache.at > REVALIDATE * 1000 && !refreshing) {
    // Serve the stale index and swap it in once the refresh lands, so nobody waits
    // out the ~10 round trips just because the TTL expired on their request.
    refreshing = true;
    loadRegions()
      .then((index) => {
        regionsCache = { at: Date.now(), promise: Promise.resolve(index) };
      })
      .catch(() => {
        // Back off a full TTL; otherwise a failing DB gets retried on every request.
        if (regionsCache) regionsCache.at = Date.now();
      })
      .finally(() => {
        refreshing = false;
      });
  }
  return regionsCache.promise;
}

// region_stats_mv (0089) carries the cell, its scores, its dna and a precomputed num_props and
// sub_label, one row per region_cells row. It folds in two round trips, and its count replaces
// the full-corpus count RPC this used to run on every property detail render.
const REGION_COLS =
  "h3,city,neighborhood_label,sub_label,num_props,dna,top_tags," +
  "convenience,walkability,commercial,airbnb,student,family";

async function loadRegion(h3: string): Promise<Region | null> {
  const [statsRes, dnaRes, featRes, nbRes] = await Promise.all([
    withRetry(() => supabase.from("region_stats_mv").select(REGION_COLS).eq("h3", h3).limit(1)),
    withRetry(() => supabase.from("region_dna").select("summary_text").eq("h3", h3).limit(1)),
    withRetry(() =>
      supabase
        .from("region_features")
        .select("features")
        .eq("feature_version", 1)
        .eq("h3", h3)
        .limit(1),
    ),
    withRetry(() =>
      supabase
        .from("region_neighbors")
        .select("neighbor_h3,similarity,rank")
        .eq("h3", h3)
        .order("rank")
        .limit(3),
    ),
  ]);

  const cell = rows<any>("region_stats_mv", statsRes)[0];
  // Stands in for the region_scores row this used to probe for; /regions applies the same test.
  if (!cell || !hasProfile(cell)) return null;

  const d = rows<any>("region_dna", dnaRes)[0];
  const feat = (rows<any>("region_features", featRes)[0]?.features ?? {}) as {
    counts?: Record<string, number>;
    nearest_m?: Record<string, number>;
  };

  const nbRows = rows<any>("region_neighbors", nbRes);
  let neighbors: Region["neighbors"] = [];
  if (nbRows.length) {
    const nbCellsRes = await withRetry(() =>
      supabase
        .from("region_cells")
        .select("h3,city,neighborhood_label")
        .in(
          "h3",
          nbRows.map((n) => n.neighbor_h3),
        ),
    );
    const nbCellMap = new Map(rows<any>("region_cells", nbCellsRes).map((c) => [c.h3, c]));
    neighbors = nbRows.map((n) => {
      const c = nbCellMap.get(n.neighbor_h3);
      return {
        h3: n.neighbor_h3,
        similarity: Number(n.similarity),
        name: c?.neighborhood_label ?? "Região",
        city: titleCase(c?.city ?? ""),
      };
    });
  }

  return {
    h3: cell.h3,
    name: cell.neighborhood_label ?? "Região",
    city: titleCase(cell.city ?? ""),
    // Already null unless the (city, label) pair repeats - the MV applies that test itself.
    subLabel: streetOf(cell.sub_label),
    numProps: Number(cell.num_props ?? 0),
    scores: mapScores(cell),
    dna: (cell.dna as Region["dna"]) ?? null,
    topTags: (cell.top_tags as string[]) ?? [],
    summary: d?.summary_text ?? null,
    counts: feat.counts ?? {},
    nearest: feat.nearest_m ?? {},
    neighbors,
  };
}

export const getRegion = cached(loadRegion, "region", DETAIL_REVALIDATE);

async function loadRegionLabel(h3: string): Promise<string | null> {
  const res = await withRetry(() =>
    supabase.from("region_cells").select("city,neighborhood_label").eq("h3", h3).limit(1),
  );
  const cell = rows<any>("region_cells", res)[0];
  if (!cell) return null;
  return `${cell.neighborhood_label ?? "Região"} · ${titleCase(cell.city ?? "")}`;
}

export const getRegionLabel = cached(loadRegionLabel, "region-label", DETAIL_REVALIDATE);
