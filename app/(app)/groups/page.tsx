import CollectionCard from "@/components/groups/CollectionCard";
import EmptyState from "@/components/ui/EmptyState";
import { getClusters } from "@/lib/data";
import { IconGroups } from "@/lib/icons";

export default async function GroupsPage() {
  const clusters = await getClusters();
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Grupos de imóveis parecidos</h1>
        <p>
          Reunimos automaticamente imóveis parecidos entre si. Assim você compara opções do mesmo
          tipo lado a lado.
        </p>
      </div>
      {clusters.length === 0 ? (
        <EmptyState icon={<IconGroups />} title="Nenhum grupo disponível">
          Ainda não há grupos de imóveis parecidos para exibir. Assim que novos imóveis forem
          agrupados, eles aparecerão aqui.
        </EmptyState>
      ) : (
        <div className="plgrid">
          {clusters.map((c) => (
            <CollectionCard key={c.clusterId} c={c} />
          ))}
        </div>
      )}
    </section>
  );
}
