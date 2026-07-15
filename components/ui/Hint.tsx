"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconInfo } from "@/lib/icons";

export default function Hint({
  title,
  children,
  align = "right",
  size = 15,
}: {
  title: string;
  children: React.ReactNode;
  align?: "left" | "right";
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

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

  return (
    <span className="hint" ref={ref}>
      <button
        type="button"
        className="hint-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={title}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
      >
        <IconInfo width={size} height={size} strokeWidth={1.8} />
      </button>
      {open && (
        <span className={`hint-pop ${align}`} id={id} role="tooltip">
          <span className="hint-h">{title}</span>
          <span className="hint-body">{children}</span>
        </span>
      )}
    </span>
  );
}
