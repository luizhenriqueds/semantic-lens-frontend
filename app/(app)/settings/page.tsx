import { Suspense } from "react";
import SettingsClient from "./_components/SettingsClient";
import { getCuratedStates } from "@/lib/data/alerts";
import { getUserSubscription } from "@/lib/data/billing";
import { getUserSettings } from "@/lib/data/settings";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const [settings, curated, subscription] = await Promise.all([
    getUserSettings(supabase, user),
    getCuratedStates(supabase),
    getUserSubscription(supabase),
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
        <SettingsClient settings={settings} curated={curated} subscription={subscription} />
      </Suspense>
    </section>
  );
}
