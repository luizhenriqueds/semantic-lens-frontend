"use client";

import PlanCta from "@/components/plan/PlanCta";
import { usePlan } from "@/components/plan/PlanProvider";
import { FEATURE_COPY, PLAN_INCLUDES } from "@/lib/entitlements/copy";
import { PLANS, SELLABLE_PLANS, TRIAL_DAYS, TRIAL_ROLE } from "@/lib/entitlements";
import { fmtDay, money } from "@/lib/format";
import type { Feature } from "@/lib/entitlements";

const ORDER = Object.keys(FEATURE_COPY) as Feature[];

const cap = (n: number | null) => (n == null ? "ilimitado" : String(n));

export default function PlansPanel() {
  const { role, trial, plan } = usePlan();

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
      </div>
    </>
  );
}
