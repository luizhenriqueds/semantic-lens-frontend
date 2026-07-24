"use client";

import { useEffect } from "react";

export default function LandingEffects() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // mobile nav (hamburger)
    const nav = document.querySelector<HTMLElement>(".lp-nav");
    const navToggle = document.getElementById("navtoggle");
    const onToggle = () => {
      const open = nav?.classList.toggle("lp-open");
      navToggle?.setAttribute("aria-expanded", open ? "true" : "false");
    };
    const closeNav = () => {
      nav?.classList.remove("lp-open");
      navToggle?.setAttribute("aria-expanded", "false");
    };
    navToggle?.addEventListener("click", onToggle);

    // smooth-scroll in-page anchors + close the mobile menu
    const anchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('.lp-landing a[href^="#"]'),
    );
    const onAnchor = (e: Event) => {
      const href = (e.currentTarget as HTMLAnchorElement).getAttribute("href") ?? "";
      const target = href.length > 1 ? document.querySelector(href) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
      closeNav();
    };
    anchors.forEach((a) => a.addEventListener("click", onAnchor));

    // fill score bars / draw rings within an element
    const animate = (el: Element) => {
      el.querySelectorAll<HTMLElement>(".lp-track i[data-w]").forEach((i) => {
        i.style.width = i.dataset.w ?? "";
      });
      el.querySelectorAll<SVGElement>(".lp-ring .lp-bar[data-off]").forEach((b) => {
        b.style.strokeDashoffset = b.dataset.off ?? "";
      });
    };

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("lp-in");
          animate(e.target);
          reveal.unobserve(e.target);
        }
      },
      { threshold: 0.18 },
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => reveal.observe(el));

    // the capability mocks aren't .lp-reveal — animate them independently
    const mocks = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          animate(e.target);
          mocks.unobserve(e.target);
        }
      },
      { threshold: 0.25 },
    );
    document.querySelectorAll(".lp-lviz").forEach((el) => mocks.observe(el));

    // hero mock is above the fold — kick it off immediately
    document.querySelectorAll(".lp-heromock").forEach((el) => {
      el.classList.add("lp-in");
      animate(el);
    });

    const sliderCleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".lp-m-slide").forEach((slider) => {
      const total = slider.childElementCount;
      if (total < 2) return;
      const dots = document.createElement("div");
      dots.className = "lp-slidedots";
      dots.setAttribute("aria-hidden", "true");
      for (let i = 0; i < total; i++) dots.appendChild(document.createElement("i"));
      slider.after(dots);
      const marks = Array.from(dots.children);
      const sync = () => {
        const step = slider.scrollWidth / total;
        const active = step > 0 ? Math.min(Math.round(slider.scrollLeft / step), total - 1) : 0;
        marks.forEach((m, i) => m.classList.toggle("lp-on", i === active));
      };
      sync();
      slider.addEventListener("scroll", sync, { passive: true });
      sliderCleanups.push(() => {
        slider.removeEventListener("scroll", sync);
        dots.remove();
      });
    });

    return () => {
      navToggle?.removeEventListener("click", onToggle);
      anchors.forEach((a) => a.removeEventListener("click", onAnchor));
      reveal.disconnect();
      mocks.disconnect();
      stop();
      sliderCleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
