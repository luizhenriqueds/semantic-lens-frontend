"use client";

import { IconPrinter } from "@/lib/icons";

/** Screen-only, so a user who dismissed the automatic dialog can bring it back. */
export default function PrintBar() {
  return (
    <div className="report-bar noprint">
      <button type="button" className="btn solid" onClick={() => window.print()}>
        <IconPrinter width={16} height={16} strokeWidth={1.8} /> Salvar como PDF
      </button>
      <button type="button" className="btn ghost" onClick={() => window.close()}>
        Fechar
      </button>
    </div>
  );
}
