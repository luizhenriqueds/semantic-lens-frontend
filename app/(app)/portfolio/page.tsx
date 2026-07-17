import PortfolioClient from "./_components/PortfolioClient";
import { getAllProperties } from "@/lib/data";

export default async function PortfolioPage() {
  const properties = await getAllProperties();
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Minha carteira</h1>
        <p>
          Os imóveis que você salvou para acompanhar. Veja um resumo e clique para abrir os
          detalhes.
        </p>
      </div>
      <PortfolioClient properties={properties} />
    </section>
  );
}
