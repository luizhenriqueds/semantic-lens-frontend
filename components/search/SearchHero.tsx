"use client";

import { useRef, useState } from "react";
import { IconSearch } from "@/lib/icons";

const EXAMPLES = [
  "Casa para família",
  "Comprar, reformar e revender",
  "Aluguel para estudantes",
  "Imóvel com boa liquidez",
];

export default function SearchHero({
  label = "O que você está procurando?",
  sub = "Escreva com suas palavras, como se estivesse falando com um corretor.",
  showExamples = true,
  initial = "",
  scope,
}: {
  label?: string;
  sub?: string;
  initial?: string;
  showExamples?: boolean;
  scope?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [empty, setEmpty] = useState(!initial.trim());

  const pickExample = (ex: string) => {
    if (inputRef.current) inputRef.current.value = ex;
    setEmpty(false);
    formRef.current?.requestSubmit();
  };

  const onSubmit = () => {
    if (!inputRef.current?.value.trim()) return;
    setSubmitting(true);
  };

  return (
    <div className="searchhero">
      {label && <div className="lbl">{label}</div>}
      {sub && <div className="sub">{sub}</div>}
      <form ref={formRef} className="bigsearch" action="/search" method="get" onSubmit={onSubmit}>
        {scope === "matriculas" && <input type="hidden" name="scope" value="matriculas" />}
        <div className="field">
          <IconSearch strokeWidth={1.7} />
          <input
            ref={inputRef}
            name="q"
            defaultValue={initial}
            onChange={(e) => setEmpty(!e.target.value.trim())}
            placeholder={
              scope === "matriculas"
                ? "Ex.: matrícula com indisponibilidade ou penhora"
                : "Ex.: apartamento para reformar e revender na zona sul"
            }
            autoFocus
          />
        </div>
        <button className="btn solid big" type="submit" disabled={submitting || empty}>
          {submitting ? "Buscando…" : "Buscar"}
        </button>
      </form>
      {showExamples && (
        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="ex" onClick={() => pickExample(ex)}>
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
