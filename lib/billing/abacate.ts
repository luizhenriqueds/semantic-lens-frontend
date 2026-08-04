import { PLANS } from "@/lib/entitlements";

const BASE = "https://api.abacatepay.com/v2";
const TIMEOUT_MS = 10_000;

/** Plans with a price. `platform` is sold by hand and `basic` is free, so neither has a product. */
export const PAID_ROLES = ["investor", "professional"] as const;
export type PaidRole = (typeof PAID_ROLES)[number];

export const isPaidRole = (r: unknown): r is PaidRole => PAID_ROLES.includes(r as PaidRole);

/** Read at call time, never at module load: CI builds with placeholder env. */
export const productIdFor = (role: PaidRole): string | null =>
  process.env[`ABACATEPAY_PRODUCT_${role.toUpperCase()}`] || null;

export const priceInCents = (role: PaidRole): number => Math.round(PLANS[role].price * 100);

/** The price lives on the AbacatePay product, not on the checkout call, so the create response is
 *  the only moment we learn what the user would actually be charged. */
export const amountMatchesPlan = (role: PaidRole, cents: number): boolean =>
  cents === priceInCents(role);

export const isBillingConfigured = (): boolean => !!process.env.ABACATEPAY_API_KEY;

export class AbacateError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AbacateError";
  }
}

/** By name, not `instanceof`: the class can be duplicated across bundles (see RateLimitError). */
export const isAbacateError = (err: unknown): err is AbacateError =>
  err instanceof Error && err.name === "AbacateError";

type Envelope<T> = { data: T | null; error: unknown; success?: boolean };

const messageOf = (body: unknown): string => {
  const err = (body as Envelope<unknown> | null)?.error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) return String(err.message);
  return "";
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const key = process.env.ABACATEPAY_API_KEY;
  if (!key) throw new AbacateError(0, "ABACATEPAY_API_KEY não configurada");

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok) throw new AbacateError(res.status, messageOf(json) || `HTTP ${res.status}`);
  // `error` is truthy on a 200 for business failures, so the status alone is not the verdict.
  if (!json || json.error || json.success === false || json.data == null) {
    throw new AbacateError(res.status, messageOf(json) || "resposta inválida");
  }
  return json.data;
}

export type SubscriptionCheckout = {
  /** bill_..., not the subs_... that /subscriptions/cancel needs - only a webhook carries that. */
  id: string;
  url: string;
  amount: number;
  devMode?: boolean;
};

export function createSubscriptionCheckout(input: {
  productId: string;
  externalId: string;
  completionUrl: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}): Promise<SubscriptionCheckout> {
  return post<SubscriptionCheckout>("/subscriptions/create", {
    items: [{ id: input.productId, quantity: 1 }],
    externalId: input.externalId,
    completionUrl: input.completionUrl,
    returnUrl: input.returnUrl,
    methods: ["CARD"],
    metadata: input.metadata ?? {},
  });
}

export async function cancelProviderSubscription(subscriptionId: string): Promise<void> {
  await post<unknown>("/subscriptions/cancel", { id: subscriptionId });
}
