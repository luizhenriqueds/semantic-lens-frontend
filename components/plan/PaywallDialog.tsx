"use client";

import { useState, useTransition } from "react";
import { startCheckout, type CheckoutFailure } from "@/app/actions/billing";
import Modal from "@/components/ui/Modal";
import PlanPitchList from "@/components/plan/PlanPitchList";
import { money } from "@/lib/format";
import { TRIAL_DAYS, TRIAL_ROLE } from "@/lib/entitlements";
import type { Plan, Trial } from "@/lib/entitlements";

const ERROR_COPY: Record<CheckoutFailure, string> = {
  auth: "Entre na sua conta para assinar.",
  plan: "Este plano não está disponível para a sua conta.",
  active: "Você já tem uma assinatura ativa.",
  config: "O pagamento está indisponível no momento. Tente mais tarde.",
  rate: "Muitas tentativas seguidas. Tente de novo em alguns minutos.",
  error: "Não conseguimos abrir o pagamento. Tente de novo.",
};

/** Opens the AbacatePay checkout. Their hosted page is the only flow that does recurring billing,
 *  so the browser leaves here and comes back on ?checkout= (see CheckoutReturnDialog). */
export default function PaywallDialog({
  plan,
  trial,
  onClose,
}: {
  plan: Plan;
  trial: Trial;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const checkout = () =>
    start(async () => {
      setError(null);
      const result = await startCheckout(plan.role);
      if (!result.ok) return setError(ERROR_COPY[result.reason]);
      // Cross-origin, so never router.push.
      window.location.assign(result.url);
    });

  return (
    <Modal className="paywall" label={`Assinar ${plan.label}`} onClose={onClose}>
      <div className="pw-head">
        <span className="pw-kicker">Assinatura</span>
        <h3>Plano {plan.label}</h3>
        <div className="pw-price">
          <b>{money(plan.price)}</b>
          <span>/mês</span>
        </div>
      </div>

      <PlanPitchList role={plan.role} />

      {error ? (
        <p className="pw-note pw-err">{error}</p>
      ) : (
        <p className="pw-note">
          Pagamento no cartão, processado pela AbacatePay. Cancele quando quiser.
          {plan.role === TRIAL_ROLE && trial.eligible
            ? ` Ou teste ${TRIAL_DAYS} dias grátis, sem cartão.`
            : ""}
        </p>
      )}

      <div className="mrow">
        <button className="btn ghost" type="button" onClick={onClose}>
          Agora não
        </button>
        {/* No price on the label: it is already the largest thing in the dialog, and repeating it
            here is what pushed the row past the modal width. */}
        <button className="btn solid" type="button" disabled={pending} onClick={checkout}>
          {pending ? "Redirecionando…" : "Assinar agora"}
        </button>
      </div>
    </Modal>
  );
}
