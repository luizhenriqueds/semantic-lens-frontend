"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Nested inside ReportLayout, like ReportDenied. Without it a failed read here falls through to
 *  global-error, which replaces the whole document with an unstyled page. */
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
