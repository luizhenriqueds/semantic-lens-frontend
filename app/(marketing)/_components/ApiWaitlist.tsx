"use client";

import { useEffect, useState } from "react";

const SOURCES = [
  "Busca no Google",
  "Indicação de alguém",
  "Redes sociais",
  "Evento ou comunidade",
  "Outro",
];

const USES = [
  "Portais e marketplaces",
  "CRM / gestão de carteira",
  "Análise e BI",
  "Automação e planilhas",
  "Revenda / parceria",
  "Outro",
];

export default function ApiWaitlist() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
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

  return (
    <>
      <button
        className="lp-apibtn"
        type="button"
        onClick={() => {
          setSent(false);
          setOpen(true);
        }}
      >
        Entrar na lista de espera
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12h14m0 0-6-6m6 6-6 6" />
        </svg>
      </button>

      {open && (
        <div
          className="lp-modal-scrim"
          role="dialog"
          aria-modal="true"
          aria-label="Lista de espera da API"
          onClick={() => setOpen(false)}
        >
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
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

            {sent ? (
              <div className="lp-modal-done">
                <span className="lp-modal-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <h3>Você está na lista!</h3>
                <p>
                  Obrigado pelo interesse. Avisamos no seu e-mail assim que a API entrar em fase de
                  testes.
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <span className="lp-soon">Em breve</span>
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
                        key={u}
                        className={`lp-check${uses.includes(u) ? " lp-on" : ""}`}
                        aria-pressed={uses.includes(u)}
                        onClick={() => toggleUse(u)}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="lp-btn lp-solid lp-big lp-modal-submit"
                  type="submit"
                  disabled={!email || !source || uses.length === 0}
                >
                  Entrar na lista de espera
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
