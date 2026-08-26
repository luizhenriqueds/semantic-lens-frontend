"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** A same-URL Link is a no-op in the app router; only `refresh()` re-runs the failed server read.
 *  Disabled while pending: nothing caches a failure, so every click reaches Postgres. */
export default function RetryButton({ label = "Tentar novamente" }: { label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn ghost"
      type="button"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
    >
      {pending ? "Tentando…" : label}
    </button>
  );
}
