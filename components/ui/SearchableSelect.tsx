"use client";

import { useEffect, useRef, useState } from "react";

type Opt = { value: string; label: string };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function SearchableSelect({
  label,
  value,
  options,
  onChange,
  allLabel = "todos",
}: {
  label: string;
  value: string;
  options: Opt[];
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const all: Opt[] = [{ value: "all", label: allLabel }, ...options];
  const current = all.find((o) => o.value === value)?.label ?? allLabel;
  const filtered = q ? all.filter((o) => norm(o.label).includes(norm(q))) : all;

  return (
    <div className={`ssel${value !== "all" ? " on" : ""}`} ref={ref}>
      <button
        type="button"
        className="selectish ssel-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="ssel-cur">
          {label}: {current}
        </span>
        <span className="ssel-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="ssel-pop">
          <input
            className="ssel-search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Buscar ${label.toLowerCase()}…`}
          />
          <div className="ssel-list">
            {filtered.length ? (
              filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  className={`ssel-opt${o.value === value ? " sel" : ""}`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  {o.label}
                </button>
              ))
            ) : (
              <div className="ssel-empty">Nada encontrado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
