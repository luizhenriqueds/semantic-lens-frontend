import SettingsClient from "./_components/SettingsClient";
import { getCuratedStates } from "@/lib/data/alerts";
import { getUserSettings } from "@/lib/data/settings";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Configurações — Lavra" };

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const [settings, curated] = await Promise.all([
    getUserSettings(supabase, user),
    getCuratedStates(supabase),
  ]);

  return (
    <section className="view">
      <div className="pagehead">
        <h1>Configurações</h1>
        <p>
          Seus dados de conta, por onde você quer receber os avisos e quais alertas automáticos a
          Lavra envia para você.
        </p>
      </div>
      <SettingsClient settings={settings} curated={curated} />
    </section>
  );
}
