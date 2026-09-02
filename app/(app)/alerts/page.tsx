import AlertsClient from "./_components/AlertsClient";
import { getClusters, getFilterOptions } from "@/lib/data";
import { EMPTY_FILTER_OPTIONS } from "@/lib/types";
import { listAlerts } from "@/lib/data/alerts";
import { getUser } from "@/lib/supabase/server";

export default async function AlertsPage() {
  // Read here, not in the client store: this render has the cookies, so the list paints with the
  // page instead of after a round trip that may resolve before the session does.
  const { supabase, user } = await getUser();
  const [options, clusters, alerts] = await Promise.all([
    getFilterOptions().catch(() => EMPTY_FILTER_OPTIONS),
    getClusters().catch(() => []),
    user ? listAlerts(supabase) : [],
  ]);
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Meus alertas</h1>
        <p>
          Monte um filtro (objetivo, nota, cidade, desconto…) e receba um aviso quando aparecer um
          imóvel que combina. Ative ou desative quando quiser.
        </p>
      </div>
      <AlertsClient options={options} clusters={clusters} initialAlerts={alerts} />
    </section>
  );
}
