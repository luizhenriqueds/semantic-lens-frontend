import Link from "next/link";
import { notFound } from "next/navigation";
import AlertMatches from "./_components/AlertMatches";
import EmptyState from "@/components/ui/EmptyState";
import { criteriaChips, describeCriteria, isAnyCriteria } from "@/lib/alerts";
import { getMatchedPage } from "@/lib/data";
import { getAlert } from "@/lib/data/alerts";
import { criteriaToParams, parsePropertySort } from "@/lib/filters/propertiesUrl";
import { IconBell, IconPencil, IconSearch, IconSliders } from "@/lib/icons";
import { getUser } from "@/lib/supabase/server";

export default async function AlertPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase, user } = await getUser();
  const alert = user ? await getAlert(supabase, id) : null;
  if (!alert) notFound();

  const sort = parsePropertySort(sp.sort);
  const page = Math.max(1, Number(sp.page) || 1);

  const criteria = alert.criteria;
  const listable = criteria && !isAnyCriteria(criteria) ? criteria : null;
  const list = listable ? await getMatchedPage(listable, sort, page) : null;

  const chips = criteria ? criteriaChips(criteria) : [];
  const adjustHref = listable ? `/properties?${criteriaToParams(listable)}` : null;

  let content;
  if (!criteria) {
    content = (
      <EmptyState
        icon={<IconBell />}
        title="Este alerta ainda é por descrição"
        action={
          <Link className="btn solid" href={`/search?q=${encodeURIComponent(alert.name)}`}>
            <IconSearch width={16} height={16} strokeWidth={1.8} /> Ver resultados da busca
          </Link>
        }
      >
        Ele ainda não tem filtros salvos, então não dá para listar as correspondências aqui. Abra
        “Editar alerta” e salve de novo para transformá-lo em filtros.
      </EmptyState>
    );
  } else if (!listable) {
    content = (
      <EmptyState icon={<IconBell />} title="Este alerta combina vários conjuntos de filtros">
        Ainda não conseguimos listar as correspondências de um alerta com alternativas. Edite o
        alerta para deixá-lo com um único conjunto de filtros.
      </EmptyState>
    );
  } else if (list?.total) {
    content = (
      <AlertMatches
        id={alert.id}
        items={list.items}
        total={list.total}
        page={page}
        sort={sort}
        poiCats={listable.poi_cats}
        poiRadius={listable.poi_radius_m}
      />
    );
  } else {
    content = (
      <EmptyState
        icon={<IconBell />}
        title="Nenhum imóvel corresponde hoje"
        action={
          <Link className="btn ghost" href={adjustHref!}>
            Ajustar filtros
          </Link>
        }
      >
        Assim que aparecer um imóvel dentro desses critérios, você recebe um aviso.
      </EmptyState>
    );
  }

  return (
    <section className="view">
      <div className="pagehead">
        <div className="searchhead">
          <div>
            <h1>{alert.name}</h1>
            <p>
              {alert.freq}
              {criteria ? ` · ${describeCriteria(criteria)}` : ""}
              {alert.on ? "" : " · pausado"}
            </p>
          </div>
          <div className="headactions">
            {adjustHref && (
              <Link className="btn ghost" href={adjustHref}>
                <IconSliders width={16} height={16} strokeWidth={1.8} /> Ajustar filtros
              </Link>
            )}
            <Link className="btn ghost" href="/alerts">
              <IconPencil width={16} height={16} strokeWidth={1.8} /> Editar alerta
            </Link>
          </div>
        </div>
        {chips.length > 0 && (
          <div className="achips">
            {chips.map((c) => (
              <span className="achip" key={c}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {content}
    </section>
  );
}
