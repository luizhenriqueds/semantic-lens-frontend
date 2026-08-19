import { NextResponse } from "next/server";
import { stripeClient, verifyWebhook } from "@/lib/billing/stripe";
import { toEventArgs, type EventLookups } from "@/lib/billing/webhook";
import { supabase } from "@/lib/supabase";

// Signature verification needs node:crypto, and no caching of a POST that mutates plans.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lookups = (): EventLookups => {
  const client = stripeClient();
  return {
    getSubscription: (id) => client.subscriptions.retrieve(id),
    getCharge: (id) => client.charges.retrieve(id),
  };
};

/** The webhook, not the return URL, is what grants a plan. Anything a retry cannot fix is answered
 *  200 on purpose: only a database or Stripe failure is worth Stripe trying again. */
export async function POST(request: Request) {
  // .text(), never .json(): constructEvent hashes the exact bytes Stripe signed.
  const raw = await request.text();

  let event;
  try {
    event = await verifyWebhook(raw, request.headers.get("stripe-signature"));
  } catch (err) {
    console.warn(`[billing] webhook rejected: ${(err as Error).message}`);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let args;
  try {
    args = await toEventArgs(event, lookups());
  } catch (err) {
    // As retryable as a database failure: without the read the event has no period end, and
    // applying it would grant the wrong dates.
    console.error(`[billing] webhook lookup failed: ${(err as Error).message}`);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }

  if (!args) return NextResponse.json({ received: true, ignored: event.type });

  const { data, error } = await supabase.rpc("apply_subscription_event", args);

  if (error) {
    console.error(`[billing] webhook apply failed: ${error.message}`);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }

  console.info(`[billing] webhook ${event.type} -> ${data}`);
  return NextResponse.json({ received: true, outcome: data });
}
