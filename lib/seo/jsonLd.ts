import { titleCase } from "@/lib/format";
import type { Property } from "@/lib/types";
import { abs, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";
import { SOCIAL_LINKS } from "./social";
import { ufName } from "./ufs";

const ORG_ID = `${SITE_URL}/#organization`;

/** Nulls are dropped rather than emitted: a schema property set to null reads worse than absent. */
const prune = <T extends Record<string, unknown>>(o: T): T =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length)),
  ) as T;

export function organizationLd(): object {
  return prune({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: abs("/icon.svg"),
    description: SITE_DESCRIPTION,
    areaServed: { "@type": "Country", name: "Brasil" },
    sameAs: SOCIAL_LINKS.map((s) => s.url),
  });
}

export function websiteLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "pt-BR",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: abs("/properties?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqLd(items: { q: string; a: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function breadcrumbLd(trail: { name: string; path: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

export function itemListLd(items: Property[], name: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: abs(`/property/${p.id}`),
      name: `${p.title} - ${titleCase(p.city)}/${p.uf}`,
    })),
  };
}

const ABOUT_TYPE: Record<string, string> = {
  Apartamento: "Apartment",
  Casa: "House",
  Sobrado: "House",
  Terreno: "Landform",
};

export function realEstateListingLd(p: Property): object {
  const url = abs(`/property/${p.id}`);
  const city = titleCase(p.city);

  const about = prune({
    "@type": ABOUT_TYPE[p.propertyType] ?? "Residence",
    name: p.title,
    numberOfBedrooms: p.bedrooms ?? undefined,
    floorSize: p.area
      ? { "@type": "QuantitativeValue", value: p.area, unitCode: "MTK" }
      : undefined,
    address: prune({
      "@type": "PostalAddress",
      streetAddress: p.rawAddress ?? undefined,
      addressLocality: city,
      addressRegion: ufName(p.uf),
      addressCountry: "BR",
    }),
    geo:
      p.lat != null && p.lon != null
        ? { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lon }
        : undefined,
  });

  return prune({
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    url,
    name: `${p.title} em ${city}/${p.uf}`,
    description: p.description ?? undefined,
    image: p.image ?? undefined,
    datePosted: p.auctionDate ?? undefined,
    provider: { "@id": ORG_ID },
    offers: prune({
      "@type": "Offer",
      url,
      price: p.saleValue ?? undefined,
      priceCurrency: "BRL",
      availability: p.inactive ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Caixa Econômica Federal" },
    }),
    about,
  });
}
