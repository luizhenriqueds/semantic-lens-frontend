"use client";

import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { IconBuilding } from "@/lib/icons";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // `reset()` alone re-renders against the router cache, which still holds the entry that threw.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <section className="view">
      <EmptyState
        icon={<IconBuilding />}
        title="Não foi possível carregar esta página"
        action={
          <button className="btn solid" type="button" onClick={retry}>
            Tentar novamente
          </button>
        }
      >
        Não foi possível carregar os dados agora. Tente novamente em instantes.
      </EmptyState>
    </section>
  );
}
