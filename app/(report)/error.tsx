"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Without it a failed read falls through to global-error, which blanks the whole document. */
export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="report-empty">
      <h1>Relatório indisponível</h1>
      <p>Não foi possível carregar os dados agora. Tente novamente em instantes.</p>
      <button className="btn solid" type="button" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
