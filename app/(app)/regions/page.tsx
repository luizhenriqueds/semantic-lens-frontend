import RegionsClient from "./_components/RegionsClient";
import UpgradeWall from "@/components/plan/UpgradeWall";
import { getRegions } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";

export default async function RegionsPage() {
  const ent = await getEntitlements();
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Regiões</h1>
        <p>
          Estatísticas e insights de cada região, calculados a partir de dados de mapa
          (OpenStreetMap): o que existe por perto, a quantidade de serviços e o perfil do bairro.
        </p>
      </div>
      {ent.can("regions") ? (
        <RegionsClient index={await getRegions()} />
      ) : (
        <UpgradeWall feature="regions" role={ent.role} trial={ent.trial}>
          Compare bairros pela nota média, veja o que existe no entorno e encontre regiões
          semelhantes à que você já conhece.
        </UpgradeWall>
      )}
    </section>
  );
}
