"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { joinApiWaitlist } from "@/app/actions/waitlist";

const SOURCES = [
  "Busca no Google",
  "Indicação de alguém",
  "Redes sociais",
  "Evento ou comunidade",
  "Outro",
];

// Pentagon around the hub, as a fraction of the diagram box: one source for both the connector
// endpoints and the node offsets. The radii set the gap between neighbouring cards.
const HUB_RADIUS = { x: 0.31, y: 0.375 };

const at = (i: number) => {
  const angle = (-90 + i * 72) * (Math.PI / 180);
  return {
    x: 50 + HUB_RADIUS.x * 100 * Math.cos(angle),
    y: 50 + HUB_RADIUS.y * 100 * Math.sin(angle),
  };
};

// `value` is what gets submitted; `node` only shortens the label where the diagram is tight.
const USES = [
  {
    value: "Portais e marketplaces",
    hint: "Republique o feed com sua marca",
    icon: "M3 9l1-5h16l1 5M4 9v10a1 1 0 0 0 1 1h4v-6h6v6h4a1 1 0 0 0 1-1V9M3 9h18",
  },
  {
    value: "CRM / gestão de carteira",
    node: "CRM / carteira",
    hint: "Sincronize notas e alertas",
    icon: "M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  },
  {
    value: "Análise e BI",
    hint: "Relatórios sempre atualizados",
    icon: "M4 12h3v8H4zM10.5 6h3v14h-3zM17 9h3v11h-3z",
  },
  {
    value: "Automação e planilhas",
    hint: "Dados prontos, sem raspagem",
    icon: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18",
  },
  {
    value: "Revenda / parceria",
    hint: "Construa e revenda seu produto",
    icon: "M8 8l-2 2a4 4 0 0 0 0 6l1 1a4 4 0 0 0 6 0l1-1M16 16l2-2a4 4 0 0 0 0-6l-1-1a4 4 0 0 0-6 0l-1 1M9 15l6-6",
  },
].map((u: { value: string; node?: string; hint: string; icon: string }, i) => ({
  ...u,
  node: u.node ?? u.value,
  ...at(i),
}));

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "failed" }
  | { kind: "sent"; alreadyJoined: boolean };

export default function ApiWaitlist() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [uses, setUses] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggleUse = (u: string) =>
    setUses((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ kind: "pending" });
    const res = await joinApiWaitlist(email, source, uses);
    setStatus(res.ok ? { kind: "sent", alreadyJoined: res.alreadyJoined } : { kind: "failed" });
  };

  return (
    <>
      <button
        className="lp-apibtn"
        type="button"
        onClick={() => {
          setStatus({ kind: "idle" });
          setOpen(true);
        }}
      >
        Entrar na lista de espera
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12h14m0 0-6-6m6 6-6 6" />
        </svg>
      </button>

      {/* Portalled: the reveal animation transforms an ancestor, which would otherwise become
          the containing block for the fixed scrim. */}
      {open &&
        createPortal(
          <div
            className="lp-modal-scrim"
            role="dialog"
            aria-modal="true"
            aria-label="Lista de espera da API"
            onClick={() => setOpen(false)}
          >
            <div className="lp-modal lp-hub" onClick={(e) => e.stopPropagation()}>
              <button
                className="lp-modal-x"
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>

              {status.kind === "sent" ? (
                <div className="lp-modal-done">
                  <span className="lp-modal-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  </span>
                  <h3>
                    {status.alreadyJoined ? "Você já estava na lista" : "Você está na lista!"}
                  </h3>
                  <p>
                    {status.alreadyJoined
                      ? "Atualizamos as suas respostas. Avisamos no seu e-mail assim que a API entrar em fase de testes."
                      : "Obrigado pelo interesse. Avisamos no seu e-mail assim que a API entrar em fase de testes."}
                  </p>
                  <button
                    className="lp-btn lp-solid lp-big"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className="lp-hub-top">
                    <div className="lp-hub-pane">
                      <span className="lp-soon">Em breve</span>
                      <h3>Sua base de leilões, dentro do seu próprio produto</h3>
                      <p className="lp-hub-lede">
                        A mesma nota, região e recomendação que você vê na Lavra - via chamada de
                        API, plugada onde seu time já trabalha.
                      </p>

                      <div className="lp-hubwrap">
                        <svg
                          className="lp-hublines"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          {USES.map((u) => (
                            <line
                              key={u.value}
                              className={uses.includes(u.value) ? "lp-on" : undefined}
                              x1="50"
                              y1="50"
                              x2={u.x}
                              y2={u.y}
                            />
                          ))}
                        </svg>

                        <div className="lp-hub-center">
                          <span className="lp-hub-badge">
                            <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                              <circle cx="14" cy="9" r="3" fill="currentColor" />
                              <path
                                d="M14 15v15a4 4 0 0 0 4 4h13"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                              />
                              <path
                                d="M27 27.5 34 34l-7 6.5"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span className="lp-hub-label">API Lavra</span>
                        </div>

                        {USES.map((u) => (
                          <button
                            key={u.value}
                            type="button"
                            className={`lp-hub-node${uses.includes(u.value) ? " lp-on" : ""}`}
                            style={{ left: `${u.x}%`, top: `${u.y}%` }}
                            aria-pressed={uses.includes(u.value)}
                            onClick={() => toggleUse(u.value)}
                          >
                            <span className="lp-ic">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d={u.icon} />
                              </svg>
                            </span>
                            <b>{u.node}</b>
                            <span>{u.hint}</span>
                          </button>
                        ))}
                      </div>
                      <p className="lp-hub-hint">
                        Toque em um uso para <b>marcar no formulário</b>.
                      </p>
                    </div>

                    <div className="lp-hub-form">
                      <h3>Lista de espera da API</h3>
                      <p className="lp-modal-sub">
                        Conte como pretende usar a integração. Avisamos assim que a API abrir.
                      </p>

                      <label className="lp-field">
                        <span>E-mail</span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="voce@empresa.com"
                        />
                      </label>

                      <label className="lp-field">
                        <span>Onde você ouviu falar da Lavra?</span>
                        <select required value={source} onChange={(e) => setSource(e.target.value)}>
                          <option value="" disabled>
                            Selecione…
                          </option>
                          {SOURCES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="lp-field">
                        <span>
                          Como pretende usar a API? <i>(pode escolher mais de uma)</i>
                        </span>
                        <div className="lp-checks">
                          {USES.map((u) => (
                            <button
                              type="button"
                              key={u.value}
                              className={`lp-check${uses.includes(u.value) ? " lp-on" : ""}`}
                              aria-pressed={uses.includes(u.value)}
                              onClick={() => toggleUse(u.value)}
                            >
                              {u.value}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        className="lp-btn lp-solid lp-big lp-modal-submit"
                        type="submit"
                        disabled={
                          status.kind === "pending" || !email || !source || uses.length === 0
                        }
                      >
                        {status.kind === "pending" ? "Enviando…" : "Entrar na lista de espera"}
                      </button>
                      {status.kind === "failed" && (
                        <p className="lp-modal-error" role="alert">
                          Não conseguimos registrar agora. Tente novamente em instantes.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="lp-apipeek">
                    <div className="lp-peek-lbl">
                      <b>Não é ilustração.</b>
                      <span>É o formato real de resposta que a chave de API devolve.</span>
                    </div>
                    <pre className="lp-codebox">
                      <span className="lp-req">GET</span>{" "}
                      <span className="lp-muted">/v1/properties/cx-8841203</span>
                      {"\n{\n  "}
                      <span className="lp-k">&quot;score&quot;</span>:{" "}
                      <span className="lp-n">89</span>
                      {",\n  "}
                      <span className="lp-k">&quot;discount_pct&quot;</span>:{" "}
                      <span className="lp-n">40.0</span>
                      {",\n  "}
                      <span className="lp-k">&quot;region&quot;</span>: {"{ "}
                      <span className="lp-k">&quot;quality&quot;</span>:{" "}
                      <span className="lp-n">88</span>, <span className="lp-k">&quot;h3&quot;</span>
                      : <span className="lp-s">&quot;8a28308…&quot;</span>
                      {" }"}
                      {",\n  "}
                      <span className="lp-k">&quot;best_use&quot;</span>:{" "}
                      <span className="lp-s">&quot;reforma_revenda&quot;</span>
                      {"\n}"}
                    </pre>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
