import { supabase } from "@/lib/supabase";
import { titleCase } from "@/lib/format";
import { dominantStreet } from "@/lib/geo";
import type { Region } from "@/lib/types";
import { cached, fetchAllRows, num, REVALIDATE, rows, withRetry } from "./client";
import { countProperties } from "./propertyList";

const SCORE_COLS = "h3,convenience,walkability,commercial,airbnb,student,family";

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

async function regionPropertyCounts(): Promise<Map<string, number>> {
  const res = await withRetry(() => supabase.rpc("region_property_counts"));
  return new Map(rows<any>("region_property_counts", res).map((r) => [r.h3, Number(r.n)]));
}

// raw_address of listable properties in the given cells, for street disambiguation.
async function addressesByCell(
  h3s: string[],
): Promise<Map<string, { rawAddress: string | null }[]>> {
  const map = new Map<string, { rawAddress: string | null }[]>();
  for (let i = 0; i < h3s.length; i += 100) {
    const chunk = h3s.slice(i, i + 100);
    const batch = await fetchAllRows<any>("property_list_mv-addresses", (f, t) =>
      supabase
        .from("property_list_mv")
        .select("h3_r8,raw_address")
        .in("h3_r8", chunk)
        .eq("is_listable", true)
        .order("property_id")
        .range(f, t),
    );
    for (const r of batch) {
      const g = map.get(r.h3_r8);
      const item = { rawAddress: r.raw_address || null };
      if (g) g.push(item);
      else map.set(r.h3_r8, [item]);
    }
  }
  return map;
}

// Slim list for /regions: no features/summary/neighbors. Module-level TTL cache
// because the payload can exceed unstable_cache's 2MB limit.
async function loadRegionsIndex(): Promise<Region[]> {
  const [cells, scoreRows, dnaRows, counts] = await Promise.all([
    fetchAllRows<any>("region_cells", (f, t) =>
      supabase.from("region_cells").select("h3,city,neighborhood_label").order("h3").range(f, t),
    ),
    fetchAllRows<any>("region_scores", (f, t) =>
      supabase
        .from("region_scores")
        .select(SCORE_COLS)
        .eq("score_version", 1)
        .order("h3")
        .range(f, t),
    ),
    fetchAllRows<any>("region_dna", (f, t) =>
      supabase.from("region_dna").select("h3,dna,top_tags").order("h3").range(f, t),
    ),
    regionPropertyCounts(),
  ]);

  const scoreMap = new Map(scoreRows.map((s) => [s.h3, s]));
  const dnaMap = new Map(dnaRows.map((d) => [d.h3, d]));

  const regions = cells
    .filter((c) => scoreMap.has(c.h3))
    .map((c): Region => {
      const d = dnaMap.get(c.h3);
      return {
        h3: c.h3,
        name: c.neighborhood_label ?? "Região",
        city: titleCase(c.city ?? ""),
        subLabel: null,
        numProps: counts.get(c.h3) ?? 0,
        scores: mapScores(scoreMap.get(c.h3)),
        dna: (d?.dna as Region["dna"]) ?? null,
        topTags: (d?.top_tags as string[]) ?? [],
        summary: null,
        counts: {},
        nearest: {},
        neighbors: [],
      };
    });

  // Disambiguate cells sharing city + name by their dominant street.
  const byName = new Map<string, Region[]>();
  for (const r of regions) {
    const key = `${r.city}||${r.name}`;
    const group = byName.get(key);
    if (group) group.push(r);
    else byName.set(key, [r]);
  }
  const dupH3s = [...byName.values()]
    .filter((g) => g.length > 1)
    .flat()
    .map((r) => r.h3);
  if (dupH3s.length) {
    const addrs = await addressesByCell(dupH3s);
    for (const group of byName.values()) {
      if (group.length < 2) continue;
      for (const r of group) r.subLabel = dominantStreet(addrs.get(r.h3) ?? []);
    }
  }
  return regions;
}

let regionsCache: { at: number; promise: Promise<Region[]> } | null = null;

export function getRegions(): Promise<Region[]> {
  const now = Date.now();
  if (!regionsCache || now - regionsCache.at > REVALIDATE * 1000) {
    const promise = loadRegionsIndex().catch((e) => {
      regionsCache = null;
      throw e;
    });
    regionsCache = { at: now, promise };
  }
  return regionsCache.promise;
}

async function loadRegion(h3: string): Promise<Region | null> {
  const [cellRes, scoreRes, dnaRes, featRes, nbRes, numProps] = await Promise.all([
    withRetry(() =>
      supabase.from("region_cells").select("h3,city,neighborhood_label").eq("h3", h3).limit(1),
    ),
    withRetry(() =>
      supabase
        .from("region_scores")
        .select(SCORE_COLS)
        .eq("score_version", 1)
        .eq("h3", h3)
        .limit(1),
    ),
    withRetry(() =>
      supabase.from("region_dna").select("h3,dna,top_tags,summary_text").eq("h3", h3).limit(1),
    ),
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
    countProperties({ h3 }),
  ]);

  const cell = rows<any>("region_cells", cellRes)[0];
  const score = rows<any>("region_scores", scoreRes)[0];
  if (!cell || !score) return null;

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

  let subLabel: string | null = null;
  const dupRes = await withRetry(() =>
    supabase
      .from("region_cells")
      .select("h3")
      .eq("city", cell.city)
      .eq("neighborhood_label", cell.neighborhood_label)
      .limit(2),
  );
  if (rows<any>("region_cells", dupRes).length > 1) {
    const addrs = await addressesByCell([h3]);
    subLabel = dominantStreet(addrs.get(h3) ?? []);
  }

  return {
    h3: cell.h3,
    name: cell.neighborhood_label ?? "Região",
    city: titleCase(cell.city ?? ""),
    subLabel,
    numProps,
    scores: mapScores(score),
    dna: (d?.dna as Region["dna"]) ?? null,
    topTags: (d?.top_tags as string[]) ?? [],
    summary: d?.summary_text ?? null,
    counts: feat.counts ?? {},
    nearest: feat.nearest_m ?? {},
    neighbors,
  };
}

export const getRegion = cached(loadRegion, "region");

async function loadRegionLabel(h3: string): Promise<string | null> {
  const res = await withRetry(() =>
    supabase.from("region_cells").select("city,neighborhood_label").eq("h3", h3).limit(1),
  );
  const cell = rows<any>("region_cells", res)[0];
  if (!cell) return null;
  return `${cell.neighborhood_label ?? "Região"} · ${titleCase(cell.city ?? "")}`;
}

export const getRegionLabel = cached(loadRegionLabel, "region-label");
