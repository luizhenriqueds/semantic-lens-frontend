import { supabase } from "@/lib/supabase";
import type { Cluster, ProfileKey } from "@/lib/types";
import { cached, CLUSTER_RUN, requiredRows, withRetry } from "./client";

async function loadClusters(): Promise<Cluster[]> {
  const res = await withRetry(() =>
    supabase
      .from("clusters")
      .select("cluster_id,label,description,profile,size")
      .eq("cluster_run_id", CLUSTER_RUN)
      .neq("cluster_id", -1)
      .order("size", { ascending: false }),
  );
  return requiredRows<any>("clusters", res).map((c) => ({
    clusterId: c.cluster_id,
    label: c.label ?? "Coleção",
    description: c.description ?? null,
    profile: (c.profile as ProfileKey) || null,
    size: c.size ?? 0,
    sampleIds: [],
  }));
}

export const getClusters = cached(loadClusters, "clusters");
