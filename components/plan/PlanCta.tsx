"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startInvestorTrial } from "@/app/actions/plan";
import PaywallDialog from "@/components/plan/PaywallDialog";
import { PLANS, TRIAL_DAYS, TRIAL_ROLE } from "@/lib/entitlements";
import type { Role, Trial } from "@/lib/entitlements";

/** Every path to a paid plan goes through here: start the trial, or fall back to the checkout
 *  placeholder while payment is not integrated. */
export default function PlanCta({
  target,
  role,
  trial,
  className = "btn solid",
  onDone,
}: {
  target: Role;
  role: Role;
  trial: Trial;
  className?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [checkout, setCheckout] = useState(false);
  const [failed, setFailed] = useState(false);

  const plan = PLANS[target];

  if (role === "anon") {
    return (
      <Link className={className} href={`/register?plan=${target}`} onClick={onDone}>
        {target === "basic" ? "Criar conta grátis" : "Criar conta"}
      </Link>
    );
  }

  if (PLANS[role].rank >= plan.rank) {
    return (
      <button className={className} type="button" disabled>
        {role === target ? "Seu plano atual" : "Incluído no seu plano"}
      </button>
    );
  }

  if (target === TRIAL_ROLE && trial.eligible) {
    return (
      <button
        className={className}
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (!(await startInvestorTrial())) return setFailed(true);
            router.refresh();
            onDone?.();
          })
        }
      >
        {pending ? "Ativando…" : failed ? "Tente novamente" : `Testar ${TRIAL_DAYS} dias grátis`}
      </button>
    );
  }

  return (
    <>
      <button className={className} type="button" onClick={() => setCheckout(true)}>
        Assinar {plan.label}
      </button>
      {checkout && (
        <PaywallDialog
          plan={plan}
          trial={trial}
          onClose={() => {
            setCheckout(false);
            onDone?.();
          }}
        />
      )}
    </>
  );
}
