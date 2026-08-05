import { normalize } from "@/lib/facets";
import { BEDROOM_NOUNS } from "@/lib/facets/parse";

/** Structured terms people type into the free-text box. `property_list_mv.search_text` is only
 *  type + neighborhood + city + uf, so "2 dormitórios" can never match as text - it has to become
 *  the filter the user actually meant. The typed string itself is left alone; only what reaches
 *  the RPC changes.
 *
 *  The vocabulary comes from lib/facets/parse.ts, which does the same job for /search. */
const BEDROOM_NOUN_LIST = BEDROOM_NOUNS.split("|");

// Prefix, not exact: while the user is still typing "2 dorm|", the noun isn't complete yet, and
// the strict version dropped the count until the last letter landed.
const isBedroomNoun = (tok: string): boolean =>
  tok.length >= 2 && BEDROOM_NOUN_LIST.some((n) => n.startsWith(tok));

export type QueryTerms = { q: string; bedroomsEq?: number };

export function parseQueryTerms(raw: string): QueryTerms {
  // Matched on the folded tokens, kept as typed: `q` is shown back to the user in alert
  // descriptions and chips (lib/alerts/filters.ts), so its casing has to survive. normalize()
  // only lowercases, strips marks and collapses runs of spaces, so the two stay index-aligned.
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  const folded = normalize(raw).split(" ").filter(Boolean);
  const kept: string[] = [];
  let bedroomsEq: number | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const count = Number(folded[i]);
    // A bare "3" is a neighbourhood number as often as a bedroom count, so the noun is required.
    const isBedrooms =
      Number.isInteger(count) && count >= 1 && count <= 20 && isBedroomNoun(folded[i + 1] ?? "");

    if (isBedrooms) {
      // A typed count is exact ("2 dormitórios" means 2, not 2+) - the advanced "Quartos" filter
      // already owns the "at least" case.
      bedroomsEq ??= count;
      i++; // the noun is consumed with the number
      continue;
    }
    kept.push(tokens[i]);
  }

  return { q: kept.join(" "), bedroomsEq };
}
