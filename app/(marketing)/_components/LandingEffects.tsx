"use client";

import { useEffect } from "react";

export default function LandingEffects() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          entry.target.querySelectorAll<HTMLElement>(".lp-track i[data-w]").forEach((bar) => {
            bar.style.width = bar.dataset.w ?? "";
          });
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll(".lp-reveal, .lp-layer").forEach((el) => io.observe(el));

    if (reduced) return () => io.disconnect();

    // pilha: a camada fixada recua conforme a próxima passa por cima
    const layers = Array.from(document.querySelectorAll<HTMLElement>(".lp-layer"));
    const stackedMq = window.matchMedia("(min-width: 881px)");
    const onScroll = () => {
      layers.forEach((layer, i) => {
        const card = layer.querySelector<HTMLElement>(".lp-lcard");
        if (!card) return;
        const next = layers[i + 1];
        if (!stackedMq.matches || !next) {
          card.style.transform = "";
          card.style.filter = "";
          return;
        }
        const rect = next.getBoundingClientRect();
        const overlap = Math.min(
          Math.max((window.innerHeight - rect.top) / window.innerHeight, 0),
          1,
        );
        card.style.transform = `scale(${1 - overlap * 0.045})`;
        card.style.filter = overlap > 0 ? `brightness(${1 - overlap * 0.05})` : "";
      });
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      document.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
