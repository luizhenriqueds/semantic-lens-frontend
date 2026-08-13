import { normalize } from "@/lib/facets/normalize";

/** "São Paulo" -> "sao-paulo". Built on normalize(), which already folds diacritics. */
export function slugify(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
