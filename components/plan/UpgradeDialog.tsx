"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PaywallDialog from "@/components/plan/PaywallDialog";
import PlanCta from "@/components/plan/PlanCta";
import Modal from "@/components/ui/Modal";
import { IconLock } from "@/lib/icons";
import { canTrial, quotaUpsell, upsellBody, upsellTitle } from "@/lib/entitlements/copy";
import { PLANS, requiredPlan, TRIAL_ROLE } from "@/lib/entitlements";
import type { Feature, Role, Trial } from "@/lib/entitlements";

export default function UpgradeDialog({
  feature,
  quota,
  role,
  trial,
  onClose,
}: {
  feature: Feature | null;
  /** The plan includes the feature but the user ran out of it, so the trial plan is the way up. */
  quota?: boolean;
  role: Role;
  trial: Trial;
  onClose: () => void;
}) {
  const path = usePathname();
  if (!feature) return null;

  const plan = quota ? PLANS[TRIAL_ROLE] : requiredPlan(feature);
  // Only Investidor is self-serve. Anything else has nothing to offer but the checkout, so the
  // upsell step is skipped and the wall opens directly.
  if (role !== "anon" && !canTrial(plan, trial)) {
    return <PaywallDialog plan={plan} trial={trial} onClose={onClose} />;
  }

  const copy = quota
    ? quotaUpsell(feature, role)
    : { title: upsellTitle(feature, role, trial), body: upsellBody(feature, role, trial) };

  return (
    <Modal label={copy.title} onClose={onClose}>
      <div className="mico">
        <IconLock width={22} height={22} strokeWidth={1.8} />
      </div>
      <h3>{copy.title}</h3>
      <p>{copy.body}</p>
      <div className="mrow">
        {role === "anon" ? (
          <Link
            className="btn ghost"
            href={`/login?redirect=${encodeURIComponent(path)}`}
            onClick={onClose}
          >
            Entrar
          </Link>
        ) : (
          <button className="btn ghost" type="button" onClick={onClose}>
            Agora não
          </button>
        )}
        <PlanCta target={plan.role} role={role} trial={trial} onDone={onClose} />
      </div>
      {role !== "anon" && (
        <Link className="modal-alt" href="/#planos" onClick={onClose}>
          Comparar planos
        </Link>
      )}
    </Modal>
  );
}
