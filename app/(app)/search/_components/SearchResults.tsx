import Link from "next/link";
import PagedCards from "./PagedCards";
import EmptyState from "@/components/ui/EmptyState";
import RetryButton from "@/components/ui/RetryButton";
import { getBrowseList, getPropertiesByIds, hybridSearch, isListable } from "@/lib/data";
import { spreadByLocality } from "@/lib/diversify";
import { goalFromQuery } from "@/lib/facets";
import { GOAL_PROFILE } from "@/lib/format";
import { IconSearch } from "@/lib/icons";
import { isRateLimitError } from "@/lib/ratelimit/guards";
import { RATE_LIMIT_SEARCH, RATE_LIMIT_TITLE } from "@/lib/ratelimit/messages";
import { SEARCH_PAGE_SIZE, sortProperties, type SearchSort } from "@/lib/searchSort";
import type { Property } from "@/lib/types";

const BROWSE_LIMIT = 60;

export default async function SearchResults({
  query,
  page,
  sort,
}: {
  query: string;
  page: number;
  sort: SearchSort;
}) {
  const goal = query ? goalFromQuery(query) : null;
  const highlightGoal = goal ? GOAL_PROFILE[goal] : null;

  let items: Property[] = [];
  let failed = false;
  let limited = false;
  let fallbackNote: string | null = null;

  // Browse is inside the try too: an escaped read replaces the view, search box included.
  try {
    if (query) {
      const result = await hybridSearch(query);
      // Proximity and pure-goal branches already read the rows to rank them.
      const found = result.items ?? (await getPropertiesByIds(result.hits.map((h) => h.id)));
      const byId = new Map(found.filter((p) => isListable(p)).map((p) => [p.id, p]));
      items = result.hits.map((h) => byId.get(h.id)).filter((p): p is Property => p != null);
      items = spreadByLocality(items);
      if (result.fallback && items.length) fallbackNote = result.fallbackNote;
    } else {
      items = await getBrowseList(BROWSE_LIMIT);
    }
  } catch (err) {
    limited = isRateLimitError(err);
    failed = true;
  }

  const ordered = sortProperties(items, sort);
  const pageItems = ordered.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE);

  const heading =
    query && !failed
      ? fallbackNote
        ? `${items.length} ${items.length === 1 ? "resultado aproximado" : "resultados aproximados"}`
        : `${items.length} ${items.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}`
      : undefined;

  return (
    <>
      {fallbackNote && (
        <div className="searchnote">
          <IconSearch width={17} height={17} strokeWidth={1.8} />
          <span>{fallbackNote}</span>
        </div>
      )}

      {failed ? (
        <EmptyState
          icon={<IconSearch />}
          title={
            limited
              ? RATE_LIMIT_TITLE
              : query
                ? "Busca indisponível no momento"
                : "Imóveis indisponíveis no momento"
          }
          action={limited ? undefined : <RetryButton />}
        >
          {limited
            ? RATE_LIMIT_SEARCH
            : "Não foi possível processar a busca agora. Tente novamente em instantes."}
        </EmptyState>
      ) : items.length ? (
        <PagedCards
          items={pageItems}
          total={items.length}
          page={page}
          sort={sort}
          query={query}
          highlightGoal={highlightGoal}
          heading={heading}
        />
      ) : query ? (
        <EmptyState
          icon={<IconSearch />}
          title={`Nada relevante para “${query}”`}
          action={
            <Link className="btn ghost" href="/search">
              Limpar busca
            </Link>
          }
        >
          Tente descrever de outro jeito - o tipo, a cidade e o objetivo ajudam (por exemplo, “casa
          para família em Campo Grande”).
        </EmptyState>
      ) : (
        <EmptyState icon={<IconSearch />} title="Nenhum imóvel disponível no momento">
          Ainda não há imóveis para mostrar aqui. Tente novamente em instantes.
        </EmptyState>
      )}
    </>
  );
}
