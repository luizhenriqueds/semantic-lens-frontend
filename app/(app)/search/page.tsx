import { Suspense } from "react";
import Link from "next/link";
import SearchHero from "@/components/search/SearchHero";
import SearchResults from "./_components/SearchResults";
import SearchSkeleton from "./_components/SearchSkeleton";
import { isDeedQuery } from "@/lib/facets";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const scope = sp.scope === "matriculas" ? "matriculas" : "imoveis";
  const showTabs = !!query && (scope === "matriculas" || isDeedQuery(query));

  return (
    <section className="view">
      <div className="pagehead">
        <h1>Buscar imóveis</h1>
        <p>
          Escreva o que procura com suas palavras. A busca semântica entende o objetivo e ordena os
          resultados pelos que mais combinam.
        </p>
      </div>

      <SearchHero label="" sub="" initial={query} scope={scope} showExamples={false} />

      {showTabs && (
        <div className="scopetabs">
          <Link
            className={scope === "imoveis" ? "on" : ""}
            href={`/search?q=${encodeURIComponent(query)}`}
          >
            Imóveis
          </Link>
          <Link
            className={scope === "matriculas" ? "on" : ""}
            href={`/search?q=${encodeURIComponent(query)}&scope=matriculas`}
          >
            Matrículas
          </Link>
        </div>
      )}

      <Suspense key={`${scope}:${query}`} fallback={<SearchSkeleton scope={scope} />}>
        <SearchResults query={query} scope={scope} />
      </Suspense>
    </section>
  );
}
