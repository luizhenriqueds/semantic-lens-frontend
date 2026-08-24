"use client";

import { useEffect } from "react";

// iOS Safari scrolls the document element, so `body { overflow: hidden }` leaves the page behind a
// fullscreen overlay scrollable; pinning the body at its offset is what blocks it. The counter
// keeps a dialog opened from an open drawer from unlocking early.
let locks = 0;
let restore: (() => void) | null = null;

function lock(): void {
  if (locks++) return;
  const { body, documentElement: html } = document;
  const y = window.scrollY;
  const prev = {
    htmlOverflow: html.style.overflow,
    scrollBehavior: html.style.scrollBehavior,
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };

  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${y}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";

  restore = () => {
    html.style.overflow = prev.htmlOverflow;
    body.style.overflow = prev.overflow;
    body.style.position = prev.position;
    body.style.top = prev.top;
    body.style.left = prev.left;
    body.style.right = prev.right;
    body.style.width = prev.width;
    // Jumping back would animate if the page opted into smooth scrolling.
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, y);
    html.style.scrollBehavior = prev.scrollBehavior;
  };
}

function unlock(): void {
  if (--locks > 0) return;
  locks = 0;
  restore?.();
  restore = null;
}

/** Blocks page scrolling while `active`, on iOS Safari too. No-op when inactive. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
