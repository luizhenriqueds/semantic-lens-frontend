"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import PropertyRow from "@/components/property/PropertyRow";
import Slider from "@/components/ui/Slider";
import OptionPicker from "@/components/ui/OptionPicker";
import SearchableSelect from "@/components/ui/SearchableSelect";
import AuctionCalendar from "./AuctionCalendar";
import PropertiesAnalysis from "./PropertiesAnalysis";
import { useToast } from "@/components/ui/Toaster";
import { investmentScore, moneyShort, profileScore, SCORE_LABEL } from "@/lib/format";
import { useAlerts } from "@/lib/alerts";
import { useSaved } from "@/lib/saved";
import { describeFilters, hasAnyFilter, matchesFilters } from "@/lib/alertFilters";
import type { AlertFilters, Cluster, Property, Scores } from "@/lib/types";
import { IconArrow, IconBell, IconBuilding, IconSearch } from "@/lib/icons";

const PropertiesMap = dynamic(() => import("@/components/property/PropertiesMap"), {
  ssr: false,
  loading: () => <div className="lmap propmap loading">Carregando mapa…</div>,
});

type View = "list" | "analysis" | "calendar" | "map";

const PAGE_SIZE = 25;

type Sort = "investimento" | "desconto" | "score" | "leilao" | "menor" | "maior";

const SORTS: { key: Sort; label: string }[] = [
  { key: "investimento", label: "Melhor investimento" },
  { key: "desconto", label: "Maior desconto" },
  { key: "score", label: "Melhor nota do objetivo" },
  { key: "leilao", label: "Leilão mais próximo" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
];

// Score dimensions offered by the "filter by score" control (investment has its
// own slider, so it is excluded here).
const SCORE_KEYS: (keyof Scores)[] = [
  "flip",
  "liquidity",
  "airbnb",
  "student",
  "family",
  "commercial",
  "convenience",
];
const SCORE_THRESHOLDS = [0, 50, 60, 70, 80, 90];

const auctionTime = (iso: string | null): number => {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  return isNaN(t) ? Infinity : t;
};

const niceCeil = (n: number, step: number) => Math.max(step, Math.ceil(n / step) * step);

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[i];
};

const PRAZOS: { days: number; label: string }[] = [
  { days: 7, label: "Próximos 7 dias" },
  { days: 15, label: "Próximos 15 dias" },
  { days: 30, label: "Próximos 30 dias" },
  { days: 60, label: "Próximos 60 dias" },
];

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
  const [advanced, setAdvanced] = useState(false);
  const [minQuartos, setMinQuartos] = useState(0);
  const [maxPreco, setMaxPreco] = useState(0);
  const [minArea, setMinArea] = useState(0);
  const [minDesconto, setMinDesconto] = useState(0);
  const [minInvest, setMinInvest] = useState(0);
  const [scoreKey, setScoreKey] = useState<keyof Scores | "none">("none");
  const [scoreMin, setScoreMin] = useState(0);
  const [financiamento, setFinanciamento] = useState(false);
  const [fgts, setFgts] = useState(false);
  const [modalidade, setModalidade] = useState("all");
  const [prazoLeilao, setPrazoLeilao] = useState(0);
  const [sort, setSort] = useState<Sort>("desconto");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>(initialView);
  const [calDayOpen, setCalDayOpen] = useState(false);
  const { alerts, add: addAlert } = useAlerts();
  const { ids: savedIds } = useSaved();
  const toast = useToast();

  // Slider bounds derived from the dataset. maxPreco === priceBound means "no
  // upper limit"; the other numeric filters use 0 as their "off" value.
  const { priceBound, priceStep, areaBound, quartosBound } = useMemo(() => {
    const prices = properties.map((p) => p.saleValue).filter((v): v is number => v != null);
    const areas = properties.map((p) => p.area).filter((v): v is number => v != null);
    const beds = properties.map((p) => p.bedrooms).filter((v): v is number => v != null);
    const pMax = prices.length ? Math.max(...prices) : 1_000_000;
    const pBound = niceCeil(pMax, 50_000);
    return {
      priceBound: pBound,
      priceStep: pBound > 1_500_000 ? 50_000 : 10_000,
      areaBound: areas.length ? niceCeil(percentile(areas, 0.95), 10) : 200,
      quartosBound: Math.min(6, Math.max(4, beds.length ? Math.max(...beds) : 4)),
    };
  }, [properties]);

  useEffect(() => {
    if (maxPreco === 0) setMaxPreco(priceBound);
  }, [priceBound, maxPreco]);

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

  const clusterLabel =
    cluster !== "all" ? clusters.find((c) => c.clusterId === cluster)?.label : undefined;

  const priceCapped = maxPreco > 0 && maxPreco < priceBound;

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
      if (modalidade !== "all" && p.modality !== modalidade) return false;
      if (prazoLeilao) {
        if (!p.auctionDate) return false;
        const t = new Date(p.auctionDate).getTime();
        if (isNaN(t) || t < startToday || t > auctionMax) return false;
      }
      if (minQuartos && (p.bedrooms ?? 0) < minQuartos) return false;
      if (priceCapped && (p.saleValue ?? Infinity) > maxPreco) return false;
      if (minArea && (p.area ?? 0) < minArea) return false;
      if (minDesconto && (p.discount ?? 0) < minDesconto) return false;
      if (minInvest && (p.scores.investment ?? 0) < minInvest) return false;
      if (scoreKey !== "none" && scoreMin && (p.scores[scoreKey] ?? 0) < scoreMin) return false;
      if (financiamento && !p.acceptsFinancing) return false;
      if (fgts && !p.acceptsFgts) return false;
      if (term) {
        const hay =
          `${p.title} ${p.neighborhood} ${p.city} ${p.uf} ${p.propertyType}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
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
    priceCapped,
    maxPreco,
    minArea,
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
  const alertFilters = useMemo<AlertFilters>(() => {
    const f: AlertFilters = {};
    if (uf !== "all") f.uf = uf;
    if (cidade !== "all") f.city = cidade;
    if (tipo !== "all") f.propertyType = tipo;
    if (minDesconto) f.minDiscount = minDesconto;
    if (priceCapped) f.maxPrice = maxPreco;
    if (minInvest) f.minScore = minInvest; // no scoreKey → applies to Investimento
    return f;
  }, [uf, cidade, tipo, minDesconto, priceCapped, maxPreco, minInvest]);

  const canAlert = hasAnyFilter(alertFilters);
  const alertLabel = useMemo(() => describeFilters(alertFilters), [alertFilters]);
  const alertExists =
    canAlert && alerts.some((a) => a.name.trim().toLowerCase() === alertLabel.trim().toLowerCase());

  const createAlert = () => {
    if (!canAlert) return;
    const ok = addAlert(alertLabel, "Aviso diário", alertFilters);
    toast(ok ? "Alerta criado" : "Você já tem um alerta com estes filtros");
  };

  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scoreFilterActive = scoreKey !== "none" && scoreMin > 0;
  const advCount = [
    minQuartos > 0,
    priceCapped,
    minArea > 0,
    minDesconto > 0,
    minInvest > 0,
    scoreFilterActive,
    financiamento,
    fgts,
    modalidade !== "all",
    prazoLeilao > 0,
  ].filter(Boolean).length;
  const advActive = advCount > 0;

  const clearAdvanced = () => {
    setMinQuartos(0);
    setMaxPreco(priceBound);
    setMinArea(0);
    setMinDesconto(0);
    setMinInvest(0);
    setScoreKey("none");
    setScoreMin(0);
    setFinanciamento(false);
    setFgts(false);
    setModalidade("all");
    setPrazoLeilao(0);
  };
  const filtered =
    cluster !== "all" ||
    uf !== "all" ||
    cidade !== "all" ||
    tipo !== "all" ||
    q.trim() ||
    advActive;
  const title = h3Label
    ? `Imóveis em ${h3Label}`
    : (clusterLabel ?? (filtered ? `${items.length} imóveis encontrados` : "Todos os imóveis"));

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
        <SearchableSelect
          label="Grupo"
          allLabel="todos"
          value={cluster === "all" ? "all" : String(cluster)}
          options={clusters.map((c) => ({ value: String(c.clusterId), label: c.label }))}
          onChange={(v) => setCluster(v === "all" ? "all" : Number(v))}
        />
        <button
          className={`selectish${advanced || advActive ? " on" : ""}`}
          type="button"
          onClick={() => setAdvanced((v) => !v)}
        >
          Filtros avançados{advCount > 0 && <span className="advcount">{advCount}</span>}
          {advanced ? " ▴" : " ▾"}
        </button>
      </div>

      {advanced && (
        <div className="advpanel">
          <div className="afsection">
            <div className="afsection-title">Imóvel</div>
            <div className="afsection-grid">
              <OptionPicker
                label="Quartos (mínimo)"
                value={minQuartos}
                options={[
                  { value: 0, label: "Qualquer" },
                  ...Array.from({ length: quartosBound }, (_, i) => ({
                    value: i + 1,
                    label: `${i + 1}+`,
                  })),
                ]}
                onChange={setMinQuartos}
              />
              <Slider
                label="Preço máximo"
                value={maxPreco}
                min={0}
                max={priceBound}
                step={priceStep}
                off={priceBound}
                format={(v) => `até ${moneyShort(v)}`}
                onChange={setMaxPreco}
              />
              <Slider
                label="Área mínima"
                value={minArea}
                min={0}
                max={areaBound}
                step={10}
                off={0}
                format={(v) => `${v}+ m²`}
                onChange={setMinArea}
              />
            </div>
          </div>

          <div className="afsection">
            <div className="afsection-title">Retorno e notas</div>
            <div className="afsection-grid">
              <Slider
                label="Desconto mínimo"
                value={minDesconto}
                min={0}
                max={80}
                step={5}
                off={0}
                format={(v) => `≥ ${v}%`}
                onChange={setMinDesconto}
              />
              <Slider
                label="Nota de investimento mínima"
                value={minInvest}
                min={0}
                max={100}
                step={5}
                off={0}
                format={(v) => `≥ ${v}`}
                onChange={setMinInvest}
              />
              <div className="afgroup">
                <div className="afield">
                  <span>Filtrar por nota do objetivo</span>
                  <select
                    className={`selectish${scoreKey !== "none" ? " on" : ""}`}
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
                </div>
                {scoreKey !== "none" && (
                  <OptionPicker
                    label={`Nota mínima · ${SCORE_LABEL[scoreKey]}`}
                    value={scoreMin}
                    options={SCORE_THRESHOLDS.map((t) => ({
                      value: t,
                      label: t === 0 ? "Qualquer" : `≥ ${t}`,
                    }))}
                    onChange={setScoreMin}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="afsection">
            <div className="afsection-title">Leilão e pagamento</div>
            <div className="afsection-grid">
              <div className="afield">
                <span>Modalidade do leilão</span>
                <select
                  className={`selectish${modalidade !== "all" ? " on" : ""}`}
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value)}
                >
                  <option value="all">Todas as modalidades</option>
                  {modalidades.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="afield">
                <span>Data do leilão</span>
                <select
                  className={`selectish${prazoLeilao > 0 ? " on" : ""}`}
                  value={prazoLeilao}
                  onChange={(e) => setPrazoLeilao(Number(e.target.value))}
                >
                  <option value={0}>Qualquer data</option>
                  {PRAZOS.map((pr) => (
                    <option key={pr.days} value={pr.days}>
                      {pr.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="afield">
                <span>Pagamento</span>
                <div className="checkgroup">
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
                </div>
              </div>
            </div>
          </div>
          {advActive && (
            <div className="advfoot">
              <button className="btn ghost" type="button" onClick={clearAdvanced}>
                Limpar filtros avançados
              </button>
            </div>
          )}
        </div>
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
