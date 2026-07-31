"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { money } from "@/lib/format";
import { TRIAL_DAYS, TRIAL_ROLE } from "@/lib/entitlements";
import type { Plan, Trial } from "@/lib/entitlements";

/** Stand-in checkout until payment is integrated. The card fields are inert on purpose - this
 *  must look like the real wall without ever appearing to take card data. */
export default function PaywallDialog({
  plan,
  trial,
  onClose,
}: {
  plan: Plan;
  trial: Trial;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);

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

      <ul className="pw-pitch">
        {(plan.pitch ?? []).map((line) => (
          <li key={line}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="m5 13 4 4L19 7" />
            </svg>
            {line}
          </li>
        ))}
      </ul>

      <div className="pw-form" aria-hidden="true">
        <div className="pw-field">
          <span>Cartão</span>
          <input className="selectish" placeholder="•••• •••• •••• ••••" disabled />
        </div>
        <div className="pw-row">
          <div className="pw-field">
            <span>Validade</span>
            <input className="selectish" placeholder="MM/AA" disabled />
          </div>
          <div className="pw-field">
            <span>CVC</span>
            <input className="selectish" placeholder="•••" disabled />
          </div>
        </div>
      </div>

      {submitted ? (
        <p className="pw-note pw-sent">
          Anotamos seu interesse. Avisaremos por e-mail assim que a cobrança estiver no ar.
        </p>
      ) : (
        <p className="pw-note">
          A cobrança ainda não está ativa.
          {trial.expired
            ? " Seu teste grátis já foi usado."
            : plan.role === TRIAL_ROLE && trial.eligible
              ? ` Enquanto isso, você pode testar ${TRIAL_DAYS} dias grátis.`
              : ""}
        </p>
      )}

      <div className="mrow">
        <button className="btn ghost" type="button" onClick={onClose}>
          {submitted ? "Fechar" : "Agora não"}
        </button>
        {!submitted && (
          <button className="btn solid" type="button" onClick={() => setSubmitted(true)}>
            Assinar por {money(plan.price)}/mês
          </button>
        )}
      </div>
    </Modal>
  );
}
