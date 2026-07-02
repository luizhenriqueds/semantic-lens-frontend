"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import PropertyRow from "@/components/property/PropertyRow";
import AuctionCalendar from "./AuctionCalendar";
import { profileScore } from "@/lib/format";
import { useAlerts } from "@/lib/alerts";
import { describeFilters, hasAnyFilter } from "@/lib/alertFilters";
import type { AlertFilters, Cluster, Property } from "@/lib/types";
import { IconBell, IconBuilding, IconSearch } from "@/lib/icons";

const PropertiesMap = dynamic(() => import("@/components/property/PropertiesMap"), {
  ssr: false,
  loading: () => <div className="lmap propmap loading">Carregando mapa…</div>,
});

type View = "list" | "calendar" | "map";

const PAGE_SIZE = 25;

type Sort = "desconto" | "score" | "menor" | "maior";

const SORTS: { key: Sort; label: string }[] = [
  { key: "desconto", label: "Maior desconto" },
  { key: "score", label: "Melhor nota" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
];

export default function PropertiesClient({
  properties,
  clusters,
  initialCluster,
  initialCity,
  h3,
  h3Label,
}: {
  properties: Property[];
  clusters: Cluster[];
  initialCluster?: number;
  initialCity?: string;
  h3?: string;
  h3Label?: string;
}) {
  const [q, setQ] = useState("");
  const [uf, setUf] = useState("all");
  const [cidade, setCidade] = useState(initialCity ?? "all");
  const [tipo, setTipo] = useState("all");
  const [cluster, setCluster] = useState<number | "all">(initialCluster ?? "all");
  const [sort, setSort] = useState<Sort>("desconto");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("list");
  const [alertCreated, setAlertCreated] = useState(false);
  const { add: addAlert } = useAlerts();

  const ufs = useMemo(
    () => Array.from(new Set(properties.map((p) => p.uf).filter(Boolean))).sort(),
    [properties],
  );
  const cidades = useMemo(
    () =>
      Array.from(new Set(properties.filter((p) => uf === "all" || p.uf === uf).map((p) => p.city)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [properties, uf],
  );
  const tipos = useMemo(
    () => Array.from(new Set(properties.map((p) => p.propertyType))).sort(),
    [properties],
  );

  const clusterLabel =
    cluster !== "all" ? clusters.find((c) => c.clusterId === cluster)?.label : undefined;

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = properties.filter((p) => {
      if (h3 && p.h3 !== h3) return false;
      if (cluster !== "all" && p.clusterId !== cluster) return false;
      if (uf !== "all" && p.uf !== uf) return false;
      if (cidade !== "all" && p.city !== cidade) return false;
      if (tipo !== "all" && p.propertyType !== tipo) return false;
      if (term) {
        const hay =
          `${p.title} ${p.neighborhood} ${p.city} ${p.uf} ${p.propertyType}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      if (sort === "desconto") return (b.discount ?? 0) - (a.discount ?? 0);
      if (sort === "score") return (profileScore(b) ?? 0) - (profileScore(a) ?? 0);
      if (sort === "menor") return (a.saleValue ?? Infinity) - (b.saleValue ?? Infinity);
      return (b.saleValue ?? 0) - (a.saleValue ?? 0);
    });
    return list;
  }, [properties, q, uf, cidade, tipo, cluster, sort, h3]);

  useEffect(() => setPage(1), [q, uf, cidade, tipo, cluster, sort, h3]);
  useEffect(() => setAlertCreated(false), [uf, cidade, tipo]);

  const alertFilters = useMemo<AlertFilters>(() => {
    const f: AlertFilters = {};
    if (uf !== "all") f.uf = uf;
    if (cidade !== "all") f.city = cidade;
    if (tipo !== "all") f.propertyType = tipo;
    return f;
  }, [uf, cidade, tipo]);

  const canAlert = hasAnyFilter(alertFilters);

  const createAlert = () => {
    if (!canAlert) return;
    addAlert(describeFilters(alertFilters), "Aviso diário", alertFilters);
    setAlertCreated(true);
  };

  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered =
    cluster !== "all" || uf !== "all" || cidade !== "all" || tipo !== "all" || q.trim();
  const title = h3Label
    ? `Imóveis em ${h3Label}`
    : (clusterLabel ?? (filtered ? `${items.length} imóveis encontrados` : "Todos os imóveis"));

  return (
    <>
      <div className="pagehead">
        <h1>{title}</h1>
        <p>
          {clusterLabel
            ? "Coleção com imóveis parecidos entre si. Clique em um imóvel para ver os detalhes."
            : "Lista de imóveis em leilão que estamos acompanhando. Clique em um imóvel para ver os detalhes."}
        </p>
      </div>

      <div className="filterbar">
        <div className="searchmini">
          <IconSearch width={17} height={17} strokeWidth={1.7} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por bairro, cidade ou tipo"
          />
        </div>
        <select
          className="selectish"
          value={uf}
          onChange={(e) => {
            setUf(e.target.value);
            setCidade("all");
          }}
        >
          <option value="all">Estado: todos</option>
          {ufs.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select className="selectish" value={cidade} onChange={(e) => setCidade(e.target.value)}>
          <option value="all">Cidade: todas</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="selectish" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="all">Tipo: todos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {cluster !== "all" && (
          <button className="selectish on" type="button" onClick={() => setCluster("all")}>
            Grupo: {clusterLabel} ✕
          </button>
        )}
        <select
          className="selectish"
          style={{ marginLeft: "auto" }}
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Ordenar: {s.label}
            </option>
          ))}
        </select>
      </div>

      {canAlert && (
        <div className="alertcta">
          {alertCreated ? (
            <span className="ok">
              <IconBell width={16} height={16} strokeWidth={1.8} /> Alerta criado ·{" "}
              <Link href="/alerts">ver em Alertas ›</Link>
            </span>
          ) : (
            <button type="button" className="btn ghost" onClick={createAlert}>
              <IconBell width={16} height={16} strokeWidth={1.8} /> Criar alerta com estes filtros
            </button>
          )}
        </div>
      )}

      <div className="viewtoggle" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={view === "list" ? "on" : ""}
          onClick={() => setView("list")}
        >
          Lista
        </button>
        <button
          type="button"
          className={view === "calendar" ? "on" : ""}
          onClick={() => setView("calendar")}
        >
          Calendário
        </button>
        <button type="button" className={view === "map" ? "on" : ""} onClick={() => setView("map")}>
          Mapa
        </button>
      </div>

      {view === "map" ? (
        <PropertiesMap properties={items} />
      ) : view === "calendar" ? (
        <AuctionCalendar items={items} />
      ) : items.length ? (
        <>
          {pageItems.map((p) => (
            <PropertyRow key={p.id} p={p} />
          ))}
          <Pagination page={page} total={items.length} pageSize={PAGE_SIZE} onChange={goTo} />
        </>
      ) : (
        <EmptyState icon={<IconBuilding />} title="Nenhum imóvel encontrado com esses filtros">
          Tente remover um filtro ou limpar a busca para ver mais resultados.
        </EmptyState>
      )}
    </>
  );
}
