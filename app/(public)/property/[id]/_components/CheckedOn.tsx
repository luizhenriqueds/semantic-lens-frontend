"use client";

import { fmtDay } from "@/lib/format";
import { useLastSeen } from "./useLastSeen";

type Props = { id: string; initial: string | null; variant: "meta" | "inline" };

/** Worded as a last confirmation, not as a claim about current availability. */
export default function CheckedOn({ id, initial, variant }: Props) {
  const day = fmtDay(useLastSeen(id, initial));
  if (!day) return null;
  return <>{variant === "meta" ? ` · VISTO EM ${day}` : ` · visto em ${day}`}</>;
}
