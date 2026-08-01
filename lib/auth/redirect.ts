const DEFAULT = "/dashboard";

/** `?redirect=` is attacker-controlled. "//evil.com" and "/\evil.com" leave the origin despite the
 *  leading slash, so a startsWith("/") check alone is not enough. */
export function safeRedirect(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/")) return DEFAULT;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT;
  return raw;
}
