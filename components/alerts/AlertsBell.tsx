"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAlerts } from "@/lib/alerts";
import { IconArrow, IconBell } from "@/lib/icons";

export default function AlertsBell() {
  const { alerts } = useAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeCount = alerts.filter((a) => a.on).length;
  const latest = alerts.slice(0, 4);

  return (
    <div className="notif" ref={ref}>
      <button
        className="iconbtn"
        aria-label="Ver alertas"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell width={20} height={20} strokeWidth={1.7} />
        {activeCount > 0 && <span className="dot" />}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Alertas recentes">
          <div className="notif-head">
            <b>Alertas recentes</b>
            {activeCount > 0 && (
              <span className="notif-count">
                {activeCount} ativo{activeCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {latest.length ? (
            <div className="notif-list">
              {latest.map((a) => (
                <Link key={a.id} href="/alerts" className="notif-item">
                  <span className={`notif-ic${a.on ? " on" : ""}`}>
                    <IconBell width={18} height={18} strokeWidth={1.7} />
                  </span>
                  <span className="notif-body">
                    <span className="notif-name">{a.nome}</span>
                    <span className="notif-freq">{a.freq}</span>
                  </span>
                  <span className={`notif-status${a.on ? " on" : ""}`}>
                    {a.on ? "Ativo" : "Pausado"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="notif-empty">
              Você ainda não tem alertas.
              <br />
              Crie um para ser avisado sobre novos imóveis.
            </div>
          )}

          <Link href="/alerts" className="notif-foot">
            Ver todos os alertas
            <IconArrow width={16} height={16} strokeWidth={2} />
          </Link>
        </div>
      )}
    </div>
  );
}
