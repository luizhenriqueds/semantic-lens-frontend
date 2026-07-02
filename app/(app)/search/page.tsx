import PagedCards from "./_components/PagedCards";
import EmptyState from "@/components/ui/EmptyState";
import SearchHero from "@/components/search/SearchHero";
import { getProperties } from "@/lib/data";
import { PROFILE_LABEL } from "@/lib/format";
import { IconSearch } from "@/lib/icons";
import { searchProperties } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [all, sp] = await Promise.all([getProperties(), searchParams]);
  const query = (sp.q ?? "").trim();
  const { profile, items } = query
    ? searchProperties(all, query)
    : { profile: null, items: all.slice().sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)) };

  return (
    <section className="view">
      <div className="pagehead">
        <h1>Buscar imóveis</h1>
        <p>
          Escreva o que procura. Nós comparamos os imóveis e ordenamos pelos que mais combinam com o
          seu objetivo.
        </p>
      </div>

      <SearchHero label="" sub="" initial={query} showExamples={false} />

      <div className="sectitle">
        <h2>
          {items.length} {items.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          {profile && (
            <span style={{ color: "var(--ink-soft)", fontWeight: 500, fontSize: "15px" }}>
              {" "}
              · objetivo {PROFILE_LABEL[profile]}
            </span>
          )}
        </h2>
      </div>

      {items.length ? (
        <PagedCards items={items} resetKey={query} />
      ) : (
        <EmptyState icon={<IconSearch />} title={`Nenhum imóvel encontrado para “${query}”`}>
          Tente descrever de outro jeito ou remover parte da busca.
        </EmptyState>
      )}
    </section>
  );
}
