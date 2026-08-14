import PropertiesClient from "./_components/PropertiesClient";
import { parsePropertySearchParams } from "@/lib/filters/propertiesUrl";
import { loadPropertiesView } from "@/lib/properties/loadPropertiesView";

// Dynamic: the app layout reads the auth cookie, so this route can't be static.
export const dynamic = "force-dynamic";

export const maxDuration = 20;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const data = await loadPropertiesView(parsePropertySearchParams(sp));

  return (
    <section className="view">
      <PropertiesClient {...data} alertId={typeof sp.alert === "string" ? sp.alert : undefined} />
    </section>
  );
}
