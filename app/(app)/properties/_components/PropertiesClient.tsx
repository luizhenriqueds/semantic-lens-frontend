"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import PropertyRow from "@/components/property/PropertyRow";
import SearchableSelect from "@/components/ui/SearchableSelect";
import AuctionCalendar from "./AuctionCalendar";
import PropertiesAnalysis from "./PropertiesAnalysis";
import { useToast } from "@/components/ui/Toaster";
import { fmtDist, investmentScore, moneyShort, profileScore, SCORE_LABEL } from "@/lib/format";
import {
  describeFilters,
  hasAnyFilter,
  matchesFilters,
  matchesText,
  useAlerts,
} from "@/lib/alerts";
import { useSaved } from "@/lib/saved";
import type { AlertFilters, Cluster, Property, Scores } from "@/lib/types";
import { IconArrow, IconBell, IconBuilding, IconSearch, IconSliders, POI_ICON } from "@/lib/icons";
import { MAX_NEAR_M, POI_LABEL, POI_ORDER } from "@/lib/pois";

const PropertiesMap = dynamic(() => import("@/components/property/PropertiesMap"), {
  ssr: false,
  loading: () => <div className="lmap propmap loading">Carregando mapa…</div>,
});

type View = "list" | "analysis" | "calendar" | "map";

const PAGE_SIZE = 25;

type Sort = "investimento" | "desconto" | "score" | "leilao" | "menor" | "maior";

const SORTS: { key: Sort; label: string }[] = [
  { key: "leilao", label: "Data do leilão (mais próxima)" },
  { key: "investimento", label: "Melhor investimento" },
  { key: "desconto", label: "Maior desconto" },
  { key: "score", label: "Melhor nota do objetivo" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
];

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
const GOAL_STEPS = [50, 60, 70, 80, 90];
const POI_RADII = [500, 1000, 2000, 5000];
const CENTER_STEPS = [1000, 2000, 5000, 10_000];
const POI_VISIBLE = 12;

const PRAZOS: { days: number; label: string }[] = [
  { days: 7, label: "Próximos 7 dias" },
  { days: 15, label: "Próximos 15 dias" },
  { days: 30, label: "Próximos 30 dias" },
  { days: 60, label: "Próximos 60 dias" },
];

const auctionTime = (iso: string | null): number => {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  return isNaN(t) ? Infinity : t;
};

const nImoveis = (n: number) => `${n} ${n === 1 ? "imóvel" : "imóveis"}`;

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
  properties,
  clusters,
  initialCluster,
  initialCity,
  initialView = "list",
  h3,
  h3Label,
}: {
  properties: Property[];
  clusters: Cluster[];
  initialCluster?: number;
  initialCity?: string;
  initialView?: View;
  h3?: string;
  h3Label?: string;
}) {
  const [q, setQ] = useState("");
  const [uf, setUf] = useState("all");
  const [cidade, setCidade] = useState(initialCity ?? "all");
  const [tipo, setTipo] = useState("all");
  const [cluster, setCluster] = useState<number | "all">(initialCluster ?? "all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSecs, setOpenSecs] = useState<Set<string>>(new Set(["grupo", "imovel", "poi"]));
  const [minQuartos, setMinQuartos] = useState(0);
  const [maxPreco, setMaxPreco] = useState(0); // 0 = sem limite
  const [precoInput, setPrecoInput] = useState("");
  const [minArea, setMinArea] = useState(0);
  const [poiCats, setPoiCats] = useState<string[]>([]);
  const [poiRadius, setPoiRadius] = useState(2000);
  const [poiExpanded, setPoiExpanded] = useState(false);
  const [maxCenter, setMaxCenter] = useState(0);
  const [minDesconto, setMinDesconto] = useState(0);
  const [minInvest, setMinInvest] = useState(0);
  const [scoreKey, setScoreKey] = useState<keyof Scores | "none">("none");
  const [scoreMin, setScoreMin] = useState(0);
  const [financiamento, setFinanciamento] = useState(false);
  const [fgts, setFgts] = useState(false);
  const [modalidade, setModalidade] = useState<string[]>([]);
  const [prazoLeilao, setPrazoLeilao] = useState(0);
  const [sort, setSort] = useState<Sort>("leilao");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>(initialView);
  const [calDayOpen, setCalDayOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [restored, setRestored] = useState(false);
  const stateKey = useRef("");

  // Restore the previous search on return (e.g. "Voltar" from a property),
  // keyed by URL query so deep-links keep separate buckets.
  useEffect(() => {
    setMounted(true);
    stateKey.current = `properties:v1:${window.location.search}`;
    try {
      const raw = sessionStorage.getItem(stateKey.current);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.q != null) setQ(s.q);
        if (s.uf != null) setUf(s.uf);
        if (s.cidade != null) setCidade(s.cidade);
        if (s.tipo != null) setTipo(s.tipo);
        if (s.cluster != null) setCluster(s.cluster);
        if (s.minQuartos != null) setMinQuartos(s.minQuartos);
        if (s.maxPreco != null) setMaxPreco(s.maxPreco);
        if (s.precoInput != null) setPrecoInput(s.precoInput);
        if (s.minArea != null) setMinArea(s.minArea);
        if (Array.isArray(s.poiCats)) setPoiCats(s.poiCats);
        if (s.poiRadius != null) setPoiRadius(s.poiRadius);
        if (s.maxCenter != null) setMaxCenter(s.maxCenter);
        if (s.minDesconto != null) setMinDesconto(s.minDesconto);
        if (s.minInvest != null) setMinInvest(s.minInvest);
        if (s.scoreKey != null) setScoreKey(s.scoreKey);
        if (s.scoreMin != null) setScoreMin(s.scoreMin);
        if (s.financiamento != null) setFinanciamento(s.financiamento);
        if (s.fgts != null) setFgts(s.fgts);
        if (Array.isArray(s.modalidade)) setModalidade(s.modalidade);
        if (s.prazoLeilao != null) setPrazoLeilao(s.prazoLeilao);
        if (s.sort != null) setSort(s.sort);
        if (s.view != null) setView(s.view);
      }
    } catch {}
    setRestored(true);
  }, []);
  const { alerts, add: addAlert } = useAlerts();
  const { ids: savedIds } = useSaved();
  const toast = useToast();

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
  const modalidades = useMemo(
    () =>
      Array.from(new Set(properties.map((p) => p.modality).filter((m): m is string => !!m))).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [properties],
  );
  // POI categories that actually occur in the dataset, in the canonical order.
  const poiCategories = useMemo(() => {
    const present = new Set<string>();
    for (const p of properties) for (const c of Object.keys(p.nearestPoi)) present.add(c);
    return POI_ORDER.filter((c) => present.has(c));
  }, [properties]);
  // Collapsed to the top categories; selected ones beyond the cut stay visible.
  const visiblePoiCats = useMemo(() => {
    if (poiExpanded || poiCategories.length <= POI_VISIBLE) return poiCategories;
    const top = poiCategories.slice(0, POI_VISIBLE);
    const extra = poiCategories.slice(POI_VISIBLE).filter((c) => poiCats.includes(c));
    return [...top, ...extra];
  }, [poiExpanded, poiCategories, poiCats]);

  const clusterLabel =
    cluster !== "all" ? clusters.find((c) => c.clusterId === cluster)?.label : undefined;

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const auctionMax = prazoLeilao ? now.getTime() + prazoLeilao * 86_400_000 : 0;
    const list = properties.filter((p) => {
      if (
        p.inactive &&
        !savedIds.includes(p.id) &&
        !alerts.some((a) => a.filters && matchesFilters(p, a.filters))
      ) {
        return false;
      }
      if (h3 && p.h3 !== h3) return false;
      if (cluster !== "all" && p.clusterId !== cluster) return false;
      if (uf !== "all" && p.uf !== uf) return false;
      if (cidade !== "all" && p.city !== cidade) return false;
      if (tipo !== "all" && p.propertyType !== tipo) return false;
      if (modalidade.length > 0 && !(p.modality != null && modalidade.includes(p.modality)))
        return false;
      if (prazoLeilao) {
        if (!p.auctionDate) return false;
        const t = new Date(p.auctionDate).getTime();
        if (isNaN(t) || t < startToday || t > auctionMax) return false;
      }
      if (minQuartos && (p.bedrooms ?? 0) < minQuartos) return false;
      if (maxPreco && (p.saleValue ?? Infinity) > maxPreco) return false;
      if (minArea && (p.area ?? 0) < minArea) return false;
      if (poiCats.length) {
        for (const c of poiCats) {
          const d = p.nearestPoi[c];
          if (d == null || d > poiRadius) return false;
        }
      }
      if (maxCenter && (p.centerProximity == null || p.centerProximity > maxCenter)) return false;
      if (minDesconto && (p.discount ?? 0) < minDesconto) return false;
      if (minInvest && (p.scores.investment ?? 0) < minInvest) return false;
      if (scoreKey !== "none" && scoreMin && (p.scores[scoreKey] ?? 0) < scoreMin) return false;
      if (financiamento && !p.acceptsFinancing) return false;
      if (fgts && !p.acceptsFgts) return false;
      if (term && !matchesText(p, term)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "investimento") return (investmentScore(b) ?? 0) - (investmentScore(a) ?? 0);
      if (sort === "desconto") return (b.discount ?? 0) - (a.discount ?? 0);
      if (sort === "score") return (profileScore(b) ?? 0) - (profileScore(a) ?? 0);
      if (sort === "leilao") return auctionTime(a.auctionDate) - auctionTime(b.auctionDate);
      if (sort === "menor") return (a.saleValue ?? Infinity) - (b.saleValue ?? Infinity);
      return (b.saleValue ?? 0) - (a.saleValue ?? 0);
    });
    return list;
  }, [
    properties,
    alerts,
    savedIds,
    q,
    uf,
    cidade,
    tipo,
    cluster,
    sort,
    h3,
    minQuartos,
    maxPreco,
    minArea,
    poiCats,
    poiRadius,
    maxCenter,
    minDesconto,
    minInvest,
    scoreKey,
    scoreMin,
    financiamento,
    fgts,
    modalidade,
    prazoLeilao,
  ]);

  useEffect(
    () => setPage(1),
    [
      q,
      uf,
      cidade,
      tipo,
      cluster,
      sort,
      h3,
      minQuartos,
      maxPreco,
      minArea,
      poiCats,
      poiRadius,
      maxCenter,
      minDesconto,
      minInvest,
      scoreKey,
      scoreMin,
      financiamento,
      fgts,
      modalidade,
      prazoLeilao,
    ],
  );

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(
        stateKey.current,
        JSON.stringify({
          q,
          uf,
          cidade,
          tipo,
          cluster,
          minQuartos,
          maxPreco,
          precoInput,
          minArea,
          poiCats,
          poiRadius,
          maxCenter,
          minDesconto,
          minInvest,
          scoreKey,
          scoreMin,
          financiamento,
          fgts,
          modalidade,
          prazoLeilao,
          sort,
          view,
        }),
      );
    } catch {}
  }, [
    restored,
    q,
    uf,
    cidade,
    tipo,
    cluster,
    minQuartos,
    maxPreco,
    precoInput,
    minArea,
    poiCats,
    poiRadius,
    maxCenter,
    minDesconto,
    minInvest,
    scoreKey,
    scoreMin,
    financiamento,
    fgts,
    modalidade,
    prazoLeilao,
    sort,
    view,
  ]);

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

  const priceCapped = maxPreco > 0;

  const alertFilters = useMemo<AlertFilters>(() => {
    const f: AlertFilters = {};
    if (q.trim()) f.q = q.trim();
    if (uf !== "all") f.uf = uf;
    if (cidade !== "all") f.city = cidade;
    if (tipo !== "all") f.propertyType = tipo;
    if (modalidade.length) f.modalities = modalidade;
    if (minDesconto) f.minDiscount = minDesconto;
    if (priceCapped) f.maxPrice = maxPreco;
    if (minQuartos) f.minBedrooms = minQuartos;
    if (minArea) f.minArea = minArea;
    if (poiCats.length) {
      f.poiCats = poiCats;
      f.poiRadius = poiRadius;
    }
    if (maxCenter) f.maxCenter = maxCenter;
    if (scoreKey !== "none" && scoreMin) {
      f.scoreKey = scoreKey;
      f.minScore = scoreMin;
    } else if (minInvest) {
      f.minScore = minInvest; // no scoreKey → applies to Investimento
    }
    return f;
  }, [
    q,
    uf,
    cidade,
    tipo,
    modalidade,
    minDesconto,
    priceCapped,
    maxPreco,
    minQuartos,
    minArea,
    poiCats,
    poiRadius,
    maxCenter,
    scoreKey,
    scoreMin,
    minInvest,
  ]);

  const canAlert = hasAnyFilter(alertFilters);
  const alertLabel = useMemo(() => describeFilters(alertFilters), [alertFilters]);
  const alertExists =
    canAlert && alerts.some((a) => a.name.trim().toLowerCase() === alertLabel.trim().toLowerCase());

  const createAlert = async () => {
    if (!canAlert) return;
    const ok = await addAlert(alertLabel, "Aviso diário", alertFilters);
    toast(ok ? "Alerta criado" : "Você já tem um alerta com estes filtros");
  };

  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSec = (id: string) =>
    setOpenSecs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleCat = (c: string) =>
    setPoiCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const setPreco = (v: number) => {
    setMaxPreco(v);
    setPrecoInput(v ? String(v) : "");
  };

  // Active advanced filters, driving the badge, the applied-chips row and the
  // per-section counts. Each carries the action that removes it.
  const activeFilters = useMemo(() => {
    const f: { key: string; label: string; clear: () => void }[] = [];
    if (maxPreco > 0)
      f.push({ key: "preco", label: `Até ${moneyShort(maxPreco)}`, clear: () => setPreco(0) });
    if (minQuartos > 0)
      f.push({ key: "quartos", label: `${minQuartos}+ quartos`, clear: () => setMinQuartos(0) });
    if (minArea > 0) f.push({ key: "area", label: `${minArea}+ m²`, clear: () => setMinArea(0) });
    for (const c of poiCats)
      f.push({
        key: `poi-${c}`,
        label: `${POI_LABEL[c] ?? c} · até ${fmtDist(poiRadius)}`,
        clear: () => toggleCat(c),
      });
    if (maxCenter > 0)
      f.push({
        key: "center",
        label: `Até ${fmtDist(maxCenter)} do centro`,
        clear: () => setMaxCenter(0),
      });
    if (minDesconto > 0)
      f.push({ key: "desc", label: `Desconto ≥ ${minDesconto}%`, clear: () => setMinDesconto(0) });
    if (minInvest > 0)
      f.push({ key: "inv", label: `Investimento ≥ ${minInvest}`, clear: () => setMinInvest(0) });
    if (scoreKey !== "none" && scoreMin > 0)
      f.push({
        key: "goal",
        label: `${SCORE_LABEL[scoreKey]} ≥ ${scoreMin}`,
        clear: () => {
          setScoreKey("none");
          setScoreMin(0);
        },
      });
    if (cluster !== "all") {
      const cl = clusters.find((c) => c.clusterId === cluster);
      f.push({ key: "cluster", label: cl?.label ?? "Grupo", clear: () => setCluster("all") });
    }
    if (prazoLeilao > 0)
      f.push({
        key: "prazo",
        label: PRAZOS.find((p) => p.days === prazoLeilao)?.label ?? `${prazoLeilao} dias`,
        clear: () => setPrazoLeilao(0),
      });
    if (financiamento)
      f.push({ key: "fin", label: "Aceita financiamento", clear: () => setFinanciamento(false) });
    if (fgts) f.push({ key: "fgts", label: "Aceita FGTS", clear: () => setFgts(false) });
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    maxPreco,
    minQuartos,
    minArea,
    poiCats,
    poiRadius,
    maxCenter,
    minDesconto,
    minInvest,
    scoreKey,
    scoreMin,
    cluster,
    clusters,
    prazoLeilao,
    financiamento,
    fgts,
  ]);

  const advCount = activeFilters.length;
  const advActive = advCount > 0;

  const imovelCount = [minQuartos > 0, maxPreco > 0, minArea > 0].filter(Boolean).length;
  const poiCount = poiCats.length + (maxCenter > 0 ? 1 : 0);
  const retornoCount = [minDesconto > 0, minInvest > 0, scoreKey !== "none" && scoreMin > 0].filter(
    Boolean,
  ).length;
  const leilaoCount = [prazoLeilao > 0, financiamento, fgts].filter(Boolean).length;

  const clearAdvanced = () => {
    setMinQuartos(0);
    setPreco(0);
    setMinArea(0);
    setPoiCats([]);
    setPoiRadius(2000);
    setMaxCenter(0);
    setMinDesconto(0);
    setMinInvest(0);
    setScoreKey("none");
    setScoreMin(0);
    setFinanciamento(false);
    setFgts(false);
    setPrazoLeilao(0);
    setCluster("all");
  };

  const clearAll = () => {
    setQ("");
    setUf("all");
    setCidade("all");
    setTipo("all");
    setModalidade([]);
    clearAdvanced();
  };

  const filtered =
    uf !== "all" ||
    cidade !== "all" ||
    tipo !== "all" ||
    modalidade.length > 0 ||
    q.trim() ||
    advActive;
  const title = h3Label
    ? `Imóveis em ${h3Label}`
    : (clusterLabel ?? (filtered ? `${nImoveis(items.length)} encontrados` : "Todos os imóveis"));

  const VIEWS: { key: View; label: string }[] = [
    { key: "list", label: "Lista" },
    { key: "analysis", label: "Análise" },
    { key: "calendar", label: "Calendário" },
    { key: "map", label: "Mapa" },
  ];

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
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por bairro, cidade ou tipo"
          />
        </div>
        <SearchableSelect
          label="Estado"
          allLabel="todos"
          value={uf}
          options={ufs.map((u) => ({ value: u, label: u }))}
          onChange={(v) => {
            setUf(v);
            setCidade("all");
          }}
        />
        <SearchableSelect
          label="Cidade"
          allLabel="todas"
          value={cidade}
          options={cidades.map((c) => ({ value: c, label: c }))}
          onChange={setCidade}
        />
        <select className="selectish" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="all">Tipo: todos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <ModalityFilter options={modalidades} selected={modalidade} onChange={setModalidade} />
        <button
          className={`selectish${advActive ? " on" : ""}`}
          type="button"
          onClick={() => setDrawerOpen(true)}
        >
          <IconSliders width={16} height={16} strokeWidth={1.8} />
          Filtros avançados{advCount > 0 && <span className="advcount">{advCount}</span>}
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
                  <select
                    className="selectish fwide"
                    value={cluster === "all" ? "all" : String(cluster)}
                    onChange={(e) =>
                      setCluster(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                  >
                    <option value="all">Todos os grupos</option>
                    {clusters.map((c) => (
                      <option key={c.clusterId} value={String(c.clusterId)}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Section>
                <Section
                  title="Imóvel"
                  count={imovelCount}
                  open={openSecs.has("imovel")}
                  onToggle={() => toggleSec("imovel")}
                >
                  <div className="flabel">Quartos (mínimo)</div>
                  <div className="fchiprow">
                    <Chip active={!minQuartos} onClick={() => setMinQuartos(0)}>
                      Qualquer
                    </Chip>
                    {QUARTOS_STEPS.map((v) => (
                      <Chip key={v} active={minQuartos === v} onClick={() => setMinQuartos(v)}>
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
                      onChange={(e) => {
                        setPrecoInput(e.target.value);
                        setMaxPreco(Math.max(0, Number(e.target.value) || 0));
                      }}
                    />
                  </div>

                  <div className="flabel">Área mínima</div>
                  <div className="fchiprow">
                    <Chip active={!minArea} onClick={() => setMinArea(0)}>
                      Qualquer
                    </Chip>
                    {AREA_STEPS.map((v) => (
                      <Chip key={v} active={minArea === v} onClick={() => setMinArea(v)}>
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
                        onClick={() => setPoiRadius(v)}
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
                    <Chip active={!maxCenter} onClick={() => setMaxCenter(0)}>
                      Qualquer
                    </Chip>
                    {CENTER_STEPS.map((v) => (
                      <Chip key={v} active={maxCenter === v} onClick={() => setMaxCenter(v)}>
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
                    <Chip active={!minDesconto} onClick={() => setMinDesconto(0)}>
                      Qualquer
                    </Chip>
                    {DESCONTO_STEPS.map((v) => (
                      <Chip key={v} active={minDesconto === v} onClick={() => setMinDesconto(v)}>
                        ≥ {v}%
                      </Chip>
                    ))}
                  </div>

                  <div className="flabel">Nota de investimento</div>
                  <div className="fchiprow">
                    <Chip active={!minInvest} onClick={() => setMinInvest(0)}>
                      Qualquer
                    </Chip>
                    {INVEST_STEPS.map((v) => (
                      <Chip key={v} active={minInvest === v} onClick={() => setMinInvest(v)}>
                        ≥ {v}
                      </Chip>
                    ))}
                  </div>

                  <div className="flabel">Nota do objetivo</div>
                  <select
                    className={`selectish fwide${scoreKey !== "none" ? " on" : ""}`}
                    value={scoreKey}
                    onChange={(e) => {
                      const v = e.target.value as keyof Scores | "none";
                      setScoreKey(v);
                      if (v !== "none" && scoreMin === 0) setScoreMin(70);
                      if (v === "none") setScoreMin(0);
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
                          <Chip key={v} active={scoreMin === v} onClick={() => setScoreMin(v)}>
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
                    <Chip active={!prazoLeilao} onClick={() => setPrazoLeilao(0)}>
                      Qualquer data
                    </Chip>
                    {PRAZOS.map((pr) => (
                      <Chip
                        key={pr.days}
                        active={prazoLeilao === pr.days}
                        onClick={() => setPrazoLeilao(pr.days)}
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
                      onChange={(e) => setFinanciamento(e.target.checked)}
                    />
                    Aceita financiamento
                  </label>
                  <label className={`checkitem${fgts ? " on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={fgts}
                      onChange={(e) => setFgts(e.target.checked)}
                    />
                    Aceita FGTS
                  </label>
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
                  disabled={!items.length}
                >
                  {items.length ? `Mostrar ${nImoveis(items.length)}` : "Nenhum imóvel"}
                </button>
              </div>
            </aside>
          </>,
          document.body,
        )}

      <div className="viewbar">
        <div className="viewtoggle">
          {VIEWS.map((v) => (
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
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                Ordenar: {s.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {view === "map" ? (
        items.length ? (
          <PropertiesMap properties={items} />
        ) : (
          <EmptyState icon={<IconBuilding />} title="Nenhum imóvel para mostrar no mapa">
            Tente remover um filtro ou limpar a busca para ver imóveis no mapa.
          </EmptyState>
        )
      ) : view === "analysis" ? (
        <PropertiesAnalysis items={items} />
      ) : view === "calendar" ? (
        <AuctionCalendar items={items} onDayOpen={setCalDayOpen} />
      ) : items.length ? (
        <>
          <div className="wlist">
            {pageItems.map((p) => (
              <PropertyRow key={p.id} p={p} poiCats={poiCats} poiRadius={poiRadius} />
            ))}
          </div>
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
