// Who a request is charged to. Headers are the only source: `NextRequest.ip` is gone in Next 15
// and the edge runtime has no socket address.

/** Hops in front of this process. 0 disables header trust: where nothing rewrites the header, an
 *  attacker just varies it for a fresh bucket per request. */
function trustedProxies(): number {
  const v = Number(process.env.RATELIMIT_TRUSTED_PROXIES);
  return Number.isInteger(v) && v >= 0 ? v : 1;
}

export function normalizeIp(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(s);
  // A v4 address with a port has exactly one colon; a bare v6 has several and no dots.
  if (bracketed) s = bracketed[1];
  else if (s.includes(".") && s.split(":").length === 2) s = s.split(":")[0];

  s = s.split("%")[0].toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s);
  if (mapped) s = mapped[1];

  return s.length <= 45 && /^[0-9a-f.:]+$/.test(s) && /[.:]/.test(s) ? s : null;
}

/** Canonical 8 groups, so the compressed and expanded forms of one address bucket together. */
function expandV6(ip: string): string[] {
  const [left, right = ""] = ip.split("::");
  const head = left ? left.split(":") : [];
  const tail = right ? right.split(":") : [];
  const gap = ip.includes("::") ? Math.max(0, 8 - head.length - tail.length) : 0;
  return [...head, ...Array<string>(gap).fill("0"), ...tail]
    .map((g) => (g === "" ? "0" : g.replace(/^0+(?=.)/, "")))
    .slice(0, 8);
}

/** A residential IPv6 customer owns a /64, so the low half rotates for free. */
export function ipBucket(ip: string): string {
  return ip.includes(":") ? `${expandV6(ip).slice(0, 4).join(":")}::/64` : ip;
}

export function clientIp(headers: Headers): string | null {
  // Set to cf-connecting-ip behind Cloudflare: written by the edge, not by the client.
  const override = process.env.RATELIMIT_CLIENT_IP_HEADER;
  if (override) {
    const value = headers.get(override);
    if (value) return normalizeIp(value.split(",")[0]);
  }

  // Vercel derives this from the real peer, so it needs no hop count.
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return normalizeIp(vercel.split(",")[0]);

  const depth = trustedProxies();
  if (depth === 0) return null;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // Each hop appends the peer it saw, so the outermost trusted proxy's entry sits `depth` from
    // the end. Everything left of it came from the client and may be forged.
    const hops = forwarded
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const ip = normalizeIp(hops[hops.length - depth] ?? "");
    if (ip) return ip;
  }

  const real = headers.get("x-real-ip");
  return real ? normalizeIp(real) : null;
}

/** Charged to the account when signed in: offices and mobile CGNAT put hundreds of real users
 *  behind one IP. */
export function identify(headers: Headers, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const ip = clientIp(headers);
  return ip ? `i:${ipBucket(ip)}` : "i:unknown";
}

const NEVER_COUNTED = ["/auth/confirm"];

/** Self-hosted Next strips `next-router-prefetch` before middleware, so <Link> prefetch is usually
 *  counted and the `page` budgets absorb it; the check stays for platforms that do forward it. */
export function isCountable(pathname: string, headers: Headers): boolean {
  if (headers.get("next-router-prefetch") === "1") return false;
  const purpose = headers.get("purpose") ?? headers.get("sec-purpose") ?? "";
  if (purpose.includes("prefetch")) return false;
  if (pathname.startsWith("/_next/")) return false;
  return !NEVER_COUNTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
