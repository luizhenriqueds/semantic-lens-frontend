"use client";

import { useEffect, useRef, useState } from "react";
import { IconInfo } from "@/lib/icons";
import type { ScoreExplain } from "@/lib/types";

export default function ScoreWeights({ explain }: { explain: ScoreExplain }) {
  const weights = explain.terms
    .filter((t) => t.weight != null)
    .sort((a, b) => b.weight! - a.weight!);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!weights.length) return null;

  return (
    <div className="ihweights" ref={ref}>
      <button
        type="button"
        className="ihweights-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Peso de cada fator na nota"
        aria-expanded={open}
      >
        <IconInfo width={15} height={15} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="ihweights-pop" role="dialog">
          <div className="ihweights-h">Peso de cada fator na nota</div>
          {weights.map((t) => (
            <div className="ihweights-row" key={t.feature || t.label}>
              <span>{t.label}</span>
              <span className="ihweights-v">{Math.round(t.weight! * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
