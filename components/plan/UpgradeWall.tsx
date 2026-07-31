import PlanCta from "@/components/plan/PlanCta";
import { FEATURE_COPY, canTrial, upsellTitle } from "@/lib/entitlements/copy";
import EmptyState from "@/components/ui/EmptyState";
import { IconLock } from "@/lib/icons";
import { money } from "@/lib/format";
import { requiredPlan } from "@/lib/entitlements";
import type { Feature, Role, Trial } from "@/lib/entitlements";

/** Server-side counterpart to UpgradeDialog, for pages and cards reached by deep link. */
export default function UpgradeWall({
  feature,
  role,
  trial,
  children,
}: {
  feature: Feature;
  role: Role;
  trial: Trial;
  children?: React.ReactNode;
}) {
  const plan = requiredPlan(feature);
  const trialable = canTrial(plan, trial);

  return (
    <EmptyState
      icon={<IconLock />}
      title={upsellTitle(feature, role, trial)}
      action={<PlanCta target={plan.role} role={role} trial={trial} />}
    >
      {children ?? FEATURE_COPY[feature].blurb}
      {role !== "anon" && !trialable && plan.price > 0 && (
        <span className="wall-price">
          {" "}
          A partir de <b>{money(plan.price)}/mês</b>.
        </span>
      )}
    </EmptyState>
  );
}
