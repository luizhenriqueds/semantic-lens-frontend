import PropertiesClient from "./_components/PropertiesClient";
import { getClusters, getProperties, getRegion } from "@/lib/data";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string; city?: string; h3?: string }>;
}) {
  const [properties, clusters, sp] = await Promise.all([
    getProperties(),
    getClusters(),
    searchParams,
  ]);
  const cluster = sp.cluster ? Number(sp.cluster) : undefined;
  const region = sp.h3 ? await getRegion(sp.h3) : null;

  return (
    <section className="view">
      <PropertiesClient
        properties={properties}
        clusters={clusters}
        initialCluster={cluster != null && Number.isNaN(cluster) ? undefined : cluster}
        initialCity={sp.city}
        h3={sp.h3}
        h3Label={region ? `${region.name} · ${region.city}` : undefined}
      />
    </section>
  );
}
