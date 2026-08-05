"use client";

import { useState } from "react";
import { usePlan } from "@/components/plan/PlanProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { REMOVE_FAVORITE_CONFIRM, useSaved } from "@/lib/saved";

export default function SaveButton({ id, propertyLabel }: { id: string; propertyLabel?: string }) {
  const { isSaved, toggle } = useSaved();
  const { require, showQuotaUpsell } = usePlan();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const saved = isSaved(id);

  const save = async () => {
    if (!require("favorites", { propertyLabel })) return;
    if (!(await toggle(id))) return showQuotaUpsell("favorites");
    toast("Imóvel salvo na carteira");
  };

  return (
    <>
      <button
        className={saved ? "btn ghost" : "btn solid"}
        onClick={() => (saved ? setConfirming(true) : save())}
        style={{ justifyContent: "center", width: "100%" }}
      >
        {saved ? "✓ Salvo na carteira" : "Salvar na carteira"}
      </button>
      <ConfirmDialog
        open={confirming}
        {...REMOVE_FAVORITE_CONFIRM}
        danger
        onConfirm={() => {
          toggle(id);
          setConfirming(false);
          toast("Imóvel removido da carteira");
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
