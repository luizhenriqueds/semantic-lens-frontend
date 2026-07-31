"use client";

import { PLANS, requiredPlan } from "@/lib/entitlements";
import type { Feature, Role } from "@/lib/entitlements";

/** Marks a locked surface with the plan that unlocks it. Free features carry no badge. */
export default function PlanBadge({ feature, minRole }: { feature?: Feature; minRole?: Role }) {
  const plan = minRole ? PLANS[minRole] : feature ? requiredPlan(feature) : PLANS.professional;
  if (plan.rank <= PLANS.basic.rank) return null;
  return (
    <span className="planbadge" title={`Disponível no plano ${plan.label}`}>
      {plan.badge ?? plan.label}
    </span>
  );
}
