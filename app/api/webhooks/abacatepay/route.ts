import { NextResponse, type NextRequest } from "next/server";
import { effectOf, parseEvent } from "@/lib/billing/events";
import { matchesWebhookSecret } from "@/lib/billing/secret";
import { supabase } from "@/lib/supabase";

// node:crypto for the timing-safe compare, and no caching of a POST that mutates plans.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The webhook, not the return URL, is what grants a plan. Anything a retry cannot fix is answered
 *  200 on purpose: only a genuine database failure is worth the provider trying again. */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  if (!matchesWebhookSecret(url, request.headers, process.env.ABACATEPAY_WEBHOOK_SECRET)) {
    // Names only, never values. This is what tells us which channel AbacatePay actually uses.
    const seen = [...request.headers.keys()].sort().join(",");
    console.warn(
      `[billing] webhook rejected: headers=${seen} query=${[...url.searchParams.keys()]}`,
    );
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const event = body ? parseEvent(body) : null;
  if (!event) return NextResponse.json({ received: true, ignored: "unparsed" });

  const effect = effectOf(event.event);
  if (effect === "ignore") return NextResponse.json({ received: true, ignored: event.event });

  const { data, error } = await supabase.rpc("apply_subscription_event", {
    p_effect: effect,
    p_event: event.event,
    p_event_key: event.eventKey,
    p_external_id: event.externalId,
    p_bill_id: event.billId,
    p_subs_id: event.subscriptionId,
    p_customer_id: event.customerId,
    p_period_end: event.periodEnd,
    p_amount_cents: event.amount,
    p_occurred_at: event.occurredAt,
    p_dev_mode: event.devMode,
    p_raw: body,
  });

  if (error) {
    console.error(`[billing] webhook apply failed: ${error.message}`);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }

  console.info(`[billing] webhook ${event.event} -> ${data}`);
  return NextResponse.json({ received: true, outcome: data });
}
