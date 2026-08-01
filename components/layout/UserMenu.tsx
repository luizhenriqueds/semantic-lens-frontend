"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePlan } from "@/components/plan/PlanProvider";
import type { Account } from "@/lib/account";
import { fmtDay } from "@/lib/format";
import { TRIAL_DAYS } from "@/lib/entitlements";
import { IconSliders } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({ account }: { account: Account }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { plan, trial, atLeast } = usePlan();

  const { name, email, initials } = account;

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

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="usermenu" ref={ref}>
      <button
        className="userbadge"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Conta"
      >
        <span className="useravatar">{initials}</span>
        <span className="usermenu-email">{name}</span>
        <svg
          className="userchev"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="usermenu-panel" role="menu">
          <div className="usermenu-head">
            <span className="useravatar lg">{initials}</span>
            <div className="usermenu-id">
              <b>{name}</b>
              <span>{email}</span>
            </div>
          </div>
          <div className="usermenu-plan">
            <span className="chip on">{plan.label}</span>
            {trial.endsAt ? (
              <small>teste até {fmtDay(trial.endsAt)}</small>
            ) : (
              !atLeast("professional") && (
                <Link href="/#planos" onClick={() => setOpen(false)}>
                  {trial.eligible ? `Testar ${TRIAL_DAYS} dias` : "Ver planos"}
                </Link>
              )
            )}
          </div>
          <Link
            className="usermenu-item"
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <IconSliders width={18} height={18} strokeWidth={1.8} />
            Configurações
          </Link>
          <button className="usermenu-signout" onClick={signOut} disabled={busy} role="menuitem">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {busy ? "Saindo…" : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
