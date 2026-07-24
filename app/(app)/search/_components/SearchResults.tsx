import Link from "next/link";
import PagedCards from "./PagedCards";
import EmptyState from "@/components/ui/EmptyState";
import { getPropertiesByIds, getPropertiesPage, hybridSearch, isListable } from "@/lib/data";
import { goalFromQuery } from "@/lib/facets";
import { GOAL_PROFILE } from "@/lib/format";
import { IconSearch } from "@/lib/icons";
import type { Property } from "@/lib/types";

const BROWSE_LIMIT = 60;

export default async function SearchResults({ query }: { query: string }) {
  const goal = query ? goalFromQuery(query) : null;
  const highlightGoal = goal ? GOAL_PROFILE[goal] : null;

  let items: Property[] = [];
  let failed = false;
  let fallbackNote: string | null = null;

  if (query) {
    try {
      const result = await hybridSearch(query);
      const found = await getPropertiesByIds(result.hits.map((h) => h.id));
      const byId = new Map(found.filter((p) => isListable(p)).map((p) => [p.id, p]));
      items = result.hits.map((h) => byId.get(h.id)).filter((p): p is Property => p != null);
      if (result.fallback && items.length) fallbackNote = result.fallbackNote;
    } catch {
      failed = true;
    }
  } else {
    const page = await getPropertiesPage({ sort: "desconto", pageSize: BROWSE_LIMIT });
    items = page.items;
  }

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
        <EmptyState icon={<IconSearch />} title="Busca indisponível no momento">
          Não foi possível processar a busca agora. Tente novamente em instantes.
        </EmptyState>
      ) : items.length ? (
        <PagedCards
          items={items}
          resetKey={query}
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
          Tente descrever de outro jeito — o tipo, a cidade e o objetivo ajudam (por exemplo, “casa
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
