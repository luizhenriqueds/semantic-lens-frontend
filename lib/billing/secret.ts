import { createHash, timingSafeEqual } from "node:crypto";

/** AbacatePay's docs do not say how they authenticate the call to our endpoint, so every plausible
 *  channel is accepted. Trim this list once a real delivery shows which one they use - the route
 *  logs the header names it received on every rejection. */
const SECRET_HEADERS = ["x-abacatepay-secret", "x-webhook-secret", "webhook-secret"];

const QUERY_PARAM = "webhookSecret";

/** Digest both sides first: timingSafeEqual throws on a length mismatch, which would itself leak
 *  the secret's length. */
const equals = (a: string, b: string): boolean =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export function presentedSecrets(url: URL, headers: Headers): string[] {
  const candidates = [
    url.searchParams.get(QUERY_PARAM),
    ...SECRET_HEADERS.map((h) => headers.get(h)),
    headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null,
  ];
  return candidates.filter((v): v is string => !!v);
}

export function matchesWebhookSecret(
  url: URL,
  headers: Headers,
  secret: string | undefined,
): boolean {
  if (!secret) return false;
  // .filter, not .some: comparing every candidate keeps the work constant across channels.
  return presentedSecrets(url, headers).filter((v) => equals(v, secret)).length > 0;
}
