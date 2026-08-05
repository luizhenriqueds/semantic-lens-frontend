"use client";

import { useState } from "react";
import Link from "next/link";
import PaywallDialog from "@/components/plan/PaywallDialog";
import TrialDialog from "@/components/plan/TrialDialog";
import { PLANS, TRIAL_DAYS, TRIAL_ROLE } from "@/lib/entitlements";
import type { Role, Trial } from "@/lib/entitlements";

/** Every path to a paid plan goes through here: start the trial, or open the checkout wall. */
export default function PlanCta({
  target,
  role,
  trial,
  className = "btn solid",
  celebrateAt,
  onDone,
}: {
  target: Role;
  role: Role;
  trial: Trial;
  className?: string;
  /** Where to land so the layout's celebration dialog can open. Defaults to the current URL;
   *  pass a route under (app) when this button renders outside the app shell. */
  celebrateAt?: string;
  onDone?: () => void;
}) {
  const [checkout, setCheckout] = useState(false);
  const [trialing, setTrialing] = useState(false);

  const plan = PLANS[target];

  if (role === "anon") {
    return (
      <Link className={className} href={`/register?plan=${target}`} onClick={onDone}>
        {target === "basic" ? "Criar conta grátis" : "Criar conta"}
      </Link>
    );
  }

  // A trialling user already holds the target role, so the rank check alone would hide the only
  // button that can turn them into a paying customer.
  const trialingTarget = !!trial.endsAt && role === target;

  if (!trialingTarget && PLANS[role].rank >= plan.rank) {
    return (
      <button className={className} type="button" disabled>
        {role === target ? "Seu plano atual" : "Incluído no seu plano"}
      </button>
    );
  }

  if (target === TRIAL_ROLE && trial.eligible) {
    return (
      <>
        <button className={className} type="button" onClick={() => setTrialing(true)}>
          Testar {TRIAL_DAYS} dias grátis
        </button>
        {trialing && (
          <TrialDialog
            plan={plan}
            celebrateAt={celebrateAt}
            onClose={() => {
              setTrialing(false);
              // Also closes the upsell: its refresh re-reads the plan and would otherwise turn
              // into a paywall for a feature the trial just unlocked.
              onDone?.();
            }}
          />
        )}
      </>
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
