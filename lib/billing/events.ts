import { createHash } from "node:crypto";

export type Effect = "activate" | "renew" | "cancel" | "revoke" | "ignore";

const EFFECTS: Record<string, Effect> = {
  "checkout.completed": "activate",
  "subscription.completed": "activate",
  "subscription.trial_started": "activate",
  "subscription.renewed": "renew",
  "subscription.cancelled": "cancel",
  "checkout.refunded": "revoke",
  "checkout.disputed": "revoke",
  "checkout.lost": "revoke",
};

/** Unknown names and the transparent/payout/transfer families all mean "not ours". They are
 *  answered 200 so the provider stops retrying something we will never act on. */
export const effectOf = (event: string): Effect => EFFECTS[event] ?? "ignore";

export type ProviderEvent = {
  event: string;
  eventKey: string;
  externalId: string | null;
  billId: string | null;
  subscriptionId: string | null;
  customerId: string | null;
  periodEnd: string | null;
  amount: number | null;
  occurredAt: string | null;
  devMode: boolean;
};

type Bag = Record<string, unknown>;

const asString = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const asBag = (v: unknown): Bag | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Bag) : null;

/** The payload nesting is undocumented, so every plausible envelope is flattened before reading:
 *  {event, data}, {event, data: {billing|subscription|...}}, or a bare object. */
function layersOf(root: Bag): Bag[] {
  const data = asBag(root.data) ?? {};
  const nested = ["billing", "subscription", "checkout", "payment", "object"]
    .map((key) => asBag(data[key]))
    .filter((b): b is Bag => b != null);
  return [root, data, ...nested];
}

const firstString = (layers: Bag[], ...keys: string[]): string | null => {
  for (const layer of layers) {
    for (const key of keys) {
      const value = asString(layer[key]);
      if (value) return value;
    }
  }
  return null;
};

/** Last resort when the id sits under a key we did not anticipate: AbacatePay ids are prefixed. */
const firstWithPrefix = (layers: Bag[], prefix: string): string | null => {
  for (const layer of layers) {
    for (const value of Object.values(layer)) {
      const s = asString(value);
      if (s?.startsWith(prefix)) return s;
    }
  }
  return null;
};

const firstNumber = (layers: Bag[], key: string): number | null => {
  for (const layer of layers) if (typeof layer[key] === "number") return layer[key] as number;
  return null;
};

export function parseEvent(body: unknown): ProviderEvent | null {
  const root = asBag(body);
  if (!root) return null;

  const layers = layersOf(root);
  const event = firstString(layers, "event", "type", "eventType");
  if (!event) return null;

  const parsed = {
    event,
    externalId: firstString(layers, "externalId", "external_id"),
    billId: firstString(layers, "billId", "bill_id") ?? firstWithPrefix(layers, "bill_"),
    subscriptionId:
      firstString(layers, "subscriptionId", "subscription_id") ?? firstWithPrefix(layers, "subs_"),
    customerId:
      firstString(layers, "customerId", "customer_id") ?? firstWithPrefix(layers, "cust_"),
    periodEnd: firstString(layers, "nextBilling", "currentPeriodEnd", "periodEnd", "trialEndsAt"),
    amount: firstNumber(layers, "amount"),
    occurredAt: firstString(layers, "occurredAt", "updatedAt", "createdAt", "timestamp"),
    devMode: layers.some((layer) => layer.devMode === true),
  };

  const providerEventId = firstString(layers, "eventId", "event_id");
  return { ...parsed, eventKey: eventKey(parsed, providerEventId) };
}

/** Uses the provider's event id when there is one; otherwise a digest of what makes the event
 *  unique, so a redelivery collapses onto the same key.
 *
 *  Without a timestamp two genuine consecutive renewals would collapse too, hence the month
 *  bucket - correct for MONTHLY, the only cycle we sell. */
export function eventKey(
  e: Omit<ProviderEvent, "eventKey">,
  providerEventId?: string | null,
): string {
  if (providerEventId) return providerEventId;
  const subject = e.subscriptionId ?? e.billId ?? e.externalId ?? "unknown";
  const when = e.occurredAt ?? new Date().toISOString().slice(0, 7);
  return createHash("sha256").update(`${e.event}|${subject}|${when}`).digest("hex");
}
