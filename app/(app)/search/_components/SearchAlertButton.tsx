"use client";

import Link from "next/link";
import { useAlerts } from "@/lib/alerts";
import { useToast } from "@/components/ui/Toaster";
import { IconArrow, IconBell } from "@/lib/icons";

export default function SearchAlertButton({ query }: { query: string }) {
  const { alerts, add: addAlert } = useAlerts();
  const toast = useToast();

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

  const createAlert = () => {
    addAlert(q, "Aviso diário");
    toast("Alerta criado");
  };

  return (
    <button
      type="button"
      className="btn ghost"
      style={{ alignSelf: "center", flexShrink: 0 }}
      onClick={createAlert}
    >
      <IconBell width={16} height={16} strokeWidth={1.8} /> Criar alerta desta busca
    </button>
  );
}
