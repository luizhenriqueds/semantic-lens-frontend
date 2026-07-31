// Isomorphic: the client button imports the copy and the cap without pulling in any server code.

/** Rows per file. Deliberately well under the corpus, so the export is a working set rather
 *  than a route to the whole base. */
export const EXPORT_ROW_CAP = 1000;

/** Marks a report tab as opened solely to carry the print dialog, so it closes itself after. */
export const AUTOPRINT_PARAM = "autoprint";

export type ExportFailure = "auth" | "plan" | "filter" | "empty" | "error";

export const EXPORT_ERROR: Record<ExportFailure, string> = {
  auth: "Entre na sua conta para exportar",
  plan: "A exportação está disponível no plano Profissional",
  filter: "Aplique um filtro ou uma busca antes de exportar",
  empty: "Não há imóveis para exportar com estes filtros",
  error: "Não foi possível gerar o arquivo",
};

export function exportToast(total: number, truncated: boolean): string {
  const n = (v: number) => v.toLocaleString("pt-BR");
  if (!truncated) {
    return total === 1 ? "1 imóvel exportado" : `${n(total)} imóveis exportados`;
  }
  return (
    `Exportados os ${n(EXPORT_ROW_CAP)} primeiros de ${n(total)} imóveis. ` +
    "Refine os filtros para exportar o restante."
  );
}
