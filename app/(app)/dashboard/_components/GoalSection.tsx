"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SectionHead from "@/components/discovery/SectionHead";
import { DISCOVERY_GOALS } from "@/lib/discovery";
import { PROFILE_SHORT } from "@/lib/format";
import type { ProfileKey } from "@/lib/types";

const hrefFor = (goal: ProfileKey) => `/dashboard?goal=${goal}`;

// Owns the chips and the rail together: the rail is a server component, so wrapping it is the
// only way it can show the transition its chips triggered. Its Suspense boundary is deliberately
// unkeyed - re-keying remounted it, and the skeleton's shorter document yanked the scroll up.
export default function GoalSection({
  active,
  children,
}: {
  active: ProfileKey;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // `active` only flips once the server responds, so the click paints optimistically and
  // the server has the last word as soon as the transition settles.
  const [picked, setPicked] = useState<ProfileKey | null>(null);
  const shown = pending ? (picked ?? active) : active;

  const pick = (goal: ProfileKey) => {
    if (goal === shown) return;
    setPicked(goal);
    start(() => router.replace(hrefFor(goal), { scroll: false }));
  };

  // Warms the route only; the rail's query is warmed server-side in GoalRailSlot.
  const warm = (goal: ProfileKey) => {
    if (goal !== shown) router.prefetch(hrefFor(goal));
  };

  return (
    <>
      <div className="railsec">
        <SectionHead title="Para o seu objetivo" why="escolha o seu objetivo com o imóvel" />
        <div className="goalchips" role="group" aria-label="Objetivo">
          {DISCOVERY_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              className={`goalchip${g === shown ? " on" : ""}${
                pending && g === shown ? " loading" : ""
              }`}
              aria-pressed={g === shown}
              aria-busy={pending && g === shown}
              onClick={() => pick(g)}
              onPointerEnter={() => warm(g)}
              onFocus={() => warm(g)}
            >
              {PROFILE_SHORT[g]}
            </button>
          ))}
        </div>
      </div>

      <div className="goalrail" aria-busy={pending}>
        {pending && <div className="viewloadbar" aria-hidden />}
        <div className={`viewinner${pending ? " loading" : ""}`}>{children}</div>
      </div>
    </>
  );
}
