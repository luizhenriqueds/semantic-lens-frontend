const SKIP = ["/login", "/register"];

/** Sign-in URL carrying `target`. Auth pages are never carried - that would loop. */
export function loginHref(target: string | null | undefined): string {
  if (!target || SKIP.some((p) => target === p || target.startsWith(`${p}?`))) return "/login";
  return `/login?redirect=${encodeURIComponent(target)}`;
}
