"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SectionHead from "@/components/discovery/SectionHead";
import { DISCOVERY_GOALS } from "@/lib/discovery";
import { PROFILE_SHORT } from "@/lib/format";
import type { ProfileKey } from "@/lib/types";

export default function GoalChips({ active }: { active: ProfileKey }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // `active` only flips once the server responds, so the click paints optimistically and
  // the server has the last word as soon as the transition settles.
  const [picked, setPicked] = useState<ProfileKey | null>(null);
  const shown = pending ? (picked ?? active) : active;

  // The day seed is deterministic, so re-rendering the page on the server leaves every
  // other section byte-identical - only the goal rail moves.
  const pick = (goal: ProfileKey) => {
    if (goal === shown) return;
    setPicked(goal);
    start(() => router.replace(`/dashboard?goal=${goal}`, { scroll: false }));
  };

  return (
    <>
      <SectionHead
        title="Para o seu objetivo"
        why="escolha o que você quer fazer com o imóvel — a lista muda com a sua escolha"
      />
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
          >
            {PROFILE_SHORT[g]}
          </button>
        ))}
      </div>
    </>
  );
}
