"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PlanBadge from "@/components/plan/PlanBadge";
import { usePlan } from "@/components/plan/PlanProvider";
import UpgradeWall from "@/components/plan/UpgradeWall";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import PropertyRow from "@/components/property/PropertyRow";
import SearchableSelect from "@/components/ui/SearchableSelect";
import AuctionCalendar from "./AuctionCalendar";
import PropertiesAnalysis from "./PropertiesAnalysis";
import { useToast } from "@/components/ui/Toaster";
import { fmtDist, moneyShort, SCORE_LABEL } from "@/lib/format";
import { alertError, describeCriteria, hasAnyCriteria, useAlerts } from "@/lib/alerts";
import { mapPointToProperty } from "@/lib/mapPoints";
import { rangeLabel, type RangeDim } from "@/lib/facets/range";
import { toRpcFilters } from "@/lib/filters/contract";
import { VIEW_FEATURE } from "@/lib/entitlements";
import type { AnalysisData } from "@/lib/facets/analysis";
import type {
  AlertCriteriaSet,
  Cluster,
  FilterOptions,
  MapPoint,
  Property,
  PropertyChangeKind,
  PropertyFilters,
  PropertySort,
  Scores,
} from "@/lib/types";
import { IconArrow, IconBell, IconBuilding, IconSearch, IconSliders, POI_ICON } from "@/lib/icons";
import { MAX_NEAR_M, POI_LABEL, POI_ORDER } from "@/lib/pois";
import {
  CHANGE_WINDOW_DAYS,
  DEFAULT_SORT,
  LIST_PAGE_SIZE,
  PROPERTY_SORTS,
  sortParam,
  type PropertiesView,
} from "@/lib/filters/propertiesUrl";

const PropertiesMap = dynamic(() => import("@/components/property/PropertiesMap"), {
  ssr: false,
  loading: () => <div className="lmap propmap loading">Carregando mapa…</div>,
});

// Score dimensions offered by the "filter by goal" control (investment has its
// own control, so it is excluded here).
const SCORE_KEYS: (keyof Scores)[] = [
  "flip",
  "liquidity",
  "airbnb",
  "student",
  "family",
  "commercial",
  "convenience",
];

const PRICE_STEPS = [150_000, 300_000, 500_000, 750_000, 1_000_000];
const AREA_STEPS = [50, 100, 150, 200, 300];
const QUARTOS_STEPS = [1, 2, 3, 4];
const DESCONTO_STEPS = [10, 20, 30, 40, 50];
const INVEST_STEPS = [50, 60, 70, 80, 90];
const VISUAL_STEPS = [50, 60, 70, 80];
const GOAL_STEPS = [50, 60, 70, 80, 90];
const POI_RADII = [500, 1000, 2000, 5000];
const CENTER_STEPS = [1000, 2000, 5000, 10_000];
const POI_VISIBLE = 12;

const CHANGE_LABEL: Record<PropertyChangeKind, string> = {
  payment: "Passou a aceitar financiamento/FGTS",
  modality: "Mudou de modalidade",
};

const PRAZOS: { days: number; label: string }[] = [
  { days: 7, label: "Próximos 7 dias" },
  { days: 15, label: "Próximos 15 dias" },
  { days: 30, label: "Próximos 30 dias" },
  { days: 60, label: "Próximos 60 dias" },
];

const nImoveis = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "imóvel" : "imóveis"}`;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={`fchip${active ? " on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Section({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`dsec${open ? " open" : ""}`}>
      <button type="button" className="dsec-head" onClick={onToggle} aria-expanded={open}>
        {title}
        {count > 0 && <span className="dsec-badge">{count}</span>}
        <span className="dsec-car">▾</span>
      </button>
      {open && <div className="dsec-body">{children}</div>}
    </div>
  );
}

function ModalityFilter({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const toggle = (m: string) =>
    onChange(selected.includes(m) ? selected.filter((x) => x !== m) : [...selected, m]);
  const label =
    selected.length === 0
      ? "Modalidade: todas"
      : selected.length === 1
        ? `Modalidade: ${selected[0]}`
        : `Modalidade: ${selected.length}`;
  return (
    <div className={`modalityfilter${selected.length ? " on" : ""}`} ref={ref}>
      <button
        type="button"
        className="mf-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="m13 3 8 8-2.5 2.5-8-8zM10.5 5.5 3 13l3 3 7.5-7.5M3 21h9M5 15.5 3 17.5" />
        </svg>
        <span className="mf-label">{label}</span>
        <svg
          className="mf-car"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="mf-pop" role="listbox" aria-multiselectable="true">
          {options.map((m) => (
            <button
              key={m}
              type="button"
              role="option"
              aria-selected={selected.includes(m)}
              className={`mf-opt${selected.includes(m) ? " on" : ""}`}
              onClick={() => toggle(m)}
            >
              <span className="mf-box">
                {selected.includes(m) && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                )}
              </span>
              {m}
            </button>
          ))}
          {selected.length > 0 && (
            <button type="button" className="mf-clear" onClick={() => onChange([])}>
              Limpar modalidades
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PropertiesClient({
  clusters,
  filterOptions,
  filters,
  sort,
  page,
  view,
  lockedView,
  h3Label,
  list,
  analysis,
  calendar,
  map,
}: {
  clusters: Cluster[];
  filterOptions: FilterOptions;
  filters: PropertyFilters;
  sort: PropertySort;
  page: number;
  view: PropertiesView;
  /** The view asked for in the URL when the plan does not include it. */
  lockedView?: PropertiesView;
  h3Label?: string;
  list?: { items: Property[]; total: number };
  analysis?: AnalysisData;
  calendar?: {
    counts: Record<string, number>;
    day: string | null;
    dayItems: Property[];
    dayTotal: number;
  };
  map?: { points: MapPoint[]; total: number };
}) {
  const router = useRouter();
  const { can, require, role, trial } = usePlan();
  const canAdvanced = can("advancedFilters");
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSecs, setOpenSecs] = useState<Set<string>>(new Set(["grupo", "imovel", "poi"]));
  const [poiExpanded, setPoiExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filter state lives in the URL; every change re-queries the server component.
  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const sp = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null) sp.delete(k);
        else sp.set(k, v);
      }
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
      });
    },
    [router],
  );

  // Filter mutations reset pagination.
  const patch = useCallback(
    (p: Record<string, string | null>) => setParams({ ...p, page: null }),
    [setParams],
  );

  const uf = filters.uf ?? "all";
  const cidade = filters.city ?? "all";
  const tipo = filters.type ?? "all";
  const cluster = filters.clusterId ?? ("all" as const);
  const minQuartos = filters.minBedrooms ?? 0;
  const maxPreco = filters.maxPrice ?? 0;
  const minArea = filters.minArea ?? 0;
  const poiCats = useMemo(() => filters.poiCats ?? [], [filters.poiCats]);
  const poiIds = useMemo(() => filters.poiIds ?? [], [filters.poiIds]);
  const poiRadius = filters.poiRadiusM ?? 2000;
  const maxCenter = filters.maxCenterM ?? 0;
  const minDesconto = filters.minDiscount ?? 0;
  const minInvest = filters.minInvestment ?? 0;
  const minVisual = filters.minVisualScore ?? 0;
  const scoreKey = filters.scoreKey && filters.scoreMin ? filters.scoreKey : ("none" as const);
  const scoreMin = filters.scoreMin ?? 0;
  const financiamento = !!filters.financing;
  const fgts = !!filters.fgts;
  const changeKind = filters.changeKind ?? null;
  const modalidade = filters.modalities ?? [];
  const prazoLeilao = filters.auctionWithinDays ?? 0;
  const range = filters.range ?? null;

  const [qInput, setQInput] = useState(filters.q ?? "");
  useEffect(() => {
    if (qInput === (filters.q ?? "")) return;
    const t = setTimeout(() => patch({ q: qInput.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const [precoInput, setPrecoInput] = useState(maxPreco ? String(maxPreco) : "");
  useEffect(() => {
    const target = Math.max(0, Number(precoInput) || 0);
    if (target === maxPreco) return;
    const t = setTimeout(() => patch({ max_price: target ? String(target) : null }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precoInput]);

  const setView = useCallback(
    (v: PropertiesView) => setParams({ view: v === "list" ? null : v, day: null }),
    [setParams],
  );
  const clearRange = useCallback(
    () => patch({ range_dim: null, range_from: null, range_to: null }),
    [patch],
  );
  const pickRange = useCallback(
    (dim: RangeDim, from: number, to: number) =>
      patch({
        range_dim: dim,
        range_from: String(from),
        range_to: to === Infinity ? "" : String(to),
        view: "list",
      }),
    [patch],
  );

  const setPreco = (v: number) => {
    setPrecoInput(v ? String(v) : "");
    patch({ max_price: v ? String(v) : null });
  };
  const toggleCat = (c: string) => {
    const next = poiCats.includes(c) ? poiCats.filter((x) => x !== c) : [...poiCats, c];
    patch({
      poi_cats: next.join(",") || null,
      poi_radius_m: next.length ? String(poiRadius) : null,
    });
  };

  const { alerts, add: addAlert } = useAlerts();
  const toast = useToast();

  const ufs = filterOptions.ufs;
  const cidades = useMemo(
    () =>
      Array.from(
        new Set(filterOptions.cities.filter((c) => uf === "all" || c.uf === uf).map((c) => c.city)),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [filterOptions.cities, uf],
  );
  const tipos = filterOptions.types;
  const modalidades = filterOptions.modalities;
  const poiCategories = useMemo(
    () => POI_ORDER.filter((c) => filterOptions.poiCategories.includes(c)),
    [filterOptions.poiCategories],
  );
  const visiblePoiCats = useMemo(() => {
    if (poiExpanded || poiCategories.length <= POI_VISIBLE) return poiCategories;
    const top = poiCategories.slice(0, POI_VISIBLE);
    const extra = poiCategories.slice(POI_VISIBLE).filter((c) => poiCats.includes(c));
    return [...top, ...extra];
  }, [poiExpanded, poiCategories, poiCats]);

  const clusterLabel =
    cluster !== "all" ? clusters.find((c) => c.clusterId === cluster)?.label : undefined;

  const resultTotal =
    view === "list"
      ? (list?.total ?? 0)
      : view === "map"
        ? (map?.total ?? 0)
        : view === "analysis"
          ? (analysis?.count ?? 0)
          : Object.values(calendar?.counts ?? {}).reduce((s, n) => s + n, 0);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const alertCriteria = useMemo<AlertCriteriaSet>(() => toRpcFilters(filters), [filters]);

  const canAlert = hasAnyCriteria(alertCriteria);
  const alertLabel = useMemo(() => describeCriteria(alertCriteria), [alertCriteria]);
  const alertExists =
    canAlert && alerts.some((a) => a.name.trim().toLowerCase() === alertLabel.trim().toLowerCase());

  const createAlert = async () => {
    if (!canAlert || !require("savedSearches")) return;
    const res = await addAlert(alertLabel, "Aviso diário", alertCriteria);
    toast(res.ok ? "Alerta criado" : alertError(res.reason));
  };

  const goTo = (p: number) => {
    setParams({ page: p === 1 ? null : String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSec = (id: string) =>
    setOpenSecs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const activeFilters = useMemo(() => {
    const f: { key: string; label: string; clear: () => void }[] = [];
    if (range) f.push({ key: "range", label: rangeLabel(range), clear: clearRange });
    if (maxPreco > 0)
      f.push({ key: "preco", label: `Até ${moneyShort(maxPreco)}`, clear: () => setPreco(0) });
    if (minQuartos > 0)
      f.push({
        key: "quartos",
        label: `${minQuartos}+ quartos`,
        clear: () => patch({ min_bedrooms: null }),
      });
    if (minArea > 0)
      f.push({ key: "area", label: `${minArea}+ m²`, clear: () => patch({ min_area: null }) });
    for (const c of poiCats)
      f.push({
        key: `poi-${c}`,
        label: `${POI_LABEL[c] ?? c} · até ${fmtDist(poiRadius)}`,
        clear: () => toggleCat(c),
      });
    if (poiIds.length)
      f.push({
        key: "pois",
        label: `${poiIds.length > 1 ? "Locais selecionados" : "Local selecionado"} · até ${fmtDist(poiRadius)}`,
        clear: () => patch({ poi_ids: null }),
      });
    if (maxCenter > 0)
      f.push({
        key: "center",
        label: `Até ${fmtDist(maxCenter)} do centro`,
        clear: () => patch({ max_center_m: null }),
      });
    if (minDesconto > 0)
      f.push({
        key: "desc",
        label: `Desconto ≥ ${minDesconto}%`,
        clear: () => patch({ min_discount: null }),
      });
    if (minInvest > 0)
      f.push({
        key: "inv",
        label: `Investimento ≥ ${minInvest}`,
        clear: () => patch({ min_investment: null }),
      });
    if (minVisual > 0)
      f.push({
        key: "visual",
        label: `Fachada ≥ ${minVisual}`,
        clear: () => patch({ min_visual_score: null }),
      });
    if (scoreKey !== "none" && scoreMin > 0)
      f.push({
        key: "goal",
        label: `${SCORE_LABEL[scoreKey]} ≥ ${scoreMin}`,
        clear: () => patch({ score_key: null, score_min: null }),
      });
    if (cluster !== "all") {
      const cl = clusters.find((c) => c.clusterId === cluster);
      f.push({
        key: "cluster",
        label: cl?.label ?? "Grupo",
        clear: () => patch({ cluster_id: null }),
      });
    }
    if (prazoLeilao > 0)
      f.push({
        key: "prazo",
        label: PRAZOS.find((p) => p.days === prazoLeilao)?.label ?? `${prazoLeilao} dias`,
        clear: () => patch({ auction_within_days: null }),
      });
    if (financiamento)
      f.push({
        key: "fin",
        label: "Aceita financiamento",
        clear: () => patch({ financing: null }),
      });
    if (fgts) f.push({ key: "fgts", label: "Aceita FGTS", clear: () => patch({ fgts: null }) });
    if (changeKind)
      f.push({
        key: "mudou",
        label: CHANGE_LABEL[changeKind],
        clear: () => patch({ change_kind: null, changed_within_days: null }),
      });
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, clusters]);

  const advCount = activeFilters.length;
  const advActive = advCount > 0;

  const imovelCount = [minQuartos > 0, maxPreco > 0, minArea > 0].filter(Boolean).length;
  const poiCount = poiCats.length + (maxCenter > 0 ? 1 : 0);
  const retornoCount = [
    minDesconto > 0,
    minInvest > 0,
    minVisual > 0,
    scoreKey !== "none" && scoreMin > 0,
  ].filter(Boolean).length;
  const leilaoCount = [prazoLeilao > 0, financiamento, fgts, !!changeKind].filter(Boolean).length;

  const ADVANCED_NULL: Record<string, string | null> = {
    range_dim: null,
    range_from: null,
    range_to: null,
    min_bedrooms: null,
    max_price: null,
    min_area: null,
    poi_cats: null,
    poi_ids: null,
    poi_radius_m: null,
    max_center_m: null,
    min_discount: null,
    min_investment: null,
    min_visual_score: null,
    score_key: null,
    score_min: null,
    financing: null,
    fgts: null,
    auction_within_days: null,
    cluster_id: null,
    change_kind: null,
    changed_within_days: null,
  };

  const clearAdvanced = () => {
    setPrecoInput("");
    patch(ADVANCED_NULL);
  };

  const clearAll = () => {
    setQInput("");
    setPrecoInput("");
    patch({ ...ADVANCED_NULL, q: null, uf: null, city: null, type: null, modalities: null });
  };

  const filtered =
    range != null ||
    uf !== "all" ||
    cidade !== "all" ||
    tipo !== "all" ||
    modalidade.length > 0 ||
    !!filters.q?.trim() ||
    advActive;
  const title = h3Label
    ? `Imóveis em ${h3Label}`
    : (clusterLabel ?? (filtered ? `${nImoveis(resultTotal)} encontrados` : "Todos os imóveis"));

  const VIEWS: { key: PropertiesView; label: string }[] = [
    { key: "list", label: "Lista" },
    { key: "analysis", label: "Análise" },
    { key: "calendar", label: "Calendário" },
    { key: "map", label: "Mapa" },
  ];

  const calDayOpen = !!calendar?.day && (calendar?.dayItems.length ?? 0) > 0;
  const mapProperties = useMemo(() => (map ? map.points.map(mapPointToProperty) : []), [map]);

  return (
    <>
      <div
        className="pagehead"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h1>{title}</h1>
          <p>
            {clusterLabel
              ? "Coleção com imóveis parecidos entre si. Clique em um imóvel para ver os detalhes."
              : "Lista de imóveis em leilão que estamos acompanhando. Clique em um imóvel para ver os detalhes."}
          </p>
        </div>
        {canAlert &&
          (alertExists ? (
            <Link className="btn ghost" href="/alerts" style={{ flexShrink: 0 }}>
              <IconBell width={16} height={16} strokeWidth={1.8} /> Editar alerta
              <IconArrow width={15} height={15} strokeWidth={1.8} />
            </Link>
          ) : (
            <button
              type="button"
              className="btn ghost"
              style={{ flexShrink: 0 }}
              onClick={createAlert}
            >
              <IconBell width={16} height={16} strokeWidth={1.8} /> Criar alerta com estes filtros
            </button>
          ))}
      </div>

      <div className="filterbar">
        <div className="searchmini">
          <IconSearch width={17} height={17} strokeWidth={1.7} />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Buscar por bairro, cidade ou tipo"
          />
        </div>
        <SearchableSelect
          label="Estado"
          allLabel="todos"
          value={uf}
          options={ufs.map((u) => ({ value: u, label: u }))}
          onChange={(v) => patch({ uf: v === "all" ? null : v, city: null })}
        />
        <SearchableSelect
          label="Cidade"
          allLabel="todas"
          value={cidade}
          options={cidades.map((c) => ({ value: c, label: c }))}
          onChange={(v) => patch({ city: v === "all" ? null : v })}
        />
        <select
          className="selectish"
          value={tipo}
          onChange={(e) => patch({ type: e.target.value === "all" ? null : e.target.value })}
        >
          <option value="all">Tipo: todos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <ModalityFilter
          options={modalidades}
          selected={modalidade}
          onChange={(v) => patch({ modalities: v.join(",") || null })}
        />
        <button
          className={`selectish${advActive ? " on" : ""}${canAdvanced ? "" : " locked"}`}
          type="button"
          onClick={() => require("advancedFilters") && setDrawerOpen(true)}
        >
          <IconSliders width={16} height={16} strokeWidth={1.8} />
          Filtros avançados{advCount > 0 && <span className="advcount">{advCount}</span>}
          {!canAdvanced && <PlanBadge feature="advancedFilters" />}
        </button>
        {filtered && (
          <button type="button" className="clearfilters" onClick={clearAll}>
            Limpar filtros
          </button>
        )}
      </div>

      {advActive && (
        <div className="appliedchips">
          {activeFilters.map((f) => (
            <button key={f.key} type="button" className="appchip" onClick={f.clear}>
              {f.label}
              <span className="appchip-x" aria-hidden>
                ✕
              </span>
            </button>
          ))}
        </div>
      )}

      {mounted &&
        createPortal(
          <>
            <div
              className={`drawerscrim${drawerOpen ? " on" : ""}`}
              onClick={() => setDrawerOpen(false)}
            />
            <aside
              className={`filterdrawer${drawerOpen ? " on" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label="Filtros avançados"
            >
              <div className="drawerhead">
                <h2>Filtros avançados</h2>
                <button
                  type="button"
                  className="dclose"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <div className="dbody">
                <Section
                  title="Grupo"
                  count={cluster !== "all" ? 1 : 0}
                  open={openSecs.has("grupo")}
                  onToggle={() => toggleSec("grupo")}
                >
                  <div className="flabel">Grupo de imóveis</div>
                  <SearchableSelect
                    label="Grupo"
                    allLabel="Todos os grupos"
                    showLabel={false}
                    className="fwide"
                    value={cluster === "all" ? "all" : String(cluster)}
                    options={clusters.map((c) => ({
                      value: String(c.clusterId),
                      label: c.label,
                    }))}
                    onChange={(v) => patch({ cluster_id: v === "all" ? null : v })}
                  />
                </Section>
                <Section
                  title="Imóvel"
                  count={imovelCount}
                  open={openSecs.has("imovel")}
                  onToggle={() => toggleSec("imovel")}
                >
                  <div className="flabel">Quartos (mínimo)</div>
                  <div className="fchiprow">
                    <Chip active={!minQuartos} onClick={() => patch({ min_bedrooms: null })}>
                      Qualquer
                    </Chip>
                    {QUARTOS_STEPS.map((v) => (
                      <Chip
                        key={v}
                        active={minQuartos === v}
                        onClick={() => patch({ min_bedrooms: String(v) })}
                      >
                        {v}+
                      </Chip>
                    ))}
                  </div>

                  <div className="flabel">Preço máximo</div>
                  <div className="fchiprow">
                    <Chip active={!maxPreco} onClick={() => setPreco(0)}>
                      Qualquer
                    </Chip>
                    {PRICE_STEPS.map((v) => (
                      <Chip key={v} active={maxPreco === v} onClick={() => setPreco(v)}>
                        ≤ {moneyShort(v)}
                      </Chip>
                    ))}
                  </div>
                  <div className="fcustom">
                    <span>Outro valor:</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={10_000}
                      placeholder="R$"
                      value={precoInput}
                      onChange={(e) => setPrecoInput(e.target.value)}
                    />
                  </div>

                  <div className="flabel">Área mínima</div>
                  <div className="fchiprow">
                    <Chip active={!minArea} onClick={() => patch({ min_area: null })}>
                      Qualquer
                    </Chip>
                    {AREA_STEPS.map((v) => (
                      <Chip
                        key={v}
                        active={minArea === v}
                        onClick={() => patch({ min_area: String(v) })}
                      >
                        {v}+ m²
                      </Chip>
                    ))}
                  </div>
                </Section>

                <Section
                  title="Perto de"
                  count={poiCount}
                  open={openSecs.has("poi")}
                  onToggle={() => toggleSec("poi")}
                >
                  <div className="flabel">Pontos de interesse</div>
                  <div className="poigrid">
                    {visiblePoiCats.map((c) => {
                      const Icon = POI_ICON[c];
                      return (
                        <button
                          key={c}
                          type="button"
                          className={`poicat${poiCats.includes(c) ? " on" : ""}`}
                          onClick={() => toggleCat(c)}
                        >
                          {Icon && <Icon />}
                          {POI_LABEL[c] ?? c}
                        </button>
                      );
                    })}
                  </div>
                  {poiCategories.length > POI_VISIBLE && (
                    <button
                      type="button"
                      className="poimoretoggle"
                      onClick={() => setPoiExpanded((v) => !v)}
                    >
                      {poiExpanded
                        ? "Ver menos"
                        : `Ver mais ${poiCategories.length - POI_VISIBLE} categorias`}
                    </button>
                  )}
                  <div className="flabel">Distância máxima</div>
                  <div className="fseg">
                    {POI_RADII.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={poiRadius === v ? "on" : ""}
                        onClick={() => poiCats.length && patch({ poi_radius_m: String(v) })}
                      >
                        {fmtDist(v)}
                      </button>
                    ))}
                  </div>
                  <p className="fhint">
                    Mostra imóveis com pelo menos um ponto de <b>cada</b> categoria escolhida dentro
                    da distância (máximo {MAX_NEAR_M / 1000} km).
                  </p>

                  <div className="flabel">Distância do centro (máx.)</div>
                  <div className="fchiprow">
                    <Chip active={!maxCenter} onClick={() => patch({ max_center_m: null })}>
                      Qualquer
                    </Chip>
                    {CENTER_STEPS.map((v) => (
                      <Chip
                        key={v}
                        active={maxCenter === v}
                        onClick={() => patch({ max_center_m: String(v) })}
                      >
                        ≤ {fmtDist(v)}
                      </Chip>
                    ))}
                  </div>
                </Section>

                <Section
                  title="Retorno e notas"
                  count={retornoCount}
                  open={openSecs.has("retorno")}
                  onToggle={() => toggleSec("retorno")}
                >
                  <div className="flabel">Desconto mínimo</div>
                  <div className="fchiprow">
                    <Chip active={!minDesconto} onClick={() => patch({ min_discount: null })}>
                      Qualquer
                    </Chip>
                    {DESCONTO_STEPS.map((v) => (
                      <Chip
                        key={v}
                        active={minDesconto === v}
                        onClick={() => patch({ min_discount: String(v) })}
                      >
                        ≥ {v}%
                      </Chip>
                    ))}
                  </div>

                  <div className="flabel">Nota de investimento</div>
                  <div className="fchiprow">
                    <Chip active={!minInvest} onClick={() => patch({ min_investment: null })}>
                      Qualquer
                    </Chip>
                    {INVEST_STEPS.map((v) => (
                      <Chip
                        key={v}
                        active={minInvest === v}
                        onClick={() => patch({ min_investment: String(v) })}
                      >
                        ≥ {v}
                      </Chip>
                    ))}
                  </div>

                  {filterOptions.visualScore && (
                    <>
                      <div className="flabel">Avaliação visual da fachada</div>
                      <div className="fchiprow">
                        <Chip active={!minVisual} onClick={() => patch({ min_visual_score: null })}>
                          Qualquer
                        </Chip>
                        {VISUAL_STEPS.map((v) => (
                          <Chip
                            key={v}
                            active={minVisual === v}
                            onClick={() => patch({ min_visual_score: String(v) })}
                          >
                            ≥ {v}
                          </Chip>
                        ))}
                      </div>
                      <p className="fhint">
                        Nota de 0 a 100 que o modelo de visão dá à foto do anúncio (fachada,
                        acabamento e conservação). Imóveis sem foto avaliada ficam de fora.
                      </p>
                    </>
                  )}

                  <div className="flabel">Nota do objetivo</div>
                  <select
                    className={`selectish fwide${scoreKey !== "none" ? " on" : ""}`}
                    value={scoreKey}
                    onChange={(e) => {
                      const v = e.target.value as keyof Scores | "none";
                      if (v === "none") patch({ score_key: null, score_min: null });
                      else patch({ score_key: v, score_min: String(scoreMin || 70) });
                    }}
                  >
                    <option value="none">Escolha um objetivo…</option>
                    {SCORE_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {SCORE_LABEL[k]}
                      </option>
                    ))}
                  </select>
                  {scoreKey !== "none" && (
                    <>
                      <div className="flabel">Nota mínima · {SCORE_LABEL[scoreKey]}</div>
                      <div className="fchiprow">
                        {GOAL_STEPS.map((v) => (
                          <Chip
                            key={v}
                            active={scoreMin === v}
                            onClick={() => patch({ score_min: String(v) })}
                          >
                            ≥ {v}
                          </Chip>
                        ))}
                      </div>
                    </>
                  )}
                </Section>

                <Section
                  title="Leilão e pagamento"
                  count={leilaoCount}
                  open={openSecs.has("leilao")}
                  onToggle={() => toggleSec("leilao")}
                >
                  <div className="flabel">Data do leilão</div>
                  <div className="fchiprow">
                    <Chip
                      active={!prazoLeilao}
                      onClick={() => patch({ auction_within_days: null })}
                    >
                      Qualquer data
                    </Chip>
                    {PRAZOS.map((pr) => (
                      <Chip
                        key={pr.days}
                        active={prazoLeilao === pr.days}
                        onClick={() => patch({ auction_within_days: String(pr.days) })}
                      >
                        {pr.days} dias
                      </Chip>
                    ))}
                  </div>

                  <div className="flabel">Pagamento</div>
                  <label className={`checkitem${financiamento ? " on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={financiamento}
                      onChange={(e) => patch({ financing: e.target.checked ? "1" : null })}
                    />
                    Aceita financiamento
                  </label>
                  <label className={`checkitem${fgts ? " on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={fgts}
                      onChange={(e) => patch({ fgts: e.target.checked ? "1" : null })}
                    />
                    Aceita FGTS
                  </label>

                  <div className="flabel">Mudou recentemente</div>
                  <div className="fchiprow">
                    <Chip
                      active={!changeKind}
                      onClick={() => patch({ change_kind: null, changed_within_days: null })}
                    >
                      Qualquer
                    </Chip>
                    {Object.entries(CHANGE_LABEL).map(([key, label]) => (
                      <Chip
                        key={key}
                        active={changeKind === key}
                        onClick={() =>
                          patch({
                            change_kind: key,
                            changed_within_days: String(CHANGE_WINDOW_DAYS),
                          })
                        }
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                  <p className="fhint">
                    Comparado ao que o imóvel era há {CHANGE_WINDOW_DAYS} dias.
                  </p>
                </Section>
              </div>

              <div className="dfoot">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={clearAdvanced}
                  disabled={!advActive}
                >
                  Limpar
                </button>
                <button
                  type="button"
                  className="btn solid dshow"
                  onClick={() => setDrawerOpen(false)}
                  disabled={!resultTotal}
                >
                  {isPending
                    ? "Atualizando…"
                    : resultTotal
                      ? `Mostrar ${nImoveis(resultTotal)}`
                      : "Nenhum imóvel"}
                </button>
              </div>
            </aside>
          </>,
          document.body,
        )}

      <div className="viewbar">
        <div className="viewtoggle">
          {/* A view the plan does not include is not offered at all; a deep link to it still
              lands on the upsell below. */}
          {VIEWS.filter((v) => {
            const feature = VIEW_FEATURE[v.key];
            return !feature || can(feature);
          }).map((v) => (
            <button
              key={v.key}
              type="button"
              className={view === v.key ? "on" : ""}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
        {(view === "list" || (view === "calendar" && calDayOpen)) && (
          <select
            className="selectish"
            value={sortParam(sort)}
            onChange={(e) =>
              patch({ sort: e.target.value === DEFAULT_SORT ? null : e.target.value })
            }
          >
            {PROPERTY_SORTS.map((s) => (
              <option key={s.param} value={s.param}>
                Ordenar: {s.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="viewcontent">
        {isPending && <div className="viewloadbar" aria-hidden />}
        {/* the calendar dims its own day panel instead */}
        <div className={`viewinner${isPending && view !== "calendar" ? " loading" : ""}`}>
          {lockedView && VIEW_FEATURE[lockedView] ? (
            <UpgradeWall feature={VIEW_FEATURE[lockedView]!} role={role} trial={trial} />
          ) : view === "map" ? (
            map && map.points.length ? (
              <>
                {map.total > map.points.length && (
                  <p className="fhint" style={{ margin: "0 0 10px" }}>
                    Mostrando os {map.points.length.toLocaleString("pt-BR")} imóveis com melhor nota
                    de investimento de {map.total.toLocaleString("pt-BR")}. Refine os filtros para
                    ver todos no mapa.
                  </p>
                )}
                <PropertiesMap properties={mapProperties} />
              </>
            ) : (
              <EmptyState icon={<IconBuilding />} title="Nenhum imóvel para mostrar no mapa">
                Tente remover um filtro ou limpar a busca para ver imóveis no mapa.
              </EmptyState>
            )
          ) : view === "analysis" ? (
            analysis && <PropertiesAnalysis data={analysis} onPickRange={pickRange} />
          ) : view === "calendar" ? (
            calendar && (
              <AuctionCalendar
                counts={calendar.counts}
                day={calendar.day}
                dayItems={calendar.dayItems}
                dayTotal={calendar.dayTotal}
                page={page}
                loading={isPending}
                onSelectDay={(d) => setParams({ day: d, page: null })}
                onPageChange={goTo}
              />
            )
          ) : list && list.items.length ? (
            <>
              <div className="wlist">
                {list.items.map((p) => (
                  <PropertyRow key={p.id} p={p} poiCats={poiCats} poiRadius={poiRadius} />
                ))}
              </div>
              <Pagination
                page={page}
                total={list.total}
                pageSize={LIST_PAGE_SIZE}
                onChange={goTo}
              />
            </>
          ) : (
            <EmptyState icon={<IconBuilding />} title="Nenhum imóvel encontrado com esses filtros">
              Tente remover um filtro ou limpar a busca para ver mais resultados.
            </EmptyState>
          )}
        </div>
      </div>
    </>
  );
}
