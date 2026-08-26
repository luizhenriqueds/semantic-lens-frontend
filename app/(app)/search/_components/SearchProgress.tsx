"use client";

import { useEffect, useState } from "react";

// Roughly tracks the real pipeline, so a slow search reads as progress rather than a stall.
const STEPS = [
  { at: 0, text: "Entendendo o que você procura…" },
  { at: 900, text: "Procurando imóveis parecidos…" },
  { at: 2200, text: "Comparando milhares de anúncios…" },
  { at: 4000, text: "Ordenando pelos mais relevantes…" },
];

// Past the last step there is nothing left to narrate, so the tail rotates: a frozen line reads as
// a hang, and "quase lá" promised an imminence we cannot know.
const TAIL = [
  "Esta busca está levando mais que o normal…",
  "Ainda buscando - buscas muito específicas demoram um pouco mais.",
];
const TAIL_AT = 7000;
const TAIL_EVERY = 3500;

/** `static` narrates nothing: a browse has no pipeline to report on, so the timers never start. */
export default function SearchProgress({ static: fixed }: { static?: string }) {
  const [text, setText] = useState(fixed ?? STEPS[0].text);

  useEffect(() => {
    if (fixed) return;
    const timers = STEPS.slice(1).map((s) => setTimeout(() => setText(s.text), s.at));
    timers.push(
      setTimeout(() => {
        let i = 0;
        setText(TAIL[0]);
        timers.push(setInterval(() => setText(TAIL[++i % TAIL.length]), TAIL_EVERY));
      }, TAIL_AT),
    );
    // clearTimeout and clearInterval share one id map, so the interval clears here too.
    return () => timers.forEach(clearTimeout);
  }, [fixed]);

  return (
    <div className="searchloading">
      <span className="spinner" aria-hidden="true" />
      <span aria-live="polite">{text}</span>
    </div>
  );
}
