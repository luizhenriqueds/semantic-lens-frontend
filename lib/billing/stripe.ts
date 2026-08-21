import Stripe from "stripe";
import { priceInCents, type PaidRole } from "@/lib/entitlements";
import { CHECKOUT_SUBMIT_NOTE } from "@/lib/entitlements/copy";

// Pinned, not inherited: the account default is changeable from the Dashboard, and Basil moved two
// fields we read. A version drift reads as undefined, never as an error.
const API_VERSION = "2026-07-29.dahlia";
const TIMEOUT_MS = 10_000;

/** Read at call time, never at module load: CI builds with placeholder env. */
export const priceIdFor = (role: PaidRole): string | null =>
  process.env[`STRIPE_PRICE_${role.toUpperCase()}`] || null;

export const isBillingConfigured = (): boolean => !!process.env.STRIPE_SECRET_KEY;

let client: Stripe | undefined;

export function stripeClient(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client = new Stripe(key, { apiVersion: API_VERSION, timeout: TIMEOUT_MS });
  return client;
}

/** Amount, currency and cadence live on the Stripe Price, so this is the only place we can confirm
 *  the user will be charged what the paywall showed. Returns a log-only reason, or null when the
 *  Price is sound. Never throws: an unreachable Stripe and a drifted Price both mean "do not sell". */
export async function verifyPlanPrice(role: PaidRole, priceId: string): Promise<string | null> {
  const price = await stripeClient()
    .prices.retrieve(priceId)
    .catch((err: Error) => err);
  if (price instanceof Error) return `lookup failed: ${price.message}`;

  const { interval, interval_count } = price.recurring ?? {};
  const want = priceInCents(role);

  if (!price.active) return "archived";
  if (price.type !== "recurring") return `type ${price.type}`;
  if (price.currency !== "brl") return `currency ${price.currency}`;
  if (interval !== "month" || interval_count !== 1) return `interval ${interval_count}/${interval}`;
  // null on tiered pricing, which fails closed against a number.
  if (price.unit_amount !== want) return `amount ${price.unit_amount} != ${want}`;

  return null;
}

export async function createSubscriptionCheckout(input: {
  priceId: string;
  externalId: string;
  userId: string;
  role: PaidRole;
  email?: string;
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string; livemode: boolean }> {
  const metadata = { external_id: input.externalId, user_id: input.userId, role: input.role };

  const session = await stripeClient().checkout.sessions.create(
    {
      mode: "subscription",
      line_items: [{ price: input.priceId, quantity: 1 }],
      // Explicit: boleto and pix settle asynchronously, so a completed checkout would not be a
      // paid one and the return dialog assumes it is.
      payment_method_types: ["card"],
      locale: "pt-BR",
      custom_text: { submit: { message: CHECKOUT_SUBMIT_NOTE } },
      client_reference_id: input.externalId,
      // Two namespaces, neither copying to the other. subscription_data is the load-bearing one:
      // it carries external_id onto every later renewal event.
      metadata,
      subscription_data: { metadata },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      ...(input.customerId ? { customer: input.customerId } : { customer_email: input.email }),
    },
    { idempotencyKey: input.externalId },
  );

  if (!session.url) throw new Error("checkout session has no url");
  return { id: session.id, url: session.url, livemode: session.livemode };
}

/** No `draft`: Stripe has not billed those, and it types the field open-endedly for statuses it has
 *  yet to invent, which the panel would have no wording for. */
const INVOICE_STATUSES = ["paid", "open", "uncollectible", "void"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type Invoice = {
  id: string;
  number: string | null;
  issuedAt: string;
  amountCents: number;
  status: InvoiceStatus;
  /** Stripe's PDF, falling back to its hosted page while the PDF is still rendering. */
  fileUrl: string | null;
};

// Stripe's own ceiling. The panel pages through them, so this is the whole history it can show.
const INVOICE_LIMIT = 100;

/** Stripe holds the only copy: `subscriptions` keeps the current period, not the charges behind it,
 *  and the PDF exists nowhere else. Null - not [] - on failure, so the panel can offer a retry
 *  rather than claim the account never paid. */
export async function listInvoices(customerId: string): Promise<Invoice[] | null> {
  const page = await stripeClient()
    .invoices.list({ customer: customerId, limit: INVOICE_LIMIT })
    .catch((err: Error) => err);

  if (page instanceof Error) {
    console.error(`[billing] invoice list failed: ${page.message}`);
    return null;
  }

  return page.data.flatMap((invoice) => {
    const status = INVOICE_STATUSES.find((known) => known === invoice.status);
    if (!status) return [];
    return {
      id: invoice.id,
      number: invoice.number,
      // paid_at is when the money moved; `created` covers the rows that never got there.
      issuedAt: new Date(
        (invoice.status_transitions.paid_at ?? invoice.created) * 1000,
      ).toISOString(),
      // amount_paid is 0 while an invoice is open, where the total is what is being asked for.
      amountCents: invoice.amount_paid || invoice.total,
      status,
      fileUrl: invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null,
    };
  });
}

/** Access runs to the end of the paid period, matching what request_subscription_cancel records. */
export async function cancelProviderSubscription(subscriptionId: string): Promise<void> {
  await stripeClient().subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

/** Throws on a bad signature, a replayed timestamp or an unset secret, so the route fails closed. */
export function verifyWebhook(rawBody: string, signature: string | null): Promise<Stripe.Event> {
  return stripeClient().webhooks.constructEventAsync(
    rawBody,
    signature ?? "",
    process.env.STRIPE_WEBHOOK_SECRET ?? "",
  );
}
