"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelSubscription } from "@/app/actions/billing";
import PlanCta from "@/components/plan/PlanCta";
import { usePlan } from "@/components/plan/PlanProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { FEATURE_COPY, PAYMENT_NOTE, PLAN_INCLUDES } from "@/lib/entitlements/copy";
import { PLANS, SELLABLE_PLANS, TRIAL_DAYS, TRIAL_ROLE } from "@/lib/entitlements";
import { fmtDay, money } from "@/lib/format";
import type { Subscription } from "@/lib/data/billing";
import type { Feature } from "@/lib/entitlements";

const ORDER = Object.keys(FEATURE_COPY) as Feature[];

const cap = (n: number | null) => (n == null ? "ilimitado" : String(n));

const CANCEL_ERROR: Record<string, string> = {
  pending: "Ainda estamos confirmando sua assinatura. Tente de novo em alguns minutos.",
  none: "Não encontramos uma assinatura ativa.",
};

export default function PlansPanel({ subscription }: { subscription: Subscription | null }) {
  const { role, trial, plan } = usePlan();
  const router = useRouter();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [cancelling, startCancel] = useTransition();

  const billed =
    subscription && (subscription.status === "active" || subscription.status === "cancelled")
      ? subscription
      : null;

  const cancel = () => {
    // Outside the transition on purpose: a state update inside one is non-urgent, so the dialog
    // would sit open behind the toast until the whole request commits.
    setConfirming(false);
    startCancel(async () => {
      const result = await cancelSubscription();
      if (!result.ok) {
        return toast(CANCEL_ERROR[result.reason] ?? "Não foi possível cancelar a assinatura");
      }
      const until = fmtDay(result.endsAt);
      toast(until ? `Assinatura cancelada. Acesso até ${until}.` : "Assinatura cancelada");
      router.refresh();
    });
  };

  return (
    <>
      <div className="infoblock setblock">
        <div className="setblock-head">
          <h2>Seu plano</h2>
          <p>
            Você está no <b>{plan.label}</b>.
            {trial.endsAt
              ? ` Teste grátis até ${fmtDay(trial.endsAt)}.`
              : trial.eligible
                ? ` Você ainda pode testar o ${PLANS[TRIAL_ROLE].label} por ${TRIAL_DAYS} dias.`
                : trial.expired
                  ? " Seu teste grátis já foi usado."
                  : ""}
          </p>
        </div>

        {billed && (
          <div className="setbilling">
            <div className="setbilling-info">
              <b>
                {money((billed.amountCents ?? 0) / 100)}
                <small>/mês</small>
              </b>
              <span>
                {billed.cancelAtPeriodEnd
                  ? `Cancelamento agendado - acesso até ${fmtDay(billed.currentPeriodEnd) ?? "o fim do período"}.`
                  : `Próxima cobrança em ${fmtDay(billed.currentPeriodEnd) ?? "breve"}.`}
              </span>
            </div>
            {!billed.cancelAtPeriodEnd && (
              <button
                className="btn ghost"
                type="button"
                disabled={cancelling}
                onClick={() => setConfirming(true)}
              >
                {cancelling ? "Cancelando…" : "Cancelar assinatura"}
              </button>
            )}
          </div>
        )}

        <ConfirmDialog
          open={confirming}
          danger
          title="Cancelar assinatura?"
          message={
            billed?.currentPeriodEnd
              ? `Você mantém o acesso até ${fmtDay(billed.currentPeriodEnd)} e não haverá novas cobranças.`
              : "Você mantém o acesso até o fim do período já pago e não haverá novas cobranças."
          }
          confirmLabel="Cancelar assinatura"
          cancelLabel="Manter plano"
          onConfirm={cancel}
          onCancel={() => setConfirming(false)}
        />

        <div className="planscmp">
          {SELLABLE_PLANS.map((p) => {
            const r = p.role;
            const includes = PLAN_INCLUDES[r];
            return (
              <div className={`planscmp-col${r === role ? " on" : ""}`} key={r}>
                <div className="planscmp-head">
                  <b>{p.label}</b>
                  {r === role && <span className="chip on">atual</span>}
                </div>
                <div className="planscmp-price">
                  {p.price === 0 ? p.label : money(p.price)}
                  {p.price > 0 && <small>/mês</small>}
                </div>
                <ul>
                  <li>
                    <b>{cap(p.limits.favorites)}</b> favoritos
                  </li>
                  <li>
                    <b>{cap(p.limits.savedSearches)}</b> alertas salvos
                  </li>
                  {ORDER.filter(
                    (f) => p.features[f] && f !== "favorites" && f !== "savedSearches",
                  ).map((f) => (
                    <li key={f}>{FEATURE_COPY[f].label}</li>
                  ))}
                </ul>
                {includes && (
                  <>
                    <div className="planscmp-inc">{includes.heading}</div>
                    <ul>
                      {includes.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
                <PlanCta target={r} role={role} trial={trial} className="btn solid" />
              </div>
            );
          })}
        </div>
        <p className="dr-note">{PAYMENT_NOTE}</p>
      </div>
    </>
  );
}
