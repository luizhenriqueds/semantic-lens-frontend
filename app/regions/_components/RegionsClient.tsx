"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconBuilding, IconGroups, IconHouse, IconPin, IconStar } from "@/lib/icons";
import { regionTags } from "@/lib/region";
import type { Region } from "@/lib/types";

type SortKey = "commercial" | "convenience" | "airbnb" | "numProps";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "commercial", label: "Comercial" },
  { key: "convenience", label: "Conveniência" },
  { key: "airbnb", label: "Airbnb" },
  { key: "numProps", label: "Mais imóveis" },
];

const val = (r: Region, k: SortKey) => (k === "numProps" ? r.numProps : (r.scores[k] ?? 0));

function maxBy(regions: Region[], fn: (r: Region) => number): Region | null {
  return regions.reduce<Region | null>((best, r) => (!best || fn(r) > fn(best) ? r : best), null);
}

function Spark({ seed }: { seed: number }) {
  const base = [28, 24, 25, 18, 21, 12, 14, 6];
  const pts = base
    .map((y, i) => `${(i * 14.3).toFixed(0)},${y + ((seed * 5 + i * 3) % 5) - 2}`)
    .join(" ");
  return (
    <svg className="spark" viewBox="0 0 100 32" fill="none" preserveAspectRatio="none">
      <polyline
        points={pts}
        stroke="var(--primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function RegionsClient({ regions }: { regions: Region[] }) {
  const [sort, setSort] = useState<SortKey>("numProps");
  const ranked = useMemo(() => regions.filter((r) => r.numProps > 0), [regions]);

  const rows = useMemo(
    () => [...ranked].sort((a, b) => val(b, sort) - val(a, sort)).slice(0, 30),
    [ranked, sort],
  );

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
    { Icon: IconHouse, label: "Maior potencial Airbnb", region: bestAir, field: "airbnb", seed: 0 },
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
        <div className="rstat">
          <div className="ic">
            <IconPin />
          </div>
          <div className="l">Maior conveniência</div>
          <div className="v">{bestConv ? Math.round(bestConv.scores.convenience ?? 0) : "—"}</div>
          <div className="s">{bestConv?.nome ?? ""}</div>
        </div>
        <div className="rstat">
          <div className="ic">
            <IconBuilding />
          </div>
          <div className="l">Maior potencial comercial</div>
          <div className="v">{bestComm ? Math.round(bestComm.scores.commercial ?? 0) : "—"}</div>
          <div className="s">{bestComm?.nome ?? ""}</div>
        </div>
        <div className="rstat">
          <div className="ic">
            <IconStar />
          </div>
          <div className="l">Maior potencial Airbnb</div>
          <div className="v">{bestAir ? Math.round(bestAir.scores.airbnb ?? 0) : "—"}</div>
          <div className="s">{bestAir?.nome ?? ""}</div>
        </div>
      </div>

      <div className="rcard">
        <h3 style={{ marginBottom: 4 }}>Ranking de regiões</h3>
        <p className="rabout" style={{ marginBottom: 14 }}>
          Compare as regiões pelos principais indicadores. Toque numa linha para ver os detalhes.
        </p>
        <div className="chiprow" style={{ marginBottom: 14 }}>
          {SORTS.map((s) => (
            <button
              key={s.key}
              className={`rchip${sort === s.key ? " on" : ""}`}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="rtable">
          <div className="rthead">
            <span>Região</span>
            <span>Perfil predominante</span>
            <span className={`num${sort === "commercial" ? " sorted" : ""}`}>Comercial</span>
            <span className={`num${sort === "convenience" ? " sorted" : ""}`}>Conveniência</span>
            <span className={`num${sort === "airbnb" ? " sorted" : ""}`}>Airbnb</span>
            <span className={`num${sort === "numProps" ? " sorted" : ""}`}>Imóveis</span>
          </div>
          {rows.map((r) => (
            <Link className="rtrow" href={`/regions/${r.h3}`} key={r.h3}>
              <div className="rg">
                <b>{r.nome}</b>
                <span>{r.cidade}</span>
              </div>
              <div className="rtags">
                {regionTags(r).map((t) => (
                  <span className="t" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <div className={`num hidem${sort === "commercial" ? " sorted" : ""}`}>
                {Math.round(r.scores.commercial ?? 0)}
              </div>
              <div className={`num hidem${sort === "convenience" ? " sorted" : ""}`}>
                {Math.round(r.scores.convenience ?? 0)}
              </div>
              <div className={`num hidem${sort === "airbnb" ? " sorted" : ""}`}>
                {Math.round(r.scores.airbnb ?? 0)}
              </div>
              <div className={`num dim${sort === "numProps" ? " sorted" : ""}`}>{r.numProps}</div>
            </Link>
          ))}
        </div>
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
                <div className="nm">{it.region.nome}</div>
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
