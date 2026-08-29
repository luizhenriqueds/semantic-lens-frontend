import "server-only";
import { countProperties, getFilterOptions } from "@/lib/data";
import { IS_BUILD, withRetry } from "@/lib/data/client";
import { EMPTY_FILTER_OPTIONS } from "@/lib/types";
import { listableMv } from "@/lib/data/propertyList";
import { SEO_LANDINGS } from "./landings";
import { allCityLandings } from "./resolve";
import { abs } from "./site";

const CHUNK = 5_000;
const PAGE = 1_000;
// Chunk 0 is the landings; the rest are property URLs. 10 caps a runaway at 45k listings.
const MAX_CHUNKS = 10;

export async function sitemapChunkCount(): Promise<number> {
  const total = await countProperties({});
  return Math.min(MAX_CHUNKS, Math.max(2, 1 + Math.ceil(total / CHUNK)));
}

export async function sitemapUrls(): Promise<string[]> {
  const n = await sitemapChunkCount();
  return Array.from({ length: n }, (_, i) => abs(`/sitemap/${i}.xml`));
}

/** The curated registry plus a page for every city in the catalogue - city facets are what these
 *  SERPs rank, and there are far more cities than the footer can carry. */
export async function landingPaths(): Promise<string[]> {
  // The build has no database; at request time a failure throws so ISR keeps the last good sitemap.
  const options = await getFilterOptions().catch((e) => {
    if (!IS_BUILD) throw e;
    return EMPTY_FILTER_OPTIONS;
  });
  const slugs = [
    ...SEO_LANDINGS.map((l) => l.slug),
    ...allCityLandings(options).map((l) => l.slug),
  ];
  return [...new Set(slugs)].map((s) => `/leilao-de-imoveis/${s}`);
}

export async function propertyIds(chunk: number): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; offset < CHUNK; offset += PAGE) {
    const from = chunk * CHUNK + offset;
    const res = await withRetry(() =>
      listableMv("property_id")
        .order("property_id", { ascending: true })
        .range(from, from + PAGE - 1),
    );
    if (res.error) {
      console.error(`[seo] sitemap chunk ${chunk} failed: ${res.error.message}`);
      break;
    }
    const batch = (res.data ?? []) as { property_id: string }[];
    out.push(...batch.map((r) => r.property_id));
    if (batch.length < PAGE) break;
  }
  return out;
}
