"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CollectionCard from "@/components/groups/CollectionCard";
import EmptyState from "@/components/ui/EmptyState";
import { PROFILE_LABEL } from "@/lib/format";
import { IconGroups, IconSearch } from "@/lib/icons";
import type { ClusterStats } from "@/lib/clusters";
import type { Cluster, ProfileKey } from "@/lib/types";

const BATCH = 24;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export default function GroupsClient({
  clusters,
  stats,
}: {
  clusters: Cluster[];
  stats: Record<number, ClusterStats>;
}) {
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<ProfileKey | "all">("all");
  const [visible, setVisible] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Only offer objectives that actually have groups.
  const profiles = useMemo(() => {
    const present = new Set(clusters.map((c) => c.profile).filter(Boolean) as ProfileKey[]);
    return (Object.keys(PROFILE_LABEL) as ProfileKey[]).filter((p) => present.has(p));
  }, [clusters]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return clusters.filter((c) => {
      if (profile !== "all" && c.profile !== profile) return false;
      if (q && !norm(`${c.label} ${c.description ?? ""}`).includes(q)) return false;
      return true;
    });
  }, [clusters, query, profile]);

  // Reset the incremental window whenever the filter changes.
  useEffect(() => setVisible(BATCH), [query, profile]);

  const hasMore = visible < filtered.length;
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisible((v) => Math.min(v + BATCH, filtered.length));
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, filtered.length]);

  return (
    <>
      <div className="filterbar">
        <div className="searchmini">
          <IconSearch width={17} height={17} strokeWidth={1.7} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar grupo por nome ou descrição"
          />
        </div>
        <select
          className="selectish"
          value={profile}
          onChange={(e) => setProfile(e.target.value as ProfileKey | "all")}
        >
          <option value="all">Objetivo: todos</option>
          {profiles.map((p) => (
            <option key={p} value={p}>
              {PROFILE_LABEL[p]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<IconGroups />} title="Nenhum grupo encontrado">
          Ajuste a busca ou o objetivo para ver outros grupos.
        </EmptyState>
      ) : (
        <>
          <div className="plgrid">
            {filtered.slice(0, visible).map((c) => (
              <CollectionCard key={c.clusterId} c={c} stats={stats[c.clusterId]} />
            ))}
          </div>
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />}
        </>
      )}
    </>
  );
}
