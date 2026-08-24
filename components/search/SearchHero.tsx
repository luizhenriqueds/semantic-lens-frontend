"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { MAX_QUERY_CHARS } from "@/lib/facets/limits";
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
}: {
  label?: string;
  sub?: string;
  initial?: string;
  showExamples?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, startSubmit] = useTransition();
  const [empty, setEmpty] = useState(!initial.trim());

  const pickExample = (ex: string) => {
    if (inputRef.current) inputRef.current.value = ex;
    setEmpty(false);
    formRef.current?.requestSubmit();
  };

  // A plain GET submit reloads the document; the form stays as the no-JS fallback.
  const onSubmit = (e: React.FormEvent) => {
    const q = inputRef.current?.value.trim();
    if (!q) return;
    e.preventDefault();
    startSubmit(() => router.push(`/search?q=${encodeURIComponent(q)}`));
  };

  return (
    <div className="searchhero">
      {label && <div className="lbl">{label}</div>}
      {sub && <div className="sub">{sub}</div>}
      <form ref={formRef} className="bigsearch" action="/search" method="get" onSubmit={onSubmit}>
        <div className="field">
          <IconSearch strokeWidth={1.7} />
          <input
            ref={inputRef}
            name="q"
            defaultValue={initial}
            onChange={(e) => setEmpty(!e.target.value.trim())}
            placeholder="Ex.: apartamento para reformar e revender na zona sul"
            maxLength={MAX_QUERY_CHARS}
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
