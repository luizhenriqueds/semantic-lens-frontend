import RegionsClient from "./_components/RegionsClient";
import { getRegions } from "@/lib/data";

export default async function RegionsPage() {
  const index = await getRegions();
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Regiões</h1>
        <p>
          Estatísticas e insights de cada região, calculados a partir de dados de mapa
          (OpenStreetMap): o que existe por perto, a quantidade de serviços e o perfil do bairro.
        </p>
      </div>
      <RegionsClient index={index} />
    </section>
  );
}
