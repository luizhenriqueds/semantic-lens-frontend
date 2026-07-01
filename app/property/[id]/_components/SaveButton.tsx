"use client";

import { useSaved } from "@/lib/saved";

export default function SaveButton({ id }: { id: string }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(id);
  return (
    <button
      className={saved ? "btn ghost" : "btn solid"}
      onClick={() => toggle(id)}
      style={{ justifyContent: "center", width: "100%" }}
    >
      {saved ? "✓ Salvo na carteira" : "Salvar na carteira"}
    </button>
  );
}
