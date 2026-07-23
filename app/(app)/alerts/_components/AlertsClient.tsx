"use client";

import { useEffect, useMemo, useState } from "react";
import { countAlertMatches, countDescriptionMatches } from "@/app/actions/alerts";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonText from "@/components/ui/SkeletonText";
import { useToast } from "@/components/ui/Toaster";
import { describeFilters, filterChips, hasAnyFilter, type Alert, useAlerts } from "@/lib/alerts";
import { FREQS } from "@/lib/alerts/cadence";
import { SCORE_DIMS, SCORE_LABEL, titleCase } from "@/lib/format";
import { IconBell, IconPencil, IconPlus, IconTrash } from "@/lib/icons";
import type { AlertFilters, FilterOptions, Scores } from "@/lib/types";

type Confirm = {
  title: string;
  message: string;
  label: string;
  danger?: boolean;
  action: () => void;
};

const SCORES = [50, 60, 70, 80, 90];
const DESCONTOS = [20, 30, 40, 50];
const PRECOS = [100000, 200000, 300000, 500000, 1000000];

const precoLabel = (n: number) => (n >= 1_000_000 ? "R$ 1 mi" : `R$ ${n / 1000} mil`);

type Mode = "filtros" | "descricao";
type DescCount = { count: number; capped: boolean };

export default function AlertsClient({ options }: { options: FilterOptions }) {
  const { alerts, add, toggle, update, remove } = useAlerts();
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
  // Advanced filters carried through from the properties page — no controls here,
  // but preserved on edit rather than dropped.
  const [extra, setExtra] = useState<Partial<AlertFilters>>({});

  const ufs = options.ufs;
  const cidades = useMemo(
    () =>
      Array.from(
        new Set(options.cities.filter((c) => !uf || c.uf === uf).map((c) => titleCase(c.city))),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [options.cities, uf],
  );
  const tipos = options.types;

  const draft = useMemo<AlertFilters>(() => {
    const f: AlertFilters = { ...extra };
    if (scoreKey) f.scoreKey = scoreKey as keyof Scores;
    if (minScore) f.minScore = Number(minScore);
    if (uf) f.uf = uf;
    if (cidade) f.city = cidade;
    if (tipo) f.propertyType = tipo;
    if (minDesconto) f.minDiscount = Number(minDesconto);
    if (maxPreco) f.maxPrice = Number(maxPreco);
    return f;
  }, [extra, scoreKey, minScore, uf, cidade, tipo, minDesconto, maxPreco]);

  const [draftCount, setDraftCount] = useState<number | null>(null);
  useEffect(() => {
    if (!hasAnyFilter(draft)) {
      setDraftCount(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      countAlertMatches(draft)
        .then((n) => {
          if (!cancelled) setDraftCount(n);
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [draft]);

  const [filterCounts, setFilterCounts] = useState<Record<string, number | null>>({});
  const filterKey = JSON.stringify(alerts.filter((a) => a.filters).map((a) => [a.id, a.filters]));
  useEffect(() => {
    const items: [string, AlertFilters][] = JSON.parse(filterKey);
    if (!items.length) return;
    let cancelled = false;
    Promise.all(
      items.map(async ([id, f]) => [id, await countAlertMatches(f).catch(() => null)] as const),
    ).then((entries) => {
      if (!cancelled) setFilterCounts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [filterKey]);

  const [descCounts, setDescCounts] = useState<Record<string, DescCount | null>>({});
  const descKey = JSON.stringify(
    alerts.filter((a) => !a.filters && a.name.trim()).map((a) => [a.id, a.name]),
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
    setCreating(false);
    setEditingId(null);
    setMode("filtros");
  }

  function startEdit(a: Alert) {
    setEditingId(a.id);
    setCreating(true);
    setFreq(a.freq);
    if (a.filters) {
      const f = a.filters;
      setMode("filtros");
      setNome(a.name === describeFilters(f) ? "" : a.name);
      setScoreKey(f.scoreKey ?? "");
      setMinScore(f.minScore != null ? String(f.minScore) : "");
      setUf(f.uf ?? "");
      setCidade(f.city ?? "");
      setTipo(f.propertyType ?? "");
      setMinDesconto(f.minDiscount != null ? String(f.minDiscount) : "");
      setMaxPreco(f.maxPrice != null ? String(f.maxPrice) : "");
      setExtra({
        q: f.q,
        minBedrooms: f.minBedrooms,
        minArea: f.minArea,
        poiCats: f.poiCats,
        poiRadius: f.poiRadius,
        maxCenter: f.maxCenter,
      });
    } else {
      setMode("descricao");
      setNome(a.name);
    }
  }

  async function commit() {
    if (editingId) {
      const name = mode === "descricao" ? nome.trim() : nome.trim() || describeFilters(draft);
      const ok = await update(editingId, {
        name,
        freq,
        filters: mode === "descricao" ? null : draft,
      });
      if (!ok) {
        toast("Você já tem um alerta com esse nome");
        return;
      }
      toast("Alterações salvas");
      reset();
      return;
    }
    const name = mode === "descricao" ? nome.trim() : nome.trim() || describeFilters(draft);
    const ok = mode === "descricao" ? await add(name, freq) : await add(name, freq, draft);
    if (!ok) {
      toast("Você já tem um alerta com esse nome");
      return;
    }
    toast("Alerta criado");
    reset();
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const valid = mode === "descricao" ? Boolean(nome.trim()) : hasAnyFilter(draft);
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
      <button
        className="btn solid"
        style={{ marginBottom: 20 }}
        onClick={() => setCreating((v) => !v)}
      >
        <IconPlus /> Criar novo alerta
      </button>

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
                <label className="afield">
                  <span>Estado</span>
                  <select
                    className="selectish"
                    value={uf}
                    onChange={(e) => {
                      setUf(e.target.value);
                      setCidade("");
                    }}
                  >
                    <option value="">Todos</option>
                    {ufs.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="afield">
                  <span>Cidade</span>
                  <select
                    className="selectish"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {cidades.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
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
                    {FREQS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="apreview">
                {hasAnyFilter(draft) ? (
                  draftCount == null ? (
                    <SkeletonText width={148} />
                  ) : (
                    <>
                      <b>{draftCount}</b>{" "}
                      {draftCount === 1 ? "imóvel corresponde" : "imóveis correspondem"} hoje
                      <span className="apreview-sum"> · {describeFilters(draft)}</span>
                    </>
                  )
                ) : (
                  "Escolha ao menos um filtro para criar o alerta."
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn solid" type="submit" disabled={!hasAnyFilter(draft)}>
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
                  {FREQS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <button className="btn solid" type="submit">
                  Salvar
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {alerts.length ? (
        alerts.map((a) => {
          const isDesc = !a.filters && Boolean(a.name.trim());
          const desc = isDesc ? descCounts[a.id] : null;
          const counting =
            (isDesc && desc === undefined) || (!!a.filters && filterCounts[a.id] === undefined);
          const count = a.filters ? (filterCounts[a.id] ?? null) : (desc?.count ?? null);
          const chips = a.filters ? filterChips(a.filters) : [];
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
              <button className="btn solid" type="button" onClick={() => setCreating(true)}>
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
