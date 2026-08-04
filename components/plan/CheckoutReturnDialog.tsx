"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { checkoutStatus, type CheckoutState } from "@/app/actions/billing";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { CHECKOUT_PARAM, readCheckoutFlag, withoutCheckoutParam } from "@/lib/billing/checkoutFlag";
import { FEATURE_COPY, unlockedFeatures } from "@/lib/entitlements/copy";
import { PLANS } from "@/lib/entitlements";
import type { Role } from "@/lib/entitlements";
import { IconStar } from "@/lib/icons";

// Roughly 30 seconds, front-loaded: the webhook usually lands within a second or two.
const BACKOFF_MS = [800, 1500, 2500, 4000, 5000, 5000, 5000, 5000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

/**
 * Owns the `?checkout=` round trip back from AbacatePay's hosted page. The return URL is not
 * authoritative - the webhook is - so a successful return only starts polling for the row the
 * webhook writes, and running out of polls never claims the payment failed.
 */
export default function CheckoutReturnDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const flag = readCheckoutFlag(params.get(CHECKOUT_PARAM));

  const [status, setStatus] = useState<CheckoutState["state"] | "slow">("pending");
  const [role, setRole] = useState<Role | null>(null);
  const [attempt, setAttempt] = useState(0);

  const clear = useCallback(
    () => router.replace(withoutCheckoutParam(pathname, params.toString()), { scroll: false }),
    [router, pathname, params],
  );

  useEffect(() => {
    if (flag !== "success") return;
    let live = true;

    (async () => {
      for (const wait of BACKOFF_MS) {
        await sleep(wait);
        if (!live) return;
        const result = await checkoutStatus();
        if (!live) return;
        setRole(result.role);
        if (result.state !== "pending") {
          setStatus(result.state);
          // Re-read the server layout so PlanProvider picks up the plan the webhook just granted.
          if (result.state === "active") router.refresh();
          return;
        }
      }
      if (live) setStatus("slow");
    })();

    return () => {
      live = false;
    };
  }, [flag, attempt, router]);

  if (!flag) return null;

  if (flag === "cancel") {
    return (
      <Modal className="trialstart" label="Assinatura não concluída" onClose={clear}>
        <h3>Você saiu antes de concluir</h3>
        <p>Nenhuma cobrança foi feita. O plano continua disponível quando quiser assinar.</p>
        <div className="mrow">
          <button className="btn ghost" type="button" onClick={clear}>
            Fechar
          </button>
        </div>
      </Modal>
    );
  }

  if (status === "pending") {
    return (
      <Modal className="trialstart" label="Confirmando pagamento" onClose={clear}>
        <Spinner label="" />
        <h3>Estamos confirmando seu pagamento</h3>
        <p>Leva alguns segundos. Não feche esta janela.</p>
      </Modal>
    );
  }

  if (status === "slow") {
    return (
      <Modal className="trialstart" label="Pagamento em processamento" onClose={clear}>
        <h3>Recebemos seu pedido</h3>
        <p>
          A confirmação pode levar alguns minutos. Assim que o pagamento for aprovado, seu plano é
          liberado automaticamente - e avisamos por e-mail.
        </p>
        <div className="mrow">
          <button className="btn ghost" type="button" onClick={clear}>
            Fechar
          </button>
          <button
            className="btn solid"
            type="button"
            onClick={() => {
              setStatus("pending");
              setAttempt((n) => n + 1);
              router.refresh();
            }}
          >
            Atualizar
          </button>
        </div>
      </Modal>
    );
  }

  if (status === "failed") {
    return (
      <Modal className="trialstart" label="Pagamento não confirmado" onClose={clear}>
        <h3>Não conseguimos confirmar o pagamento</h3>
        <p>Nada foi cobrado. Você pode tentar de novo pela aba Plano.</p>
        <div className="mrow">
          <button className="btn ghost" type="button" onClick={clear}>
            Fechar
          </button>
        </div>
      </Modal>
    );
  }

  // A hand-typed ?checkout=success must not congratulate an account that bought nothing.
  if (status === "none" || !role) return null;

  const plan = PLANS[role];

  return (
    <Modal className="trialstart" label={`Plano ${plan.label} ativado`} onClose={clear}>
      <div className="mico">
        <IconStar width={22} height={22} strokeWidth={1.8} />
      </div>
      <h3>Bem-vindo ao plano {plan.label}</h3>
      <p>
        Pagamento confirmado. Sua assinatura renova todo mês e pode ser cancelada quando quiser em
        Configurações.
      </p>

      <ul className="pw-pitch trialstart-list">
        {unlockedFeatures(role).map((f) => (
          <li key={f}>
            <Tick />
            <span>
              <b>{FEATURE_COPY[f].label}</b> - {FEATURE_COPY[f].blurb}
            </span>
          </li>
        ))}
      </ul>

      <div className="mrow">
        <Link className="btn solid" href="/properties" onClick={clear}>
          Explorar os imóveis
        </Link>
      </div>
    </Modal>
  );
}
