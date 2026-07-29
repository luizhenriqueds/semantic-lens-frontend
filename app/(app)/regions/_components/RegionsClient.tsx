"use client";

import Link from "next/link";
import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { IconBuilding, IconGroups, IconHouse, IconPin, IconStar } from "@/lib/icons";
import {
  regionComboKey,
  REGION_SORTS,
  type RegionInsightKey,
  type RegionListItem,
  type RegionsIndex,
  type RegionSortKey,
} from "@/lib/region";

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
  region: RegionListItem | null;
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

export default function RegionsClient({ index }: { index: RegionsIndex }) {
  // Clicking a pill toggles it in/out of the blend; the loader precomputed a ranking
  // for every combination.
  const [sortKeys, setSortKeys] = useState<RegionSortKey[]>(["numProps"]);

  const toggleSort = (k: RegionSortKey) =>
    setSortKeys((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const combo = regionComboKey(sortKeys.length ? sortKeys : ["numProps"]);
  const rows = (index.rankings[combo] ?? []).map((i) => index.items[i]);

  const isSorted = (k: RegionSortKey) => sortKeys.includes(k);
  const bestOf = (k: RegionInsightKey) => {
    const i = index.best[k];
    return i == null ? null : index.items[i];
  };

  const bestConv = bestOf("convenience");
  const bestComm = bestOf("commercial");
  const bestAir = bestOf("airbnb");

  const insights = (
    [
      { Icon: IconHouse, label: "Maior potencial de temporada", field: "airbnb" },
      { Icon: IconGroups, label: "Melhor para estudantes", field: "student" },
      { Icon: IconStar, label: "Região mais familiar", field: "family" },
      { Icon: IconPin, label: "Maior conveniência", field: "convenience" },
      { Icon: IconBuilding, label: "Maior potencial comercial", field: "commercial" },
    ] as const
  ).map((it, seed) => ({ ...it, seed, region: bestOf(it.field) }));

  if (index.total === 0) {
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
          <div className="v">{index.total}</div>
          <div className="s">com perfil calculado</div>
        </div>
        <div className="rstat">
          <div className="ic">
            <IconHouse />
          </div>
          <div className="l">Imóveis em leilão</div>
          <div className="v">{index.totalProps.toLocaleString("pt-BR")}</div>
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
          {REGION_SORTS.map((s) => (
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
              .map((k) => REGION_SORTS.find((s) => s.key === k)?.label)
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
                  <span>
                    {r.city}
                    {r.subLabel ? ` · ${r.subLabel}` : ""}
                  </span>
                </div>
                <div className="rtags">
                  {r.tags.map((t) => (
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
                <div className="nm">
                  {it.region.name}
                  <span className="nm-city">
                    {" · "}
                    {it.region.city}
                    {it.region.subLabel ? ` · ${it.region.subLabel}` : ""}
                  </span>
                </div>
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
