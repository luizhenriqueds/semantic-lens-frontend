"use client";

import { usePlan } from "@/components/plan/PlanProvider";
import { useToast } from "@/components/ui/Toaster";
import { useSaved } from "@/lib/saved";
import { IconHeart } from "@/lib/icons";

export default function FavoriteButton({ id, title }: { id: string; title?: string }) {
  const { isSaved, toggle } = useSaved();
  const { require, showQuotaUpsell } = usePlan();
  const toast = useToast();
  const saved = isSaved(id);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!require("favorites")) return;
    if (!(await toggle(id))) return showQuotaUpsell("favorites");
    toast(saved ? "Imóvel removido da carteira" : "Imóvel salvo na carteira");
  };

  return (
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
  );
}
