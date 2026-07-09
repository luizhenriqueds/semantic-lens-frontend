import Link from "next/link";
import PagedCards from "./PagedCards";
import SearchAlertButton from "./SearchAlertButton";
import EmptyState from "@/components/ui/EmptyState";
import { getProperties, hybridSearch } from "@/lib/data";
import { IconSearch } from "@/lib/icons";
import type { Property } from "@/lib/types";

export default async function SearchResults({ query }: { query: string }) {
  const all = await getProperties();

  let items: Property[] = [];
  let failed = false;
  let fallbackNote: string | null = null;

  if (query) {
    try {
      const result = await hybridSearch(query);
      const byId = new Map(all.map((p) => [p.id, p]));
      items = result.hits
        .map((h) => byId.get(h.id))
        .filter((p): p is Property => p != null && !p.inactive);
      if (result.fallback && items.length) fallbackNote = result.fallbackNote;
    } catch {
      failed = true;
    }
  } else {
    items = all.filter((p) => !p.inactive).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
  }

  return (
    <>
      {query && !failed && (
        <div className="sectitle">
          <h2>
            {fallbackNote
              ? `${items.length} ${items.length === 1 ? "resultado aproximado" : "resultados aproximados"}`
              : `${items.length} ${items.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}`}
          </h2>
          <SearchAlertButton query={query} />
        </div>
      )}

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
        <PagedCards items={items} resetKey={query} />
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
