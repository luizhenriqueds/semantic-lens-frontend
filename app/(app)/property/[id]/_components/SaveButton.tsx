"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useSaved } from "@/lib/saved";

export default function SaveButton({ id }: { id: string }) {
  const { isSaved, toggle } = useSaved();
  const [confirming, setConfirming] = useState(false);
  const saved = isSaved(id);

  return (
    <>
      <button
        className={saved ? "btn ghost" : "btn solid"}
        onClick={() => (saved ? setConfirming(true) : toggle(id))}
        style={{ justifyContent: "center", width: "100%" }}
      >
        {saved ? "✓ Salvo na carteira" : "Salvar na carteira"}
      </button>
      <ConfirmDialog
        open={confirming}
        title="Remover da carteira?"
        message="O imóvel sai da sua carteira e você deixa de acompanhar as datas e avisos dele."
        confirmLabel="Remover"
        danger
        onConfirm={() => {
          toggle(id);
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
