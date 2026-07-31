"use client";

import { useEffect, useState } from "react";

// Roughly tracks the real pipeline, so a slow search reads as progress rather than a stall.
const STEPS = [
  { at: 0, text: "Entendendo o que você procura…" },
  { at: 700, text: "Procurando imóveis parecidos…" },
  { at: 1800, text: "Comparando milhares de anúncios…" },
  { at: 3200, text: "Ordenando pelos mais relevantes…" },
  { at: 6000, text: "Quase lá - esta busca está levando um pouco mais que o normal." },
];

export default function SearchProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.slice(1).map((s, i) => setTimeout(() => setStep(i + 1), s.at));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="searchloading">
      <span className="spinner" aria-hidden="true" />
      <span aria-live="polite">{STEPS[step].text}</span>
    </div>
  );
}
