"use client";

import { fmtDay } from "@/lib/format";
import { useLastSeen } from "./useFreshness";

export default function AvailabilityNote({ id, initial }: { id: string; initial: string | null }) {
  const day = fmtDay(useLastSeen(id, initial));
  if (!day) return null;
  return (
    <div className="availnote">
      A oferta foi vista na Caixa em {day}. Confirme no anúncio original antes de negociar.
    </div>
  );
}
