"use client";

import Link from "next/link";
import { usePlan } from "@/components/plan/PlanProvider";
import { PLANS } from "@/lib/entitlements";
import type { Plan } from "@/lib/entitlements";

/** `n / limit`, and only where there is a limit — an uncapped plan has nothing to report. Anon
 *  sees the cap a free account would get, since that is what signing up buys them. */
export default function UsageMeter({
  used,
  quota,
  noun,
}: {
  used: number;
  quota: keyof Plan["limits"];
  noun: string;
}) {
  const { role, limit } = usePlan();
  const cap = role === "anon" ? PLANS.basic.limits[quota] : limit(quota);
  if (cap == null) return null;

  const full = used >= cap;
  return (
    <span className={`usagemeter${full ? " full" : ""}`}>
      <b>
        {used}/{cap}
      </b>{" "}
      {noun}
      {full && (
        <>
          {" · "}
          <Link href="/#planos">liberar mais</Link>
        </>
      )}
    </span>
  );
}
