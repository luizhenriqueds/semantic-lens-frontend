import type { MetadataRoute } from "next";
import { landingPaths, propertyIds, sitemapChunkCount } from "@/lib/seo/sitemap";
import { abs } from "@/lib/seo/site";

export const revalidate = 86_400;
// Five sequential 1k-row reads per chunk; the default function timeout kills this.
export const maxDuration = 60;

export async function generateSitemaps() {
  const n = await sitemapChunkCount();
  return Array.from({ length: n }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const chunk = Number(id);

  if (chunk === 0) {
    const now = new Date();
    return [
      { url: abs("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
      {
        url: abs("/leilao-de-imoveis"),
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      },
      ...(await landingPaths()).map((path) => ({
        url: abs(path),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      { url: abs("/termos"), changeFrequency: "yearly" as const, priority: 0.2 },
      { url: abs("/privacidade"), changeFrequency: "yearly" as const, priority: 0.2 },
    ];
  }

  // No lastModified on listings: last_seen lives on property_details, not on the list MV, and
  // Google discounts a lastmod it cannot trust anyway.
  return (await propertyIds(chunk - 1)).map((pid) => ({
    url: abs(`/property/${pid}`),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));
}
