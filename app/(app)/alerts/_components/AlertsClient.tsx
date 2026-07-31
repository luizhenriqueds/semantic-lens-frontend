"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  countAlertMatches,
  countDescriptionMatches,
  resolveAlertQuery,
} from "@/app/actions/alerts";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SkeletonText from "@/components/ui/SkeletonText";
import UsageMeter from "@/components/plan/UsageMeter";
import { usePlan } from "@/components/plan/PlanProvider";
import { useToast } from "@/components/ui/Toaster";
import {
  alertError,
  criteriaChips,
  describeCriteria,
  hasAnyCriteria,
  isAnyCriteria,
  type Alert,
  useAlerts,
} from "@/lib/alerts";
import { FREQS, freqOptions } from "@/lib/alerts/cadence";
import { SCORE_DIMS, SCORE_LABEL, titleCase } from "@/lib/format";
import { IconArrow, IconBell, IconPencil, IconPlus, IconSliders, IconTrash } from "@/lib/icons";
import type {
  AlertCriteria,
  AlertCriteriaSet,
  FilterOptions,
  ResolvedAlertQuery,
  Scores,
} from "@/lib/types";

type Confirm = {
  title: string;
  message: string;
  label: string;
  danger?: boolean;
  action: () => void;
};

const CONTROLLED_KEYS = [
  "score_key",
  "score_min",
  "uf",
  "city",
  "type",
  "min_discount",
  "max_price",
] as const;

const SCORES = [50, 60, 70, 80, 90];
const DESCONTOS = [20, 30, 40, 50];
const PRECOS = [100000, 200000, 300000, 500000, 1000000];

const precoLabel = (n: number) => (n >= 1_000_000 ? "R$ 1 mi" : `R$ ${n / 1000} mil`);

type Mode = "filtros" | "descricao";
type DescCount = { count: number; capped: boolean };

export default function AlertsClient({ options }: { options: FilterOptions }) {
  const { alerts, add, toggle, update, remove } = useAlerts();
  const { require, showQuotaUpsell, limit } = usePlan();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [mode, setMode] = useState<Mode>("filtros");
  const [freq, setFreq] = useState(FREQS[0]);

  const [nome, setNome] = useState("");
  const [scoreKey, setScoreKey] = useState("");
  const [minScore, setMinScore] = useState("");
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [tipo, setTipo] = useState("");
  const [minDesconto, setMinDesconto] = useState("");
  const [maxPreco, setMaxPreco] = useState("");
  // Carried through from the properties page; no controls here.
  const [extra, setExtra] = useState<AlertCriteriaSet>({});
  const [resolved, setResolved] = useState<{ query: string; result: ResolvedAlertQuery } | null>(
    null,
  );

  const ufs = options.ufs;
  const cidades = useMemo(
    () =>
      Array.from(
        new Set(options.cities.filter((c) => !uf || c.uf === uf).map((c) => titleCase(c.city))),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [options.cities, uf],
  );
  const tipos = options.types;

  const draft = useMemo<AlertCriteriaSet>(() => {
    const c: AlertCriteriaSet = { ...extra };
    if (scoreKey || minScore) c.score_key = (scoreKey || "investment") as keyof Scores;
    if (minScore) c.score_min = Number(minScore);
    if (uf) c.uf = uf;
    if (cidade) c.city = cidade;
    if (tipo) c.type = tipo;
    if (minDesconto) c.min_discount = Number(minDesconto);
    if (maxPreco) c.max_price = Number(maxPreco);
    return c;
  }, [extra, scoreKey, minScore, uf, cidade, tipo, minDesconto, maxPreco]);

  const phrase = nome.trim();
  const resolvedFor = resolved?.query === phrase ? resolved.result : null;
  const preview =
    mode === "filtros" ? (hasAnyCriteria(draft) ? draft : null) : resolvedFor?.criteria;

  useEffect(() => {
    if (mode !== "descricao" || !phrase || resolved?.query === phrase) return;
    let cancelled = false;
    const t = setTimeout(() => {
      resolveAlertQuery(phrase)
        .then((result) => {
          if (!cancelled) setResolved({ query: phrase, result });
        })
        .catch(() => {});
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mode, phrase, resolved]);

  const [draftCount, setDraftCount] = useState<number | null>(null);
  useEffect(() => {
    if (!preview) {
      setDraftCount(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      countAlertMatches(preview)
        .then((n) => {
          if (!cancelled) setDraftCount(n);
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [preview]);

  const [filterCounts, setFilterCounts] = useState<Record<string, number | null>>({});
  const filterKey = JSON.stringify(alerts.filter((a) => a.criteria).map((a) => [a.id, a.criteria]));
  useEffect(() => {
    const items: [string, AlertCriteria][] = JSON.parse(filterKey);
    if (!items.length) return;
    let cancelled = false;
    Promise.all(
      items.map(async ([id, c]) => [id, await countAlertMatches(c).catch(() => null)] as const),
    ).then((entries) => {
      if (!cancelled) setFilterCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [filterKey]);

  const [descCounts, setDescCounts] = useState<Record<string, DescCount | null>>({});
  const descKey = JSON.stringify(
    alerts.filter((a) => !a.criteria && a.name.trim()).map((a) => [a.id, a.name]),
  );

  useEffect(() => {
    const items: [string, string][] = JSON.parse(descKey);
    if (!items.length) return;
    let cancelled = false;
    setDescCounts({});
    Promise.all(
      items.map(
        async ([id, name]) =>
          [
            id,
            await countDescriptionMatches(name).catch((err) => {
              console.warn("Failed to count alert matches", err);
              return null;
            }),
          ] as const,
      ),
    ).then((entries) => {
      if (!cancelled) setDescCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [descKey]);

  // Sign-in and the quota are both enforced here, before the form opens, rather than on submit.
  function startCreating() {
    if (!require("savedSearches")) return;
    const cap = limit("savedSearches");
    if (cap != null && alerts.length >= cap && !editingId) {
      return showQuotaUpsell("savedSearches");
    }
    setCreating((v) => !v);
  }

  function reset() {
    setNome("");
    setScoreKey("");
    setMinScore("");
    setUf("");
    setCidade("");
    setTipo("");
    setMinDesconto("");
    setMaxPreco("");
    setExtra({});
    setResolved(null);
    setCreating(false);
    setEditingId(null);
    setMode("filtros");
  }

  function startEdit(a: Alert) {
    setEditingId(a.id);
    setCreating(true);
    setFreq(a.freq);
    setResolved(null);
    const c = a.criteria && !isAnyCriteria(a.criteria) ? a.criteria : null;
    if (c) {
      setMode("filtros");
      setNome(a.name === describeCriteria(c) ? "" : a.name);
      setScoreKey(c.score_key ?? "");
      setMinScore(c.score_min != null ? String(c.score_min) : "");
      setUf(c.uf ?? "");
      setCidade(c.city ?? "");
      setTipo(c.type ?? "");
      setMinDesconto(c.min_discount != null ? String(c.min_discount) : "");
      setMaxPreco(c.max_price != null ? String(c.max_price) : "");
      const rest = { ...c };
      for (const k of CONTROLLED_KEYS) delete rest[k];
      setExtra(rest);
    } else {
      setMode("descricao");
      setNome(a.name);
    }
  }

  async function commit() {
    let criteria: AlertCriteriaSet = draft;
    let dropped: string[] = [];
    if (mode === "descricao") {
      const result = resolvedFor ?? (await resolveAlertQuery(phrase));
      if (!result.criteria) {
        toast("Não conseguimos transformar essa descrição em filtros");
        return;
      }
      criteria = result.criteria;
      dropped = result.dropped;
    }
    const name = mode === "descricao" ? phrase : phrase || describeCriteria(draft);
    if (editingId) {
      if (!(await update(editingId, { name, freq, criteria }))) {
        toast("Você já tem um alerta com esse nome");
        return;
      }
    } else {
      const res = await add(name, freq, criteria);
      if (!res.ok) {
        toast(alertError(res.reason));
        return;
      }
    }
    const saved = editingId ? "Alterações salvas" : "Alerta criado";
    toast(dropped.length ? `${saved}, sem ${dropped.join(" e ")}` : saved);
    reset();
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const valid = mode === "descricao" ? Boolean(phrase) : hasAnyCriteria(draft);
    if (!valid) return;
    if (editingId) {
      setConfirm({
        title: "Salvar alterações?",
        message: "O alerta será atualizado com os novos critérios e frequência de aviso.",
        label: "Salvar alterações",
        action: commit,
      });
    } else {
      commit();
    }
  }

  function confirmRemove(a: Alert) {
    setConfirm({
      title: "Excluir alerta?",
      message: `O alerta “${a.name}” será removido e você deixará de receber avisos sobre ele.`,
      label: "Excluir",
      danger: true,
      action: () => {
        remove(a.id);
        toast("Alerta excluído");
      },
    });
  }

  return (
    <>
      <div className="alertstools">
        <UsageMeter used={alerts.length} quota="savedSearches" noun="alertas criados" />
        <Link className="alertstools-link" href="/settings">
          <IconSliders width={17} height={17} strokeWidth={1.8} />
          Alertas automáticos e canais de envio
        </Link>
        <button className="btn solid" onClick={startCreating}>
          <IconPlus /> Criar novo alerta
        </button>
      </div>

      {creating && (
        <form className="searchhero" onSubmit={create} style={{ padding: 22 }}>
          <div className="modeswitch">
            <div className="viewtoggle">
              <button
                type="button"
                className={mode === "filtros" ? "on" : ""}
                onClick={() => setMode("filtros")}
              >
                Por filtros
              </button>
              <button
                type="button"
                className={mode === "descricao" ? "on" : ""}
                onClick={() => setMode("descricao")}
              >
                Por descrição
              </button>
            </div>
          </div>

          {mode === "filtros" ? (
            <>
              <div className="lbl">
                Monte um filtro e receba avisos quando surgirem imóveis assim.
              </div>
              <div className="afilters">
                <label className="afield" style={{ gridColumn: "1 / -1" }}>
                  <span>Nome do alerta (opcional)</span>
                  <input
                    className="selectish"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Oportunidades em Campo Grande"
                  />
                </label>
                <label className="afield">
                  <span>Objetivo</span>
                  <select
                    className="selectish"
                    value={scoreKey}
                    onChange={(e) => setScoreKey(e.target.value)}
                  >
                    <option value="">Qualquer</option>
                    {SCORE_DIMS.map((k) => (
                      <option key={k} value={k}>
                        {SCORE_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="afield">
                  <span>Nota mínima</span>
                  <select
                    className="selectish"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                  >
                    <option value="">Qualquer</option>
                    {SCORES.map((s) => (
                      <option key={s} value={s}>
                        ≥ {s}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="afield">
                  <span>Estado</span>
                  <SearchableSelect
                    label="Estado"
                    allLabel="Todos"
                    showLabel={false}
                    className="fwide"
                    value={uf || "all"}
                    options={ufs.map((u) => ({ value: u, label: u }))}
                    onChange={(v) => {
                      setUf(v === "all" ? "" : v);
                      setCidade("");
                    }}
                  />
                </div>
                <div className="afield">
                  <span>Cidade</span>
                  <SearchableSelect
                    label="Cidade"
                    allLabel="Todas"
                    showLabel={false}
                    className="fwide"
                    value={cidade || "all"}
                    options={cidades.map((c) => ({ value: c, label: c }))}
                    onChange={(v) => setCidade(v === "all" ? "" : v)}
                  />
                </div>
                <label className="afield">
                  <span>Tipo</span>
                  <select
                    className="selectish"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {tipos.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="afield">
                  <span>Desconto mínimo</span>
                  <select
                    className="selectish"
                    value={minDesconto}
                    onChange={(e) => setMinDesconto(e.target.value)}
                  >
                    <option value="">Qualquer</option>
                    {DESCONTOS.map((d) => (
                      <option key={d} value={d}>
                        ≥ {d}%
                      </option>
                    ))}
                  </select>
                </label>
                <label className="afield">
                  <span>Preço máximo</span>
                  <select
                    className="selectish"
                    value={maxPreco}
                    onChange={(e) => setMaxPreco(e.target.value)}
                  >
                    <option value="">Qualquer</option>
                    {PRECOS.map((v) => (
                      <option key={v} value={v}>
                        {precoLabel(v)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="afield">
                  <span>Frequência</span>
                  <select
                    className="selectish"
                    value={freq}
                    onChange={(e) => setFreq(e.target.value)}
                  >
                    {freqOptions(freq).map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="apreview">
                {hasAnyCriteria(draft) ? (
                  draftCount == null ? (
                    <SkeletonText width={148} />
                  ) : (
                    <>
                      <b>{draftCount}</b>{" "}
                      {draftCount === 1 ? "imóvel corresponde" : "imóveis correspondem"} hoje
                      <span className="apreview-sum"> · {describeCriteria(draft)}</span>
                    </>
                  )
                ) : (
                  "Escolha ao menos um filtro para criar o alerta."
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn solid" type="submit" disabled={!hasAnyCriteria(draft)}>
                  {editingId ? "Salvar alterações" : "Criar alerta"}
                </button>
                <button className="btn ghost" type="button" onClick={reset}>
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="lbl">O que você quer acompanhar?</div>
              <div className="bigsearch" style={{ gap: 10 }}>
                <div className="field" style={{ height: 52 }}>
                  <input
                    autoFocus
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: casas em Campo Grande com 40%+ de desconto"
                  />
                </div>
                <select
                  className="selectish"
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                >
                  {freqOptions(freq).map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <button className="btn solid" type="submit" disabled={!phrase}>
                  Salvar
                </button>
              </div>

              <div className="apreview">
                {!phrase ? (
                  "Descreva o que você procura e nós transformamos em filtros."
                ) : !resolvedFor ? (
                  <SkeletonText width={220} />
                ) : !resolvedFor.criteria ? (
                  "Não reconhecemos filtros nessa descrição. Tente citar a cidade, o tipo de imóvel ou um lugar de referência."
                ) : (
                  <>
                    {draftCount == null ? (
                      <SkeletonText width={148} />
                    ) : (
                      <>
                        <b>{draftCount}</b>{" "}
                        {draftCount === 1 ? "imóvel corresponde" : "imóveis correspondem"} hoje
                      </>
                    )}
                    {resolvedFor.dropped.length > 0 && (
                      <span className="apreview-sum"> · sem {resolvedFor.dropped.join(" e ")}</span>
                    )}
                    <div className="achips" style={{ marginTop: 8 }}>
                      {criteriaChips(resolvedFor.criteria).map((c) => (
                        <span className="achip" key={c}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </form>
      )}

      {alerts.length ? (
        alerts.map((a) => {
          const isDesc = !a.criteria && Boolean(a.name.trim());
          const desc = isDesc ? descCounts[a.id] : null;
          const counting =
            (isDesc && desc === undefined) || (!!a.criteria && filterCounts[a.id] === undefined);
          const count = a.criteria ? (filterCounts[a.id] ?? null) : (desc?.count ?? null);
          const chips = a.criteria ? criteriaChips(a.criteria) : [];
          return (
            <div className="alertrow" key={a.id}>
              <div className="ai">
                <IconBell width={22} height={22} strokeWidth={1.7} />
              </div>
              <div className="info">
                <b>{a.name}</b>
                {chips.length > 0 && (
                  <div className="achips">
                    {chips.map((c) => (
                      <span className="achip" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <p>
                  {a.freq}
                  {counting ? (
                    <>
                      {" · "}
                      <SkeletonText width={148} />
                    </>
                  ) : (
                    count != null && (
                      <>
                        {" · "}
                        <b style={{ color: "var(--primary)" }}>
                          {count}
                          {desc?.capped ? "+" : ""}
                        </b>{" "}
                        {count === 1 ? "imóvel corresponde" : "imóveis correspondem"} hoje
                      </>
                    )
                  )}
                </p>
              </div>
              <div className="aactions">
                <Link
                  className="iconbtn"
                  href={`/alerts/${a.id}`}
                  aria-label={`Ver imóveis de ${a.name}`}
                >
                  <IconArrow width={17} height={17} strokeWidth={1.8} />
                </Link>
                <button
                  className="iconbtn"
                  type="button"
                  aria-label="Editar alerta"
                  onClick={() => startEdit(a)}
                >
                  <IconPencil width={17} height={17} strokeWidth={1.8} />
                </button>
                <button
                  className="iconbtn"
                  type="button"
                  aria-label="Excluir alerta"
                  onClick={() => confirmRemove(a)}
                >
                  <IconTrash width={17} height={17} strokeWidth={1.8} />
                </button>
                <button
                  className={`toggle${a.on ? " on" : ""}`}
                  aria-label="Ativar ou desativar alerta"
                  onClick={() => toggle(a.id)}
                />
              </div>
            </div>
          );
        })
      ) : (
        <EmptyState
          icon={<IconBell />}
          title="Você ainda não tem alertas"
          action={
            !creating && (
              <button className="btn solid" type="button" onClick={startCreating}>
                <IconPlus /> Criar meu primeiro alerta
              </button>
            )
          }
        >
          Crie um alerta por filtros para ser avisado quando aparecer um imóvel que combina com o
          que procura.
        </EmptyState>
      )}

      <ConfirmDialog
        open={confirm != null}
        title={confirm?.title ?? ""}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        danger={confirm?.danger}
        onConfirm={() => {
          confirm?.action();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
