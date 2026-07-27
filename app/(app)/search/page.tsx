import { Suspense } from "react";
import SearchHero from "@/components/search/SearchHero";
import SearchResults from "./_components/SearchResults";
import SearchAlertButton from "./_components/SearchAlertButton";
import SearchSkeleton from "./_components/SearchSkeleton";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();

  return (
    <section className="view">
      <div className="pagehead searchhead">
        <div>
          <h1>Explorar imóveis</h1>
          <p>
            Escreva o que procura com suas palavras. A busca semântica entende o objetivo e ordena
            os resultados pelos que mais combinam.
          </p>
        </div>
        <SearchAlertButton query={query} />
      </div>

      <SearchHero label="" sub="" initial={query} showExamples={false} />

      <Suspense key={query} fallback={<SearchSkeleton />}>
        <SearchResults query={query} />
      </Suspense>
    </section>
  );
}
