import UpgradeWall from "@/components/plan/UpgradeWall";
import EmptyState from "@/components/ui/EmptyState";
import { getClusters, getClusterStatsAll } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";
import { IconGroups } from "@/lib/icons";
import GroupsClient from "./_components/GroupsClient";

export default async function GroupsPage() {
  const ent = await getEntitlements();
  if (!ent.can("groups")) {
    return (
      <section className="view">
        <div className="pagehead">
          <h1>Coleções de imóveis parecidos</h1>
        </div>
        <UpgradeWall feature="groups" role={ent.role} trial={ent.trial}>
          Reunimos automaticamente imóveis parecidos entre si, para você comparar opções do mesmo
          tipo lado a lado.
        </UpgradeWall>
      </section>
    );
  }

  const [clusters, clusterStats] = await Promise.all([
    getClusters(),
    getClusterStatsAll().catch(() => ({})),
  ]);
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Coleções de imóveis parecidos</h1>
        <p>
          Reunimos automaticamente imóveis parecidos entre si. Assim você compara opções do mesmo
          tipo lado a lado.
        </p>
      </div>
      {clusters.length === 0 ? (
        <EmptyState icon={<IconGroups />} title="Nenhuma coleção disponível">
          Ainda não há coleções de imóveis parecidos para exibir. Assim que novos imóveis forem
          agrupados, eles aparecerão aqui.
        </EmptyState>
      ) : (
        <GroupsClient clusters={clusters} stats={clusterStats} />
      )}
    </section>
  );
}
