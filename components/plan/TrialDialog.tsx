"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startInvestorTrial } from "@/app/actions/plan";
import Modal from "@/components/ui/Modal";
import PlanPitchList from "@/components/plan/PlanPitchList";
import { withTrialParam } from "@/lib/entitlements/trialFlag";
import { PLANS, TRIAL_DAYS } from "@/lib/entitlements";
import type { Plan } from "@/lib/entitlements";

/** Trial's answer to PaywallDialog: same shell and pitch list, but no payment to confirm. */
export default function TrialDialog({
  plan,
  celebrateAt,
  onClose,
}: {
  plan: Plan;
  /** Where to land so the layout's celebration dialog can open. Defaults to the current URL;
   *  pass a route under (app) when this button renders outside the app shell. */
  celebrateAt?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const confirm = () =>
    start(async () => {
      setError(null);
      if (!(await startInvestorTrial())) {
        setError("Não foi possível ativar seu teste agora. Tente novamente.");
        return;
      }
      const { pathname, search } = window.location;
      router.push(withTrialParam(celebrateAt ?? pathname, celebrateAt ? "" : search), {
        scroll: false,
      });
      router.refresh();
      onClose();
    });

  return (
    <Modal className="paywall" label={`Testar ${plan.label}`} onClose={onClose}>
      <div className="pw-head">
        <span className="pw-kicker">Teste grátis</span>
        <h3>Plano {plan.label}</h3>
        <div className="pw-price">
          <b>{TRIAL_DAYS} dias</b>
          <span>grátis</span>
        </div>
      </div>

      <PlanPitchList role={plan.role} />

      {error ? (
        <p className="pw-note pw-err">{error}</p>
      ) : (
        <p className="pw-note">
          Não pedimos cartão. Ao fim do teste, sua conta volta automaticamente para o plano{" "}
          {PLANS.basic.label}.
        </p>
      )}

      <div className="mrow">
        <button className="btn ghost" type="button" onClick={onClose}>
          Agora não
        </button>
        <button className="btn solid" type="button" disabled={pending} onClick={confirm}>
          {pending ? "Ativando…" : "Começar teste grátis"}
        </button>
      </div>
    </Modal>
  );
}
