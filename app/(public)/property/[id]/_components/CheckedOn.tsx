"use client";

import { fmtDay } from "@/lib/format";
import { useLastSeen } from "./useLastSeen";

type Props = { id: string; initial: string | null; variant: "meta" | "inline" };

/** Undated offers carry the day the batch last found them. "Visto em" rather than "disponível em":
 *  the date is the last confirmation, not a promise about now. */
export default function CheckedOn({ id, initial, variant }: Props) {
  const day = fmtDay(useLastSeen(id, initial));
  if (!day) return null;
  return <>{variant === "meta" ? ` · VISTO EM ${day}` : ` · visto em ${day}`}</>;
}
