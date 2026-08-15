import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertiesClient from "@/app/(app)/properties/_components/PropertiesClient";
import JsonLd from "@/components/seo/JsonLd";
import SeoBody from "@/components/seo/SeoBody";
import { countProperties, getFilterOptions } from "@/lib/data";
import { toRpcFilters } from "@/lib/filters/contract";
import {
  criteriaToParams,
  LIST_PAGE_SIZE,
  parsePropertySearchParams,
} from "@/lib/filters/propertiesUrl";
import { loadPropertiesView } from "@/lib/properties/loadPropertiesView";
import { countedLabel, type SeoLanding } from "@/lib/seo/landings";
import { breadcrumbLd, faqLd, itemListLd } from "@/lib/seo/jsonLd";
import { findLanding, landingFallback, resolveLandingFilters } from "@/lib/seo/resolve";
import type { PropertyFilters } from "@/lib/types";

// Still dynamic, and not for the old reason: the (public) layout no longer reads cookies, but this
// page reads searchParams for paging and facets, which is itself a dynamic API. Only /property/[id]
// in this group is actually cacheable. Every read below is already unstable_cache'd, which is what
// keeps a crawler sweep cheap.
export const dynamic = "force-dynamic";

// Below this the page is thin content: it still renders, it just does not ask to be indexed.
const MIN_INDEXABLE = 5;

async function resolve(slug: string): Promise<{ landing: SeoLanding; filters: PropertyFilters }> {
  const options = await getFilterOptions();

  const landing = findLanding(slug, options);
  if (!landing) notFound();

  const filters = resolveLandingFilters(landing, options) ?? landingFallback(landing);
  if (!filters) notFound();

  return { landing, filters };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { landing, filters } = await resolve(slug);
  const total = await countProperties(filters);

  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const path = `/leilao-de-imoveis/${slug}${page > 1 ? `?page=${page}` : ""}`;
  const suffix = page > 1 ? ` — página ${page}` : "";
  // Every competitor that ranks front-loads a live count. "3.360 imóveis em leilão em São Paulo"
  // keeps the head keyword and adds the one number none of them state.
  const counted = countedLabel(total, landing.countSuffix);
  const base = total >= MIN_INDEXABLE ? counted : landing.title;
  const title = `${base.length <= 52 ? `${base} — Caixa` : base}${suffix}`;

  return {
    title,
    description: `${counted}. ${landing.lead}`,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title,
      description: landing.lead,
    },
    robots: { index: total >= MIN_INDEXABLE, follow: true },
  };
}

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { landing, filters } = await resolve(slug);

  const query = parsePropertySearchParams(sp);
  const data = await loadPropertiesView(query, { fixedFilters: filters });

  const total = data.list?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));

  return (
    <section className="view">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Início", path: "/" },
            { name: "Leilão de imóveis", path: "/leilao-de-imoveis" },
            { name: landing.label, path: `/leilao-de-imoveis/${slug}` },
          ]),
          faqLd(landing.faq),
          ...(data.list?.items.length ? [itemListLd(data.list.items, landing.h1)] : []),
        ]}
      />

      <PropertiesClient
        {...data}
        heading={{
          h1: landing.h1,
          lead: `${countedLabel(total, landing.countSuffix)}. ${landing.lead}`,
        }}
        exitTo={{ path: "/properties", query: criteriaToParams(toRpcFilters(filters)) }}
      />

      <SeoBody
        slug={slug}
        body={landing.body}
        faq={landing.faq}
        page={data.page}
        totalPages={totalPages}
      />
    </section>
  );
}
