"use client";

import { useEffect } from "react";
import { AUTOPRINT_PARAM } from "@/lib/export";

const SETTLE_TIMEOUT_MS = 3000;

/**
 * Prints once the page settles: the root layout's fonts load with `display: "swap"`, and printing
 * before the swap captures fallback metrics and reflows. The timeout covers an image that never
 * resolves either way.
 */
export default function AutoPrint() {
  useEffect(() => {
    let cancelled = false;

    // A popup tab exists only to carry the dialog, so it closes after. The flag comes from
    // ExportButton because window.open's `noopener` nulls `window.opener`.
    const isPopup = new URLSearchParams(window.location.search).has(AUTOPRINT_PARAM);
    const onAfterPrint = () => {
      if (isPopup) window.close();
    };
    window.addEventListener("afterprint", onAfterPrint);

    const settled = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      ...Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }),
        ),
    ]);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, SETTLE_TIMEOUT_MS));

    void Promise.race([settled, timeout]).then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => window.print());
    });

    return () => {
      cancelled = true;
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  return null;
}
