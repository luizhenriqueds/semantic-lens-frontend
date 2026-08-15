"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { IconBuilding } from "@/lib/icons";

export default function RouteError({
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
    <section className="view">
      <EmptyState
        icon={<IconBuilding />}
        title="Não foi possível carregar esta página"
        action={
          <button className="btn solid" type="button" onClick={reset}>
            Tentar novamente
          </button>
        }
      >
        Não foi possível carregar os dados agora. Tente novamente em instantes.
      </EmptyState>
    </section>
  );
}
