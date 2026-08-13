import { normalize } from "@/lib/facets/normalize";
import { titleCase } from "@/lib/format";
import type { FilterOptions, PropertyFilters } from "@/lib/types";
import { cityLanding, getLanding, type SeoLanding } from "./landings";
import { slugify } from "./slug";
import { UF_NAME } from "./ufs";

/** Catalogue values are matched by slug, never hardcoded: the stored casing of a city or type is
 *  unknown here, and the list RPC filters on the stored value. Returns null when the landing has
 *  no counterpart in the current base. */
export function resolveLandingFilters(
  landing: SeoLanding,
  options: FilterOptions,
): PropertyFilters | null {
  const { spec } = landing;

  switch (spec.kind) {
    case "uf":
      return options.ufs.includes(spec.uf) ? { uf: spec.uf } : null;

    case "city": {
      const hit = options.cities.find((c) => c.uf === spec.uf && slugify(c.city) === spec.citySlug);
      return hit ? { uf: hit.uf, city: hit.city } : null;
    }

    case "type": {
      const hit = options.types.find((t) => slugify(t) === spec.typeSlug);
      return hit ? { type: hit } : null;
    }

    case "modality": {
      const hits = options.modalities.filter((m) => {
        const n = normalize(m);
        return spec.tokens.every((t) => n.includes(t));
      });
      return hits.length ? { modalities: hits } : null;
    }

    case "price":
      return { maxPrice: spec.maxPrice };

    case "discount":
      return { minDiscount: spec.minDiscount };

    case "payment":
      return {
        ...(spec.financing ? { financing: true } : {}),
        ...(spec.fgts ? { fgts: true } : {}),
      };
  }
}

/** A type or city slug that no longer exists in the base still deserves a page rather than a 404
 *  when it has a parent - "sala-comercial" falls back to nothing, "sao-paulo-sp" to the state. */
export function landingFallback(landing: SeoLanding): PropertyFilters | null {
  return landing.spec.kind === "city" ? { uf: landing.spec.uf } : null;
}

/** "nova-iguacu-rj" -> a city landing, for any city in the catalogue. The curated registry only
 *  carries the capitals it links from the footer; the long tail of cities is where the volume is,
 *  so it is resolved here instead of being enumerated. */
export function resolveCitySlug(slug: string, options: FilterOptions): SeoLanding | null {
  const cut = slug.lastIndexOf("-");
  if (cut < 1) return null;

  const uf = slug.slice(cut + 1).toUpperCase();
  const citySlug = slug.slice(0, cut);
  if (!UF_NAME[uf]) return null;

  const hit = options.cities.find((c) => c.uf === uf && slugify(c.city) === citySlug);
  return hit ? cityLanding(uf, citySlug, titleCase(hit.city)) : null;
}

/** The curated registry first, then any city in the catalogue. */
export function findLanding(slug: string, options: FilterOptions): SeoLanding | null {
  return getLanding(slug) ?? resolveCitySlug(slug, options);
}

/** Every city landing the sitemap should carry. */
export function allCityLandings(options: FilterOptions): SeoLanding[] {
  return options.cities.map((c) => cityLanding(c.uf, slugify(c.city), titleCase(c.city)));
}
