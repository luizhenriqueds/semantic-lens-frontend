import { Suspense } from "react";
import SearchHead from "./_components/SearchHead";
import SearchResults from "./_components/SearchResults";
import SearchAlertButton from "./_components/SearchAlertButton";
import SearchSkeleton from "./_components/SearchSkeleton";
import { clampQuery } from "@/lib/facets/limits";
import { parseSort } from "@/lib/searchSort";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  // Clamped here too, so the box and the heading show what was actually searched.
  const query = clampQuery(sp.q ?? "");
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = parseSort(sp.sort);

  return (
    <section className="view">
      <SearchHead query={query} aside={<SearchAlertButton query={query} />} />

      <Suspense key={`${query}|${page}|${sort}`} fallback={<SearchSkeleton />}>
        <SearchResults query={query} page={page} sort={sort} />
      </Suspense>
    </section>
  );
}
