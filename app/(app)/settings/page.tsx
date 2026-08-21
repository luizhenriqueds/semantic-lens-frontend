import { Suspense } from "react";
import InvoicesPanel from "./_components/InvoicesPanel";
import SettingsClient from "./_components/SettingsClient";
import Spinner from "@/components/ui/Spinner";
import { getCuratedStates } from "@/lib/data/alerts";
import { getStripeCustomerId, getUserSubscription } from "@/lib/data/billing";
import { getUserSettings } from "@/lib/data/settings";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  // A customer id exists only once a payment webhook has landed - which is exactly when there is a
  // billing history worth a tab.
  const [settings, curated, subscription, customerId] = await Promise.all([
    getUserSettings(supabase, user),
    getCuratedStates(supabase),
    getUserSubscription(supabase),
    getStripeCustomerId(supabase),
  ]);

  return (
    <section className="view">
      <div className="pagehead">
        <h1>Configurações</h1>
        <p>
          Seus dados de conta, por onde você quer receber os avisos e quais alertas automáticos a
          enviamos para você.
        </p>
      </div>
      {/* SettingsClient reads ?tab, which the checkout return URL sets. */}
      <Suspense fallback={null}>
        <SettingsClient
          settings={settings}
          curated={curated}
          subscription={subscription}
          // Streamed, not awaited: the Stripe round trip must not hold up the other tabs.
          invoices={
            customerId ? (
              <Suspense fallback={<Spinner label="Carregando faturas…" />}>
                <InvoicesPanel customerId={customerId} />
              </Suspense>
            ) : null
          }
        />
      </Suspense>
    </section>
  );
}
