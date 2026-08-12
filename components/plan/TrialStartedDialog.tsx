"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { usePlan } from "@/components/plan/PlanProvider";
import { startInvestorTrial } from "@/app/actions/plan";
import { FEATURE_COPY, unlockedFeatures } from "@/lib/entitlements/copy";
import { TRIAL_PARAM, withoutTrialParam } from "@/lib/entitlements/trialFlag";
import { PLANS, TRIAL_DAYS, TRIAL_ROLE } from "@/lib/entitlements";
import { IconCheck, IconStar } from "@/lib/icons";

const UNLOCKED = unlockedFeatures(TRIAL_ROLE);

/** Spelled out rather than fmtDate's "08 de ago.", whose period would end the sentence early. */
function deadline(iso: string): string | null {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

/**
 * Owns the whole `?trial=1` flow from the app layout: PlanCta sets the flag after starting the
 * trial itself, while a signup that began at a gated feature arrives with the flag and no trial
 * yet (registerAccount redirects there). Both end on the same celebration.
 */
export default function TrialStartedDialog() {
  const { role, trial } = usePlan();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const flagged = params.get(TRIAL_PARAM) === "1";
  const started = useRef(false);

  const clear = () =>
    router.replace(withoutTrialParam(pathname, params.toString()), { scroll: false });

  useEffect(() => {
    if (!flagged || started.current || role === TRIAL_ROLE) return;
    started.current = true;
    void startInvestorTrial().then((ok) => {
      // Nothing to celebrate if the trial was already used up: drop the flag instead.
      if (!ok) router.replace(withoutTrialParam(pathname, params.toString()), { scroll: false });
      else router.refresh();
    });
  }, [flagged, role, pathname, params, router]);

  // A hand-typed ?trial=1 must not congratulate someone whose trial never started, or has ended.
  if (!flagged || role !== TRIAL_ROLE || !trial.endsAt) return null;

  const until = deadline(trial.endsAt);
  const plan = PLANS[TRIAL_ROLE];

  return (
    <Modal className="trialstart" label={`Teste do plano ${plan.label} ativado`} onClose={clear}>
      <div className="mico">
        <IconStar width={22} height={22} strokeWidth={1.8} />
      </div>
      <h3>Seu teste do plano {plan.label} começou</h3>
      <p>
        São <b>{TRIAL_DAYS} dias</b> com tudo liberado
        {until && (
          <>
            , até <b>{until}</b>
          </>
        )}
        . Não pedimos cartão: quando o teste terminar, sua conta volta sozinha para o plano{" "}
        {PLANS.basic.label}.
      </p>

      <ul className="pw-pitch trialstart-list">
        <li>
          <IconCheck />
          <span>
            <b>Favoritos e alertas ilimitados</b> - sem o teto de {PLANS.basic.limits.favorites}{" "}
            imóveis salvos e {PLANS.basic.limits.savedSearches} buscas.
          </span>
        </li>
        {UNLOCKED.map((f) => (
          <li key={f}>
            <IconCheck />
            <span>
              <b>{FEATURE_COPY[f].label}</b> - {FEATURE_COPY[f].blurb}
            </span>
          </li>
        ))}
      </ul>

      {/* No "agora não": the trial is already running, so there is nothing left to decline. */}
      <div className="mrow">
        {pathname === "/dashboard" ? (
          <button className="btn solid" type="button" onClick={clear}>
            Começar a explorar
          </button>
        ) : (
          <Link className="btn solid" href="/dashboard" onClick={clear}>
            Ir para o painel
          </Link>
        )}
      </div>
    </Modal>
  );
}
