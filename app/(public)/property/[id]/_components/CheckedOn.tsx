"use client";

import { fmtDay } from "@/lib/format";
import { useLastSeen } from "./useLastSeen";

type Props = { id: string; initial: string | null; variant: "meta" | "inline" };

/** "Visto em", not "disponível em": the date is the last confirmation, not a claim about now. */
export default function CheckedOn({ id, initial, variant }: Props) {
  const day = fmtDay(useLastSeen(id, initial));
  if (!day) return null;
  return <>{variant === "meta" ? ` · VISTO EM ${day}` : ` · visto em ${day}`}</>;
}
