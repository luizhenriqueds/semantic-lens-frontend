// Every text box that reaches the database funnels through clampQuery. The browser caps typing with
// maxLength; the server caps again because the same values arrive as ?q= from links and alerts.

export const MAX_QUERY_CHARS = 120;
export const MAX_QUERY_TOKENS = 16;

/** `p_filters.q` is a token-AND over search_text (type + neighborhood + city + uf), so dropping the
 *  tail widens the match rather than breaking it. */
export const MAX_PROPERTIES_Q_TOKENS = 8;

/** Hard filters one query may keep. Past this the pool empties and buildPool pays for widening. */
export const MAX_FACETS = 4;

/** Idempotent: it runs on both sides of the wire and on the cache key, so a second pass must never
 *  produce a third value. */
export function clampQuery(
  raw: string,
  maxChars: number = MAX_QUERY_CHARS,
  maxTokens: number = MAX_QUERY_TOKENS,
): string {
  let out = raw.replace(/\s+/g, " ").trim();

  if (out.length > maxChars) {
    const cut = out.slice(0, maxChars);
    const space = cut.lastIndexOf(" ");
    // An unbroken 5 000-character paste has no word break, and hard-truncating it is the point.
    out = (space > maxChars * 0.6 ? cut.slice(0, space) : cut).trim();
  }

  const tokens = out.split(" ").filter(Boolean);
  return tokens.length > maxTokens ? tokens.slice(0, maxTokens).join(" ") : out;
}
