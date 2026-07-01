import CollectionCard from "@/components/groups/CollectionCard";
import { getClusters } from "@/lib/data";

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
      <div className="plgrid">
        {clusters.map((c) => (
          <CollectionCard key={c.clusterId} c={c} />
        ))}
      </div>
    </section>
  );
}
