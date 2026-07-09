"use client";

import { useToast } from "@/components/ui/Toaster";
import { useSaved } from "@/lib/saved";
import { IconHeart } from "@/lib/icons";

export default function FavoriteButton({ id, title }: { id: string; title?: string }) {
  const { isSaved, toggle } = useSaved();
  const toast = useToast();
  const saved = isSaved(id);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
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
