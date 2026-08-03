"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import UsageMeter from "@/components/plan/UsageMeter";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import PropertyRow from "@/components/property/PropertyRow";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { IconSearch, IconStar } from "@/lib/icons";
import { auctionInstant } from "@/lib/auctionTime";
import { LIST_PAGE_SIZE } from "@/lib/filters/propertiesUrl";
import { moneyShort } from "@/lib/format";
import {
  filterPortfolio,
  hasPortfolioFilters,
  NO_PORTFOLIO_FILTERS,
  PORTFOLIO_SORTS,
  portfolioOptions,
  sortPortfolio,
  type PortfolioSort,
} from "@/lib/portfolio";
import { useSaved, useSavedSync } from "@/lib/saved";
import type { Property } from "@/lib/types";

export default function PortfolioClient({
  properties,
  savedIds,
}: {
  properties: Property[];
  savedIds: string[];
}) {
  useSavedSync(savedIds);
  const { ids } = useSaved();
  const [sort, setSort] = useState<PortfolioSort>("recent");
  const [filters, setFilters] = useState(NO_PORTFOLIO_FILTERS);
  const [page, setPage] = useState(1);

  // Driven off `ids` rather than `properties` so the newest favourite leads the default order.
  const saved = useMemo(() => {
    const byId = new Map(properties.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Property => !!p);
  }, [properties, ids]);

  const shown = useMemo(
    () => sortPortfolio(filterPortfolio(saved, filters), sort),
    [saved, filters, sort],
  );
  const { ufs, types } = useMemo(() => portfolioOptions(saved), [saved]);
  const filtered = hasPortfolioFilters(filters);
  const start = (page - 1) * LIST_PAGE_SIZE;
  const pageItems = shown.slice(start, start + LIST_PAGE_SIZE);

  useEffect(() => setPage(1), [ids.length, filters, sort]);

  const now = Date.now();
  const in30 = saved.filter((p) => {
    const t = auctionInstant(p.auctionDate);
    return t != null && t >= now && t <= now + 30 * 864e5;
  }).length;
  const avgDesc = saved.length
    ? Math.round(saved.reduce((s, p) => s + (p.discount ?? 0), 0) / saved.length)
    : 0;
  const economia = saved.reduce(
    (s, p) => s + Math.max(0, (p.appraisedValue ?? 0) - (p.saleValue ?? 0)),
    0,
  );

  if (!saved.length) {
    return (
      <EmptyState
        icon={<IconStar />}
        title="Sua carteira está vazia"
        action={
          <Link className="btn solid" href="/properties">
            Ver imóveis
          </Link>
        }
      >
        Abra um imóvel e toque em <b>Salvar na carteira</b> para acompanhar datas de praça, preços e
        avisos por aqui.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="statgrid">
        <div className="stat">
          <div className="k">Imóveis salvos</div>
          <div className="v">{saved.length}</div>
        </div>
        <div className="stat">
          <div className="k">Leilões nos próximos 30 dias</div>
          <div className="v accent">{in30}</div>
        </div>
        <div className="stat">
          <div className="k">Desconto médio</div>
          <div className="v">{avgDesc}%</div>
        </div>
        <div className="stat">
          <div className="k">Economia potencial</div>
          <div className="v accent">{moneyShort(economia)}</div>
        </div>
      </div>

      <div className="sectitle">
        <h2>Imóveis acompanhados</h2>
        <UsageMeter used={saved.length} quota="favorites" noun="salvos" />
      </div>

      <div className="filterbar">
        <div className="searchmini">
          <IconSearch width={17} height={17} strokeWidth={1.7} />
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Buscar por bairro, cidade ou tipo"
            aria-label="Buscar na carteira"
          />
        </div>
        <SearchableSelect
          label="Estado"
          allLabel="todos"
          value={filters.uf || "all"}
          options={ufs.map((u) => ({ value: u, label: u }))}
          onChange={(v) => setFilters((f) => ({ ...f, uf: v === "all" ? "" : v }))}
        />
        <select
          className="selectish"
          value={filters.type || "all"}
          aria-label="Tipo"
          onChange={(e) =>
            setFilters((f) => ({ ...f, type: e.target.value === "all" ? "" : e.target.value }))
          }
        >
          <option value="all">Tipo: todos</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {filtered && (
          <button
            type="button"
            className="clearfilters"
            onClick={() => setFilters(NO_PORTFOLIO_FILTERS)}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="viewbar">
        <h2 className="resultcount">
          {shown.length} {shown.length === 1 ? "imóvel" : "imóveis"}
          {filtered ? " no filtro" : " na carteira"}
          {shown.length > LIST_PAGE_SIZE && (
            <span className="range">
              mostrando {start + 1}-{start + pageItems.length} de {shown.length}
            </span>
          )}
        </h2>
        <select
          className="selectish"
          value={sort}
          aria-label="Ordenar"
          onChange={(e) => setSort(e.target.value as PortfolioSort)}
        >
          {PORTFOLIO_SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Ordenar: {s.label}
            </option>
          ))}
        </select>
      </div>

      {shown.length ? (
        <>
          <div className="wlist">
            {pageItems.map((p) => (
              <PropertyRow key={p.id} p={p} />
            ))}
          </div>
          <Pagination
            page={page}
            total={shown.length}
            pageSize={LIST_PAGE_SIZE}
            onChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      ) : (
        <EmptyState
          icon={<IconSearch />}
          title="Nenhum imóvel da carteira corresponde"
          action={
            <button className="btn ghost" onClick={() => setFilters(NO_PORTFOLIO_FILTERS)}>
              Limpar filtros
            </button>
          }
        >
          Ajuste a busca, o estado ou o tipo para ver os imóveis que você salvou.
        </EmptyState>
      )}
    </>
  );
}
