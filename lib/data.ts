import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import { deriveTitle, titleCase } from "@/lib/format";
import type { Cluster, ProfileKey, Property, Region } from "@/lib/types";

const CLUSTER_RUN = "property-v1";
const REVALIDATE = 120;

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

function rows<T>(name: string, res: QueryResult<T>): T[] {
  if (res.error) {
    console.error(`[data] query "${name}" failed: ${res.error.message}`);
  }
  return res.data ?? [];
}

function pickImage(p: {
  image_source_url?: string | null;
  image_path?: string | null;
}): string | null {
  if (p.image_source_url) return p.image_source_url;
  if (p.image_path && p.image_path.startsWith("http")) return p.image_path;
  return null;
}

async function loadProperties(): Promise<Property[]> {
  const [propsRes, listingsRes, scoresRes, profilesRes, pclRes, clustersRes] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "property_id,tipo,uf,cidade,bairro,area_m2,quartos,vagas,situacao,canonical_description,h3_r8,image_path,image_source_url",
      )
      .eq("is_active", true),
    supabase
      .from("listings")
      .select(
        "property_id,valor_avaliacao,valor_venda,desconto,modalidade,data_leilao,link,snapshot_date",
      ),
    supabase
      .from("property_scores")
      .select("property_id,flip,liquidity,airbnb,student,family,commercial,convenience,investment")
      .eq("score_version", 1),
    supabase
      .from("property_profiles")
      .select("property_id,profile,score,is_primary")
      .eq("is_primary", true),
    supabase
      .from("property_clusters")
      .select("property_id,cluster_id")
      .eq("cluster_run_id", CLUSTER_RUN),
    supabase.from("clusters").select("cluster_id,label,profile").eq("cluster_run_id", CLUSTER_RUN),
  ]);

  const props = rows("properties", propsRes);
  const listingMap = new Map<string, any>();
  for (const l of rows<any>("listings", listingsRes)) {
    const cur = listingMap.get(l.property_id);
    if (!cur || (l.snapshot_date ?? "") > (cur.snapshot_date ?? "")) {
      listingMap.set(l.property_id, l);
    }
  }
  const scoreMap = new Map(rows<any>("property_scores", scoresRes).map((s) => [s.property_id, s]));
  const profileMap = new Map(
    rows<any>("property_profiles", profilesRes).map((p) => [p.property_id, p]),
  );
  const pclMap = new Map(
    rows<any>("property_clusters", pclRes).map((c) => [c.property_id, c.cluster_id]),
  );
  const clusterMap = new Map(rows<any>("clusters", clustersRes).map((c) => [c.cluster_id, c]));

  return (props as any[]).map((p): Property => {
    const l = listingMap.get(p.property_id);
    const s = scoreMap.get(p.property_id);
    const prof = profileMap.get(p.property_id);
    const cid = pclMap.get(p.property_id);
    const cl = cid != null && cid !== -1 ? clusterMap.get(cid) : undefined;
    const cidade = titleCase(p.cidade ?? "");
    return {
      id: p.property_id,
      tipo: p.tipo ?? "Imóvel",
      uf: p.uf ?? "",
      cidade,
      bairro: p.bairro ?? "",
      area: num(p.area_m2),
      quartos: num(p.quartos),
      vagas: num(p.vagas),
      situacao: p.situacao || null,
      titulo: deriveTitle(p.tipo ?? "Imóvel", num(p.quartos), p.bairro ?? ""),
      descricao: p.canonical_description || null,
      image: pickImage(p),
      aval: num(l?.valor_avaliacao),
      lance: num(l?.valor_venda),
      desc: num(l?.desconto),
      modalidade: l?.modalidade || null,
      dataLeilao: l?.data_leilao || null,
      link: l?.link || null,
      scores: {
        flip: num(s?.flip),
        liquidity: num(s?.liquidity),
        airbnb: num(s?.airbnb),
        student: num(s?.student),
        family: num(s?.family),
        commercial: num(s?.commercial),
        convenience: num(s?.convenience),
        investment: num(s?.investment),
      },
      perfil: (prof?.profile as ProfileKey) ?? null,
      perfilScore: num(prof?.score),
      clusterId: cid != null && cid !== -1 ? cid : null,
      clusterLabel: cl?.label ?? null,
      h3: p.h3_r8 || null,
    };
  });
}

async function loadClusters(): Promise<Cluster[]> {
  const res = await supabase
    .from("clusters")
    .select("cluster_id,label,description,profile,size")
    .eq("cluster_run_id", CLUSTER_RUN)
    .neq("cluster_id", -1)
    .order("size", { ascending: false });
  return rows<any>("clusters", res).map((c) => ({
    clusterId: c.cluster_id,
    label: c.label ?? "Grupo",
    description: c.description ?? null,
    profile: (c.profile as ProfileKey) || null,
    size: c.size ?? 0,
    sampleIds: [],
  }));
}

async function loadRegions(): Promise<Region[]> {
  const [cellsRes, scoresRes, dnaRes, featuresRes, neighborsRes] = await Promise.all([
    supabase.from("region_cells").select("h3,cidade,bairro_label,num_properties"),
    supabase
      .from("region_scores")
      .select("h3,convenience,walkability,commercial,airbnb,student,family")
      .eq("score_version", 1),
    supabase.from("region_dna").select("h3,dna,top_tags,summary_text"),
    supabase.from("region_features").select("h3,features").eq("feature_version", 1),
    supabase.from("region_neighbors").select("h3,neighbor_h3,similarity,rank"),
  ]);

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
    return {
      nome: c?.bairro_label ?? "Região",
      cidade: titleCase(c?.cidade ?? ""),
    };
  };

  return cells
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
        nome: c.bairro_label ?? "Região",
        cidade: titleCase(c.cidade ?? ""),
        numProps: c.num_properties ?? 0,
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
        resumo: d?.summary_text ?? null,
        counts: feat.counts ?? {},
        nearest: feat.nearest_m ?? {},
        neighbors: nb,
      };
    });
}

export const getProperties = unstable_cache(loadProperties, ["properties"], {
  revalidate: REVALIDATE,
});
export const getClusters = unstable_cache(loadClusters, ["clusters"], {
  revalidate: REVALIDATE,
});
export const getRegions = unstable_cache(loadRegions, ["regions"], {
  revalidate: REVALIDATE,
});

export async function getProperty(id: string): Promise<Property | null> {
  const all = await getProperties();
  return all.find((p) => p.id === id) ?? null;
}

export async function getRegion(h3: string): Promise<Region | null> {
  const all = await getRegions();
  return all.find((r) => r.h3 === h3) ?? null;
}
