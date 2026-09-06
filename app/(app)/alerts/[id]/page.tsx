import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AlertMatches from "./_components/AlertMatches";
import MatchesSkeleton from "./_components/MatchesSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import { criteriaChips, criteriaLabels, describeCriteria, isAnyCriteria } from "@/lib/alerts";
import { getClusters, getMatchedPage } from "@/lib/data";
import { getAlert } from "@/lib/data/alerts";
import { criteriaToParams, parsePropertySort, sortParam } from "@/lib/filters/propertiesUrl";
import { IconBell, IconPencil, IconSearch, IconSliders } from "@/lib/icons";
import { getUser } from "@/lib/supabase/server";
import type { AlertCriteriaSet, PropertySort } from "@/lib/types";

// Streamed on its own: the matched-page RPC is the slow half of this route, and awaiting it
// in the shell held the navigation on the alerts list with nothing to show for the click.
async function MatchesSlot({
  id,
  criteria,
  sort,
  page,
  adjustHref,
}: {
  id: string;
  criteria: AlertCriteriaSet;
  sort: PropertySort;
  page: number;
  adjustHref: string;
}) {
  const list = await getMatchedPage(criteria, sort, page);
  if (!list?.total) {
    return (
      <EmptyState
        icon={<IconBell />}
        title="Nenhum imóvel corresponde hoje"
        action={
          <Link className="btn ghost" href={adjustHref}>
            Ajustar filtros
          </Link>
        }
      >
        Assim que aparecer um imóvel dentro desses critérios, você recebe um aviso.
      </EmptyState>
    );
  }
  return (
    <AlertMatches
      id={id}
      items={list.items}
      total={list.total}
      page={page}
      sort={sort}
      poiCats={criteria.poi_cats}
      poiRadius={criteria.poi_radius_m}
    />
  );
}

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
  const clusters = criteria ? await getClusters().catch(() => []) : [];

  const labels = criteriaLabels(clusters);
  const chips = criteria ? criteriaChips(criteria, labels) : [];
  // Carries the alert id so the list can offer to save the changed filters back onto it.
  const adjustHref = listable
    ? `/properties?${criteriaToParams(listable)}&alert=${alert.id}`
    : null;

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
  } else {
    // Keyed so paging and re-sorting fall back to the skeleton too, instead of sitting on
    // stale rows with no sign the list is being refetched.
    content = (
      <Suspense fallback={<MatchesSkeleton />} key={`${sortParam(sort)}-${page}`}>
        <MatchesSlot
          id={alert.id}
          criteria={listable}
          sort={sort}
          page={page}
          adjustHref={adjustHref!}
        />
      </Suspense>
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
              {criteria ? ` · ${describeCriteria(criteria, labels)}` : ""}
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
