import type Stripe from "stripe";

/** Shared by events.test.ts and webhook.test.ts. Both cast through `unknown`, so a Stripe shape
 *  change surfaces as a confusing undefined rather than a type error - keeping one copy means
 *  there is only one place to correct when it happens. */
export const PERIOD_END = 1_800_000_000;
export const PERIOD_END_ISO = new Date(PERIOD_END * 1000).toISOString();
export const CREATED = 1_700_000_000;

export const stripeEvent = (
  type: string,
  object: unknown,
  over: Record<string, unknown> = {},
): Stripe.Event =>
  ({
    id: "evt_1",
    type,
    created: CREATED,
    livemode: false,
    data: { object },
    ...over,
  }) as Stripe.Event;

export const stripeSubscription = (over: Record<string, unknown> = {}) =>
  ({
    id: "sub_1",
    customer: "cus_1",
    cancel_at_period_end: false,
    metadata: { external_id: "ext-1" },
    items: { data: [{ current_period_end: PERIOD_END }] },
    ...over,
  }) as unknown as Stripe.Subscription;
