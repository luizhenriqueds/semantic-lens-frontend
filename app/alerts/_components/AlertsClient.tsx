"use client";

import { useMemo, useState } from "react";
import { useAlerts } from "@/lib/alerts";
import { countMatches, describeFilters, filterChips, hasAnyFilter } from "@/lib/alertFilters";
import { PROFILE_SHORT } from "@/lib/format";
import { IconBell, IconPlus } from "@/lib/icons";
import type { AlertFilters, ProfileKey, Property } from "@/lib/types";

const FREQS = ["Aviso imediato", "Aviso diário", "Aviso semanal"];
const PROFILES: ProfileKey[] = [
  "airbnb",
  "flip",
  "student",
  "family",
  "high_liquidity",
  "commercial",
];
const SCORES = [50, 60, 70, 80, 90];
const DESCONTOS = [20, 30, 40, 50];
const PRECOS = [100000, 200000, 300000, 500000, 1000000];

const precoLabel = (n: number) => (n >= 1_000_000 ? "R$ 1 mi" : `R$ ${n / 1000} mil`);

type Mode = "filtros" | "descricao";

export default function AlertsClient({ properties }: { properties: Property[] }) {
  const { alerts, add, toggle } = useAlerts();
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<Mode>("filtros");
  const [freq, setFreq] = useState(FREQS[1]);

  const [nome, setNome] = useState("");
  const [profile, setProfile] = useState("");
  const [minScore, setMinScore] = useState("");
  const [uf, setUf] = useState("");
  const [cidade, setCidade] = useState("");
  const [tipo, setTipo] = useState("");
  const [minDesconto, setMinDesconto] = useState("");
  const [maxPreco, setMaxPreco] = useState("");

  const ufs = useMemo(
    () => Array.from(new Set(properties.map((p) => p.uf).filter(Boolean))).sort(),
    [properties],
  );
  const cidades = useMemo(
    () =>
      Array.from(new Set(properties.filter((p) => !uf || p.uf === uf).map((p) => p.cidade)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [properties, uf],
  );
  const tipos = useMemo(
    () => Array.from(new Set(properties.map((p) => p.tipo))).sort(),
    [properties],
  );

  const draft = useMemo<AlertFilters>(() => {
    const f: AlertFilters = {};
    if (profile) f.profile = profile as ProfileKey;
    if (minScore) f.minScore = Number(minScore);
    if (uf) f.uf = uf;
    if (cidade) f.cidade = cidade;
    if (tipo) f.tipo = tipo;
    if (minDesconto) f.minDesconto = Number(minDesconto);
    if (maxPreco) f.maxPreco = Number(maxPreco);
    return f;
  }, [profile, minScore, uf, cidade, tipo, minDesconto, maxPreco]);

  const draftCount = useMemo(() => countMatches(properties, draft), [properties, draft]);

  function reset() {
    setNome("");
    setProfile("");
    setMinScore("");
    setUf("");
    setCidade("");
    setTipo("");
    setMinDesconto("");
    setMaxPreco("");
    setCreating(false);
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "descricao") {
      if (!nome.trim()) return;
      add(nome.trim(), freq);
    } else {
      if (!hasAnyFilter(draft)) return;
      add(describeFilters(draft), freq, draft);
    }
    reset();
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
          <div className="chiprow" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`rchip${mode === "filtros" ? " on" : ""}`}
              onClick={() => setMode("filtros")}
            >
              Por filtros
            </button>
            <button
              type="button"
              className={`rchip${mode === "descricao" ? " on" : ""}`}
              onClick={() => setMode("descricao")}
            >
              Por descrição
            </button>
          </div>

          {mode === "filtros" ? (
            <>
              <div className="lbl">
                Monte um filtro e receba avisos quando surgirem imóveis assim.
              </div>
              <div className="afilters">
                <label className="afield">
                  <span>Objetivo</span>
                  <select
                    className="selectish"
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                  >
                    <option value="">Qualquer</option>
                    {PROFILES.map((p) => (
                      <option key={p} value={p}>
                        {PROFILE_SHORT[p]}
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
                    disabled={!profile}
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
                  <>
                    <b>{draftCount}</b>{" "}
                    {draftCount === 1 ? "imóvel corresponde" : "imóveis correspondem"} hoje
                    <span className="apreview-sum"> · {describeFilters(draft)}</span>
                  </>
                ) : (
                  "Escolha ao menos um filtro para criar o alerta."
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button className="btn solid" type="submit" disabled={!hasAnyFilter(draft)}>
                  Criar alerta
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
          const count = a.filters ? countMatches(properties, a.filters) : null;
          const chips = a.filters ? filterChips(a.filters) : [];
          return (
            <div className="alertrow" key={a.id}>
              <div className="ai">
                <IconBell width={22} height={22} strokeWidth={1.7} />
              </div>
              <div className="info">
                <b>{a.nome}</b>
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
                  {count != null && (
                    <>
                      {" · "}
                      <b style={{ color: "var(--primary)" }}>{count}</b>{" "}
                      {count === 1 ? "imóvel corresponde" : "imóveis correspondem"} hoje
                    </>
                  )}
                </p>
              </div>
              <button
                className={`toggle${a.on ? " on" : ""}`}
                aria-label="Ativar ou desativar alerta"
                onClick={() => toggle(a.id)}
              />
            </div>
          );
        })
      ) : (
        <div className="empty">
          Você ainda não tem alertas.
          <br />
          Crie um alerta por filtros para ser avisado quando aparecer um imóvel que combina com o
          que procura.
        </div>
      )}
    </>
  );
}
