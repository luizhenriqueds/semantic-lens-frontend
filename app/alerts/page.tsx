import AlertsClient from "./_components/AlertsClient";
import { getProperties } from "@/lib/data";

export default async function AlertsPage() {
  const properties = await getProperties();
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Meus alertas</h1>
        <p>
          Monte um filtro (objetivo, nota, cidade, desconto…) e receba um aviso quando aparecer um
          imóvel que combina. Ative ou desative quando quiser.
        </p>
      </div>
      <AlertsClient properties={properties} />
    </section>
  );
}
