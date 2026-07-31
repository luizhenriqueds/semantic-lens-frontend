"use client";

import { useState } from "react";
import { usePlan } from "@/components/plan/PlanProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { downloadText } from "@/lib/export/download";
import { AUTOPRINT_PARAM, EXPORT_ERROR, EXPORT_ROW_CAP, exportToast } from "@/lib/export";
import { IconDownload, IconPrinter } from "@/lib/icons";
import type { ExportResult } from "@/app/actions/export";

/** `csv` runs a server action and hands the string to the browser; `pdf` opens a report route. */
export default function ExportButton({
  csv,
  pdf,
  compact,
}: {
  csv?: () => Promise<ExportResult>;
  pdf?: string;
  compact?: boolean;
}) {
  const { can } = usePlan();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  const runCsv = async () => {
    setAsking(false);
    setBusy(true);
    try {
      const res = await csv!();
      if (!res.ok) {
        toast(EXPORT_ERROR[res.reason]);
        return;
      }
      downloadText(res.filename, res.csv);
      toast(exportToast(res.total, res.truncated));
    } catch {
      toast(EXPORT_ERROR.error);
    } finally {
      setBusy(false);
    }
  };

  const openPdf = () => {
    // Flags the tab as a print popup so it closes itself once the dialog is dismissed.
    const url = new URL(pdf!, window.location.origin);
    url.searchParams.set(AUTOPRINT_PARAM, "1");
    // Synchronous on purpose: an await before window.open trips the pop-up blocker.
    if (!window.open(url.toString(), "_blank", "noopener,noreferrer")) {
      toast("Permita pop-ups para gerar o PDF");
    }
  };

  // No upsell here: a plan without export sees no control at all. The server action re-checks.
  if (!can("export") || (!csv && !pdf)) return null;

  return (
    <div className="exportgroup">
      {csv && (
        <button type="button" className="btn ghost" disabled={busy} onClick={() => setAsking(true)}>
          <IconDownload width={16} height={16} strokeWidth={1.8} />{" "}
          {busy ? "Gerando…" : compact ? "CSV" : "Exportar CSV"}
        </button>
      )}
      {pdf && (
        <button type="button" className="btn ghost" onClick={openPdf}>
          <IconPrinter width={16} height={16} strokeWidth={1.8} />{" "}
          {compact ? "PDF" : "Exportar PDF"}
        </button>
      )}
      <ConfirmDialog
        open={asking}
        title="Exportar CSV"
        icon={<IconDownload width={22} height={22} strokeWidth={1.8} />}
        message={`O arquivo traz até ${EXPORT_ROW_CAP.toLocaleString("pt-BR")} imóveis, os primeiros da ordenação atual. Refine os filtros para exportar o restante.`}
        confirmLabel="Exportar"
        onConfirm={runCsv}
        onCancel={() => setAsking(false)}
      />
    </div>
  );
}
