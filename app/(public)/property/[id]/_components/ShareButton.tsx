"use client";

import { useToast } from "@/components/ui/Toaster";
import { whatsappHref } from "@/lib/share";
import { IconShare } from "@/lib/icons";

export default function ShareButton({
  title,
  text,
  url,
  compact = false,
}: {
  title: string;
  text: string;
  /** Absolute and query-free, so every share hits one WhatsApp preview cache. */
  url: string;
  compact?: boolean;
}) {
  const toast = useToast();
  const href = whatsappHref(text, url);

  // An anchor so wa.me still works with JS off; the native sheet layers on top, decided at click
  // time so the markup stays hydration-safe.
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    e.preventDefault();
    navigator.share({ title, text, url }).catch((err: unknown) => {
      // AbortError is the user dismissing the sheet, not a failure to fall back from.
      if (err instanceof Error && err.name === "AbortError") return;
      toast("Abrindo o WhatsApp…");
      window.location.href = href;
    });
  };

  return (
    <a
      className={compact ? "sharebtn" : "btn ghost sharecta"}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label="Compartilhar este imóvel"
    >
      <IconShare aria-hidden />
      <span className="txt">Compartilhar</span>
    </a>
  );
}
