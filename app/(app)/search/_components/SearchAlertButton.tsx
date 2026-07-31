"use client";

import { useState } from "react";
import Link from "next/link";
import { resolveAlertQuery } from "@/app/actions/alerts";
import { usePlan } from "@/components/plan/PlanProvider";
import { alertError, useAlerts } from "@/lib/alerts";
import { useToast } from "@/components/ui/Toaster";
import { IconArrow, IconBell } from "@/lib/icons";

export default function SearchAlertButton({ query }: { query: string }) {
  const { alerts, add: addAlert } = useAlerts();
  const { require } = usePlan();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const q = query.trim();
  if (!q) return null;

  const exists = alerts.some((a) => a.name.trim().toLowerCase() === q.toLowerCase());

  if (exists) {
    return (
      <Link className="btn ghost" href="/alerts" style={{ alignSelf: "center", flexShrink: 0 }}>
        <IconBell width={16} height={16} strokeWidth={1.8} /> Editar alerta
        <IconArrow width={15} height={15} strokeWidth={1.8} />
      </Link>
    );
  }

  // The alert is sent from the resolved filters, never from the query text - so the
  // search is resolved once, here, and the phrase is kept only as the alert's name.
  const createAlert = async () => {
    if (!require("savedSearches")) return;
    setSaving(true);
    try {
      const { criteria, dropped } = await resolveAlertQuery(q);
      if (!criteria) {
        toast("Não conseguimos transformar esta busca em um alerta");
        return;
      }
      const res = await addAlert(q, "Aviso diário", criteria);
      if (!res.ok) {
        toast(alertError(res.reason));
        return;
      }
      toast(dropped.length ? `Alerta criado, sem ${dropped.join(" e ")}` : "Alerta criado");
    } catch {
      toast("Não foi possível criar o alerta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      className="btn ghost"
      style={{ alignSelf: "center", flexShrink: 0 }}
      disabled={saving}
      onClick={createAlert}
    >
      <IconBell width={16} height={16} strokeWidth={1.8} />{" "}
      {saving ? "Criando alerta…" : "Criar alerta desta busca"}
    </button>
  );
}
