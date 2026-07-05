import Link from "next/link";
import PagedCards from "./PagedCards";
import DeedResults from "./DeedResults";
import SearchAlertButton from "./SearchAlertButton";
import EmptyState from "@/components/ui/EmptyState";
import { deedSearch, getProperties, hybridSearch, type DeedResult } from "@/lib/data";
import { IconSearch } from "@/lib/icons";
import type { Property } from "@/lib/types";

export default async function SearchResults({
  query,
  scope,
}: {
  query: string;
  scope: "imoveis" | "matriculas";
}) {
  const all = await getProperties();

  let items: Property[] = [];
  let deeds: (DeedResult & { property?: Property })[] = [];
  let failed = false;

  if (query && scope === "matriculas") {
    try {
      const results = await deedSearch(query);
      const byId = new Map(all.map((p) => [p.id, p]));
      deeds = results.map((r) => ({ ...r, property: byId.get(r.id) }));
    } catch {
      failed = true;
    }
  } else if (query) {
    try {
      const hits = await hybridSearch(query);
      const byId = new Map(all.map((p) => [p.id, p]));
      items = hits
        .map((h) => byId.get(h.id))
        .filter((p): p is Property => p != null && !p.inactive);
    } catch {
      failed = true;
    }
  } else {
    items = all.filter((p) => !p.inactive).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
  }

  const count = scope === "matriculas" ? deeds.length : items.length;

  return (
    <>
      {query && !failed && (
        <div className="sectitle">
          <h2>
            {count}{" "}
            {scope === "matriculas"
              ? count === 1
                ? "matrícula encontrada"
                : "matrículas encontradas"
              : count === 1
                ? "imóvel encontrado"
                : "imóveis encontrados"}
            <span style={{ color: "var(--ink-soft)", fontWeight: 500, fontSize: "15px" }}>
              {scope === "matriculas"
                ? " · análise jurídica do documento"
                : " · ordenado por relevância"}
            </span>
          </h2>
          {scope !== "matriculas" && <SearchAlertButton query={query} />}
        </div>
      )}

      {failed ? (
        <EmptyState icon={<IconSearch />} title="Busca indisponível no momento">
          Não foi possível processar a busca agora. Tente novamente em instantes.
        </EmptyState>
      ) : scope === "matriculas" ? (
        deeds.length ? (
          <DeedResults results={deeds} />
        ) : (
          <EmptyState
            icon={<IconSearch />}
            title={`Nenhuma matrícula para “${query}”`}
            action={
              <Link className="btn ghost" href="/search">
                Limpar busca
              </Link>
            }
          >
            Não encontramos documentos em que a condição descrita realmente se aplique ao imóvel —
            preferimos não mostrar correspondências apenas pelo termo.
          </EmptyState>
        )
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
