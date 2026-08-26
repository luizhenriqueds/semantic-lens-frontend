"use client";

import { useEffect, useState } from "react";
import { IconClose } from "@/lib/icons";

const ENABLED = process.env.NEXT_PUBLIC_OUTAGE_BANNER === "true";
const KEY = "outage-dismissed";

/**
 * Mount-gated: the sidebar is `position: fixed`, so the banner pays for itself with a `--banner-h`
 * offset that must not be baked into cached HTML. The height stays in CSS behind `data-banner`.
 */
export default function OutageBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ENABLED) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(KEY) === "1";
    } catch (err) {
      console.warn("Failed to read banner state", err);
    }
    if (dismissed) return;
    setShow(true);
    document.documentElement.dataset.banner = "on";
    return () => {
      delete document.documentElement.dataset.banner;
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    delete document.documentElement.dataset.banner;
    try {
      sessionStorage.setItem(KEY, "1");
    } catch (err) {
      console.warn("Failed to persist banner state", err);
    }
  };

  return (
    <div className="outage-banner" role="status">
      <span>
        Estamos com instabilidade técnica e algumas buscas podem falhar. Já estamos trabalhando para
        resolver.
      </span>
      <button type="button" onClick={dismiss} aria-label="Dispensar aviso">
        <IconClose width={16} height={16} strokeWidth={2} />
      </button>
    </div>
  );
}
