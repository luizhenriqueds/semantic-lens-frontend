"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { IconBuilding, IconGroups, IconHouse, IconPin, IconStar } from "@/lib/icons";
import { regionTags } from "@/lib/region";
import type { Region } from "@/lib/types";

type SortKey = "commercial" | "convenience" | "airbnb" | "numProps";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "numProps", label: "Mais imóveis" },
  { key: "commercial", label: "Comercial" },
  { key: "convenience", label: "Conveniência" },
  { key: "airbnb", label: "Temporada" },
];

function maxBy(regions: Region[], fn: (r: Region) => number): Region | null {
  return regions.reduce<Region | null>((best, r) => (!best || fn(r) > fn(best) ? r : best), null);
}

function Spark({ seed }: { seed: number }) {
  const base = [10, 16, 13, 22, 18, 27, 24, 30];
  const bars = base.map((h, i) => Math.max(4, h + ((seed * 5 + i * 3) % 6) - 3));
  const w = 100 / bars.length;
  return (
    <svg className="spark" viewBox="0 0 100 32" preserveAspectRatio="none">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * w + 1.5}
          y={32 - h}
          width={w - 3}
          height={h}
          rx="1.4"
          fill="var(--primary)"
          opacity={0.35 + (h / 30) * 0.65}
        />
      ))}
    </svg>
  );
}

function RegionStat({
  Icon,
  label,
  value,
  region,
}: {
  Icon: typeof IconStar;
  label: string;
  value: number | string;
  region: Region | null;
}) {
  const inner = (
    <>
      <div className="ic">
        <Icon />
      </div>
      <div className="l">{label}</div>
      <div className="v">{value}</div>
      <div className="s">{region?.name ?? ""}</div>
    </>
  );
  return region ? (
    <Link className="rstat linked" href={`/regions/${region.h3}`}>
      {inner}
    </Link>
  ) : (
    <div className="rstat">{inner}</div>
  );
}

export default function RegionsClient({ regions }: { regions: Region[] }) {
  // Selected criteria are blended: the ranking sorts by the average of the
  // chosen metrics (each normalized to 0–1), so every selection visibly shapes
  // the order. Clicking a pill toggles it in/out of the mix.
  const [sortKeys, setSortKeys] = useState<SortKey[]>(["numProps"]);
  const ranked = useMemo(() => regions.filter((r) => r.numProps > 0), [regions]);

  const toggleSort = (k: SortKey) =>
    setSortKeys((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const rows = useMemo(() => {
    const keys = sortKeys.length ? sortKeys : (["numProps"] as SortKey[]);
    const valueOf = (r: Region, k: SortKey) => (k === "numProps" ? r.numProps : (r.scores[k] ?? 0));
    const n = ranked.length;
    // Rank each region by its percentile on every selected metric, so being the
    // single top region on one metric no longer dominates the blend.
    const pct = new Map<SortKey, Map<string, number>>();
    for (const k of keys) {
      const vals = ranked.map((r) => valueOf(r, k));
      const m = new Map<string, number>();
      for (const r of ranked) {
        const v = valueOf(r, k);
        const lower = vals.filter((x) => x < v).length;
        m.set(r.h3, n > 1 ? lower / (n - 1) : 1);
      }
      pct.set(k, m);
    }
    const combined = (r: Region) =>
      keys.reduce((s, k) => s + (pct.get(k)?.get(r.h3) ?? 0), 0) / keys.length;
    return [...ranked]
      .sort((a, b) => combined(b) - combined(a) || b.numProps - a.numProps)
      .slice(0, 30);
  }, [ranked, sortKeys]);

  const isSorted = (k: SortKey) => sortKeys.includes(k);

  const totalProps = regions.reduce((s, r) => s + r.numProps, 0);
  const bestConv = maxBy(regions, (r) => r.scores.convenience ?? 0);
  const bestComm = maxBy(regions, (r) => r.scores.commercial ?? 0);
  const bestAir = maxBy(regions, (r) => r.scores.airbnb ?? 0);

  const insights: {
    Icon: typeof IconStar;
    label: string;
    region: Region | null;
    field: keyof Region["scores"];
    seed: number;
  }[] = [
    {
      Icon: IconHouse,
      label: "Maior potencial de temporada",
      region: bestAir,
      field: "airbnb",
      seed: 0,
    },
    {
      Icon: IconGroups,
      label: "Melhor para estudantes",
      region: maxBy(regions, (r) => r.scores.student ?? 0),
      field: "student",
      seed: 1,
    },
    {
      Icon: IconStar,
      label: "Região mais familiar",
      region: maxBy(regions, (r) => r.scores.family ?? 0),
      field: "family",
      seed: 2,
    },
    { Icon: IconPin, label: "Maior conveniência", region: bestConv, field: "convenience", seed: 3 },
    {
      Icon: IconBuilding,
      label: "Maior potencial comercial",
      region: bestComm,
      field: "commercial",
      seed: 4,
    },
  ];

  if (regions.length === 0) {
    return (
      <EmptyState icon={<IconPin />} title="Nenhuma região disponível">
        Ainda não há regiões com perfil calculado. Assim que os dados de mapa forem processados, as
        regiões aparecerão aqui.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="rstats">
        <div className="rstat">
          <div className="ic">
            <IconPin />
          </div>
          <div className="l">Regiões acompanhadas</div>
          <div className="v">{regions.length}</div>
          <div className="s">com perfil calculado</div>
        </div>
        <div className="rstat">
          <div className="ic">
            <IconHouse />
          </div>
          <div className="l">Imóveis analisados</div>
          <div className="v">{totalProps.toLocaleString("pt-BR")}</div>
          <div className="s">nessas regiões</div>
        </div>
        <RegionStat
          Icon={IconPin}
          label="Maior conveniência"
          value={bestConv ? Math.round(bestConv.scores.convenience ?? 0) : "—"}
          region={bestConv}
        />
        <RegionStat
          Icon={IconBuilding}
          label="Maior potencial comercial"
          value={bestComm ? Math.round(bestComm.scores.commercial ?? 0) : "—"}
          region={bestComm}
        />
        <RegionStat
          Icon={IconStar}
          label="Maior potencial de temporada"
          value={bestAir ? Math.round(bestAir.scores.airbnb ?? 0) : "—"}
          region={bestAir}
        />
      </div>

      <div className="rcard">
        <h3 style={{ marginBottom: 4 }}>Ranking de regiões</h3>
        <p className="rabout" style={{ marginBottom: 14 }}>
          Compare as regiões pelos principais indicadores. Selecione um ou mais critérios para
          combiná-los no ranking. Toque numa linha para ver os detalhes.
        </p>
        <div className="chiprow" style={{ marginBottom: sortKeys.length > 1 ? 8 : 14 }}>
          {SORTS.map((s) => (
            <button
              key={s.key}
              className={`rchip${isSorted(s.key) ? " on" : ""}`}
              onClick={() => toggleSort(s.key)}
            >
              {s.label}
            </button>
          ))}
          {sortKeys.length > 0 && (
            <button className="rchip clear" onClick={() => setSortKeys([])}>
              Limpar ordem
            </button>
          )}
        </div>
        {sortKeys.length > 1 && (
          <p className="sortsummary" style={{ marginBottom: 14 }}>
            Combinando{" "}
            {sortKeys
              .map((k) => SORTS.find((s) => s.key === k)?.label)
              .filter(Boolean)
              .join(" + ")}
          </p>
        )}
        {rows.length === 0 ? (
          <EmptyState icon={<IconBuilding />} title="Nenhuma região com imóveis em leilão">
            Nenhuma das regiões acompanhadas tem imóveis em leilão no momento. Elas voltam ao
            ranking assim que novos imóveis forem detectados.
          </EmptyState>
        ) : (
          <div className="rtable">
            <div className="rthead">
              <span>Região</span>
              <span>Perfil predominante</span>
              <span className={`num${isSorted("commercial") ? " sorted" : ""}`}>Comercial</span>
              <span className={`num${isSorted("convenience") ? " sorted" : ""}`}>Conveniência</span>
              <span className={`num${isSorted("airbnb") ? " sorted" : ""}`}>Temporada</span>
              <span className={`num${isSorted("numProps") ? " sorted" : ""}`}>Imóveis</span>
            </div>
            {rows.map((r) => (
              <Link className="rtrow" href={`/regions/${r.h3}`} key={r.h3}>
                <div className="rg">
                  <b>{r.name}</b>
                  <span>{r.city}</span>
                </div>
                <div className="rtags">
                  {regionTags(r).map((t) => (
                    <span className="t" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className={`num hidem${isSorted("commercial") ? " sorted" : ""}`}>
                  {Math.round(r.scores.commercial ?? 0)}
                </div>
                <div className={`num hidem${isSorted("convenience") ? " sorted" : ""}`}>
                  {Math.round(r.scores.convenience ?? 0)}
                </div>
                <div className={`num hidem${isSorted("airbnb") ? " sorted" : ""}`}>
                  {Math.round(r.scores.airbnb ?? 0)}
                </div>
                <div className={`num dim${isSorted("numProps") ? " sorted" : ""}`}>
                  {r.numProps}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="sectitle" style={{ marginTop: 22 }}>
        <h2>Insights das regiões</h2>
      </div>
      <div className="insgrid">
        {insights.map(
          (it) =>
            it.region && (
              <Link className="inscard" href={`/regions/${it.region.h3}`} key={it.label}>
                <div className="il">
                  <it.Icon />
                  <span>{it.label}</span>
                </div>
                <div className="nm">{it.region.name}</div>
                <div className="mv">
                  nota média <b>{Math.round(it.region.scores[it.field] ?? 0)}</b>
                </div>
                <Spark seed={it.seed} />
              </Link>
            ),
        )}
      </div>
    </>
  );
}
