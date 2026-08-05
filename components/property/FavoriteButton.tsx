"use client";

import { useState } from "react";
import { usePlan } from "@/components/plan/PlanProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { REMOVE_FAVORITE_CONFIRM, useSaved } from "@/lib/saved";
import { IconHeart } from "@/lib/icons";

export default function FavoriteButton({
  id,
  title,
  confirmRemove = false,
}: {
  id: string;
  title?: string;
  /** Portfolio list only: removing there is a deliberate step back, not a quick toggle. */
  confirmRemove?: boolean;
}) {
  const { isSaved, toggle } = useSaved();
  const { require, showQuotaUpsell } = usePlan();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const saved = isSaved(id);

  const commit = async () => {
    if (!(await toggle(id))) return showQuotaUpsell("favorites");
    toast(saved ? "Imóvel removido da carteira" : "Imóvel salvo na carteira");
  };

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!require("favorites", { propertyLabel: title })) return;
    if (saved && confirmRemove) return setConfirming(true);
    await commit();
  };

  return (
    <>
      <button
        type="button"
        className={`favbtn${saved ? " on" : ""}`}
        onClick={onClick}
        aria-pressed={saved}
        aria-label={
          saved
            ? `Remover ${title ?? "imóvel"} da carteira`
            : `Salvar ${title ?? "imóvel"} na carteira`
        }
      >
        <IconHeart fill={saved ? "currentColor" : "none"} />
      </button>
      {confirmRemove && (
        <ConfirmDialog
          open={confirming}
          {...REMOVE_FAVORITE_CONFIRM}
          danger
          onConfirm={() => {
            setConfirming(false);
            void commit();
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
