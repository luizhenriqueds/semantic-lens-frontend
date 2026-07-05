import PropertiesClient from "./_components/PropertiesClient";
import { getClusters, getProperties, getRegion } from "@/lib/data";

const VALID_VIEWS = ["list", "analysis", "calendar", "map"] as const;
type View = (typeof VALID_VIEWS)[number];

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ cluster?: string; city?: string; h3?: string; view?: string }>;
}) {
  const [properties, clusters, sp] = await Promise.all([
    getProperties(),
    getClusters(),
    searchParams,
  ]);
  const cluster = sp.cluster ? Number(sp.cluster) : undefined;
  const region = sp.h3 ? await getRegion(sp.h3) : null;
  const initialView = VALID_VIEWS.includes(sp.view as View) ? (sp.view as View) : undefined;

  return (
    <section className="view">
      <PropertiesClient
        properties={properties}
        clusters={clusters}
        initialCluster={cluster != null && Number.isNaN(cluster) ? undefined : cluster}
        initialCity={sp.city}
        initialView={initialView}
        h3={sp.h3}
        h3Label={region ? `${region.name} · ${region.city}` : undefined}
      />
    </section>
  );
}
