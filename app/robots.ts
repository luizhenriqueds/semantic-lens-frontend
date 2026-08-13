import type { MetadataRoute } from "next";
import { sitemapUrls } from "@/lib/seo/sitemap";
import { SITE_URL } from "@/lib/seo/site";

export const revalidate = 86_400;

// Short disallow list on purpose: /properties, /search and the rest of the app shell carry
// noindex instead. A blocked URL's noindex is never read, so it can still surface as a bare link.
export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/report/", "/auth/", "/settings", "/groups", "/market"],
      },
    ],
    sitemap: await sitemapUrls(),
    host: SITE_URL,
  };
}
