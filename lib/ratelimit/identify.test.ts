import { afterEach, describe, expect, it } from "vitest";
import { clientIp, identify, ipBucket, isCountable, normalizeIp } from "./identify";

const h = (init: Record<string, string>) => new Headers(init);

afterEach(() => {
  delete process.env.RATELIMIT_TRUSTED_PROXIES;
  delete process.env.RATELIMIT_CLIENT_IP_HEADER;
});

describe("normalizeIp", () => {
  it("strips ports, zones and the v4-mapped v6 prefix", () => {
    expect(normalizeIp("203.0.113.4:51234")).toBe("203.0.113.4");
    expect(normalizeIp("[2001:db8::1]:443")).toBe("2001:db8::1");
    expect(normalizeIp("::ffff:203.0.113.4")).toBe("203.0.113.4");
    expect(normalizeIp("fe80::1%eth0")).toBe("fe80::1");
  });

  it("rejects anything that is not an address", () => {
    expect(normalizeIp("")).toBeNull();
    expect(normalizeIp("not-an-ip")).toBeNull();
    expect(normalizeIp("<script>")).toBeNull();
    expect(normalizeIp("9".repeat(60))).toBeNull();
  });
});

describe("ipBucket", () => {
  it("leaves IPv4 alone and collapses IPv6 to its /64", () => {
    expect(ipBucket("203.0.113.4")).toBe("203.0.113.4");
    expect(ipBucket("2001:db8:1:2:3:4:5:6")).toBe("2001:db8:1:2::/64");
  });

  it("buckets the compressed and expanded forms of one address together", () => {
    expect(ipBucket("2001:0db8:0000:0000:a:b:c:d")).toBe(ipBucket("2001:db8::a:b:c:d"));
  });

  it("does not let the rotating half of a /64 open new buckets", () => {
    expect(ipBucket("2001:db8:1:2:aaaa::1")).toBe(ipBucket("2001:db8:1:2:ffff::9"));
  });
});

describe("clientIp", () => {
  it("takes the entry the outermost trusted proxy wrote, ignoring forged ones to its left", () => {
    const headers = h({ "x-forwarded-for": "1.1.1.1, 203.0.113.4, 10.0.0.1" });
    process.env.RATELIMIT_TRUSTED_PROXIES = "1";
    expect(clientIp(headers)).toBe("10.0.0.1");
    process.env.RATELIMIT_TRUSTED_PROXIES = "2";
    expect(clientIp(headers)).toBe("203.0.113.4");
  });

  it("ignores the header entirely at depth 0", () => {
    process.env.RATELIMIT_TRUSTED_PROXIES = "0";
    expect(clientIp(h({ "x-forwarded-for": "1.1.1.1" }))).toBeNull();
  });

  it("prefers the Vercel header over a client-supplied chain", () => {
    const headers = h({ "x-vercel-forwarded-for": "203.0.113.4", "x-forwarded-for": "1.1.1.1" });
    expect(clientIp(headers)).toBe("203.0.113.4");
  });

  it("prefers the configured header over everything else", () => {
    process.env.RATELIMIT_CLIENT_IP_HEADER = "cf-connecting-ip";
    const headers = h({ "cf-connecting-ip": "198.51.100.7", "x-vercel-forwarded-for": "1.1.1.1" });
    expect(clientIp(headers)).toBe("198.51.100.7");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(h({ "x-real-ip": "203.0.113.4" }))).toBe("203.0.113.4");
  });
});

describe("identify", () => {
  it("charges a signed-in request to the account, never the address", () => {
    expect(identify(h({ "x-real-ip": "203.0.113.4" }), "user-1")).toBe("u:user-1");
  });

  it("charges anonymous traffic to the IP bucket", () => {
    expect(identify(h({ "x-real-ip": "203.0.113.4" }))).toBe("i:203.0.113.4");
  });

  it("shares one bucket when nothing trustworthy identifies the caller", () => {
    expect(identify(h({}))).toBe("i:unknown");
  });

  it("keeps the account and address key spaces apart", () => {
    expect(identify(h({}), "203.0.113.4")).not.toBe(identify(h({ "x-real-ip": "203.0.113.4" })));
  });
});

describe("isCountable", () => {
  it("skips prefetch, which fires many times per navigation", () => {
    expect(isCountable("/properties", h({ "next-router-prefetch": "1" }))).toBe(false);
    expect(isCountable("/properties", h({ purpose: "prefetch" }))).toBe(false);
    expect(isCountable("/properties", h({ "sec-purpose": "prefetch;anonymous-client-ip" }))).toBe(
      false,
    );
  });

  it("counts a real soft navigation, which carries rsc without the prefetch header", () => {
    expect(isCountable("/properties", h({ rsc: "1" }))).toBe(true);
  });

  it("counts an ordinary document request", () => {
    expect(isCountable("/property/abc", h({}))).toBe(true);
  });

  it("never counts the auth callback", () => {
    expect(isCountable("/auth/confirm", h({}))).toBe(false);
  });
});
