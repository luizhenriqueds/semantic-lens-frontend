import { supabase } from "@/lib/supabase";
import { titleCase } from "@/lib/format";
import { dominantStreet } from "@/lib/geo";
import type { Property, Region } from "@/lib/types";
import { cached, num, rows, withRetry } from "./client";
import { getProperties } from "./properties";

async function loadRegions(): Promise<Region[]> {
  const [props, [cellsRes, scoresRes, dnaRes, featuresRes, neighborsRes]] = await Promise.all([
    getProperties(),
    Promise.all([
      withRetry(() =>
        supabase.from("region_cells").select("h3,city,neighborhood_label,num_properties"),
      ),
      withRetry(() =>
        supabase
          .from("region_scores")
          .select("h3,convenience,walkability,commercial,airbnb,student,family")
          .eq("score_version", 1),
      ),
      withRetry(() => supabase.from("region_dna").select("h3,dna,top_tags,summary_text")),
      withRetry(() =>
        supabase.from("region_features").select("h3,features").eq("feature_version", 1),
      ),
      withRetry(() => supabase.from("region_neighbors").select("h3,neighbor_h3,similarity,rank")),
    ]),
  ]);

  // region_cells.num_properties is a pipeline snapshot that drifts from the live listings, so
  // count the active properties actually joined to each cell instead.
  const liveCount = new Map<string, number>();
  const propsByH3 = new Map<string, Property[]>();
  for (const p of props) {
    if (!p.h3 || p.inactive) continue;
    liveCount.set(p.h3, (liveCount.get(p.h3) ?? 0) + 1);
    const g = propsByH3.get(p.h3);
    if (g) g.push(p);
    else propsByH3.set(p.h3, [p]);
  }

  const cells = rows<any>("region_cells", cellsRes);
  const cellMap = new Map(cells.map((c) => [c.h3, c]));
  const scoreMap = new Map(rows<any>("region_scores", scoresRes).map((s) => [s.h3, s]));
  const dnaMap = new Map(rows<any>("region_dna", dnaRes).map((d) => [d.h3, d]));
  const featMap = new Map(rows<any>("region_features", featuresRes).map((f) => [f.h3, f.features]));
  const neighborMap = new Map<string, any[]>();
  for (const n of rows<any>("region_neighbors", neighborsRes)) {
    if (!neighborMap.has(n.h3)) neighborMap.set(n.h3, []);
    neighborMap.get(n.h3)!.push(n);
  }

  const nameOf = (h3: string) => {
    const c = cellMap.get(h3);
    return { name: c?.neighborhood_label ?? "Região", city: titleCase(c?.city ?? "") };
  };

  const regions = cells
    .filter((c) => scoreMap.has(c.h3))
    .map((c): Region => {
      const s = scoreMap.get(c.h3);
      const d = dnaMap.get(c.h3);
      const feat = (featMap.get(c.h3) ?? {}) as {
        counts?: Record<string, number>;
        nearest_m?: Record<string, number>;
      };
      const nb = (neighborMap.get(c.h3) ?? [])
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 3)
        .map((n) => ({ h3: n.neighbor_h3, similarity: n.similarity, ...nameOf(n.neighbor_h3) }));
      return {
        h3: c.h3,
        name: c.neighborhood_label ?? "Região",
        city: titleCase(c.city ?? ""),
        subLabel: null,
        numProps: liveCount.get(c.h3) ?? 0,
        scores: {
          convenience: num(s?.convenience),
          walkability: num(s?.walkability),
          commercial: num(s?.commercial),
          airbnb: num(s?.airbnb),
          student: num(s?.student),
          family: num(s?.family),
        },
        dna: (d?.dna as Region["dna"]) ?? null,
        topTags: (d?.top_tags as string[]) ?? [],
        summary: d?.summary_text ?? null,
        counts: feat.counts ?? {},
        nearest: feat.nearest_m ?? {},
        neighbors: nb,
      };
    });

  // Disambiguate cells that share a city + name by their dominant street.
  const byName = new Map<string, Region[]>();
  for (const r of regions) {
    const key = `${r.city}||${r.name}`;
    const group = byName.get(key);
    if (group) group.push(r);
    else byName.set(key, [r]);
  }
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    for (const r of group) r.subLabel = dominantStreet(propsByH3.get(r.h3) ?? []);
  }

  return regions;
}

export const getRegions = cached(loadRegions, "regions");

export async function getRegion(h3: string): Promise<Region | null> {
  const all = await getRegions();
  return all.find((r) => r.h3 === h3) ?? null;
}
