# Stripe - setup and operation

Card subscriptions through Stripe Checkout in `subscription` mode. The browser leaves for
checkout.stripe.com and returns on `success_url`.

**The webhook, not the return URL, is what grants a plan.** A user can return before, after, or
never; every path through `CheckoutReturnDialog` is written around that.

## 1. Four things, one mode

Unlike AbacatePay, where the API key alone selected the environment, Stripe needs four values kept
in the same mode. Mixing them fails quietly:

| Env var                     | Where it comes from                           |
| --------------------------- | --------------------------------------------- |
| `STRIPE_SECRET_KEY`         | Developers → API keys (`sk_test_`/`sk_live_`) |
| `STRIPE_PRICE_INVESTOR`     | the Price you create in §2                    |
| `STRIPE_PRICE_PROFESSIONAL` | the Price you create in §2                    |
| `STRIPE_WEBHOOK_SECRET`     | the endpoint you register in §3               |

`whsec_...` is **per endpoint and per mode** — the test endpoint, the live endpoint and
`stripe listen` each print a different one. A live key against a test signing secret produces a
silent 401 on every delivery, and no plan is ever granted.

## 2. Create the products

The amount and the billing cycle live on the Price, not on the checkout call. One recurring monthly
BRL Price per sellable plan, in **cents**, matching `PLANS[*].price` in `lib/entitlements/plans.ts`.

```sh
stripe products create --name "Leilão Index Investidor" \
  -d "default_price_data[currency]=brl" \
  -d "default_price_data[unit_amount]=3900" \
  -d "default_price_data[recurring][interval]=month"

stripe products create --name "Leilão Index Profissional" \
  -d "default_price_data[currency]=brl" \
  -d "default_price_data[unit_amount]=7900" \
  -d "default_price_data[recurring][interval]=month"
```

Copy each `default_price` (`price_...`, **not** the `prod_...`) into `STRIPE_PRICE_INVESTOR` /
`STRIPE_PRICE_PROFESSIONAL`.

No `trial_period_days`: our 7-day trial is card-free and runs entirely in `start_investor_trial()`.

`verifyPlanPrice` re-reads the Price on every checkout and refuses to redirect unless it is active,
recurring, BRL, monthly, and exactly the plan amount. A drift logs `[billing] price drift` and shows
a generic error rather than charging an amount the user was never shown.

## 3. Register the webhook

Six event types, and only these:

```sh
stripe webhook_endpoints create \
  --url https://<host>/api/webhooks/stripe \
  --api-version 2026-07-29.dahlia \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=invoice.paid" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" \
  -d "enabled_events[]=charge.refunded" \
  -d "enabled_events[]=charge.dispute.created"
```

Pin `--api-version` to the value in `lib/billing/stripe.ts`. Left unset it follows the account
default, which is changeable from the Dashboard — and Basil moved both
`subscription.current_period_end` (now on `items.data[0]`) and `invoice.subscription` (now under
`invoice.parent`). A version drift reads as `undefined`, not as an error.

Deliberately **not** subscribed:

- `invoice.payment_succeeded` — a near-duplicate of `invoice.paid`.
- `customer.subscription.created` — `checkout.session.completed` already covers it.
- `invoice.payment_failed` — Smart Retries dun for weeks, and an unpaid renewal already expires the
  plan on the clock via `role_expires_at`. Revoking on the first decline would lock out a paying
  user over an expired card.

### Locally

```sh
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

It prints the `whsec_...` to put in `.env.local`, and needs no public URL — no tunnel, and nothing
to re-register each session. Leave `NEXT_PUBLIC_SITE_URL=http://localhost:3000`: that builds
`success_url`, which your own browser follows back to the tab you are already on.

## 4. Dev-mode checklist

Test keys charge nothing. Approved card `4242 4242 4242 4242`; declines use `4000 0000 0000 0002`.

1. Sign in, open **Configurações → Plano**, click "Assinar", pay with the approved card.
2. The return dialog should go pending → celebration. Then verify:
   `subscriptions.status = 'active'`, `provider_subscription_id` set, `users.role`,
   `users.role_expires_at` (period end + 3 days grace), `users.role_source = 'subscription'`,
   `users.stripe_customer_id` set.
3. **The double-fire check.** One purchase fires both `checkout.session.completed` and
   `invoice.paid`, so `billing_events` holds two `applied` rows with distinct `evt_` keys — and
   `current_period_end` must be exactly **one** month out, not two. This is what the
   never-emit-`renew` rule in `lib/billing/events.ts` buys.
4. A previously locked feature (`/market`) now opens.
5. `stripe events resend <evt_id>` → `{"received":true,"outcome":"duplicate"}` and nothing changes.
6. Decline card → no role change, the checkout row does not become `active`.
7. Cancel from settings → `cancel_at_period_end = true`, access retained. Set `role_expires_at` into
   the past by hand and confirm the account reads as `basic` again (no cron: `user_role_of()` does it).
8. `stripe trigger charge.refunded` → `status = 'refunded'`, role back to `basic`. A **partial**
   refund from the Dashboard must do nothing.
9. Trial → paid: on a fresh account start the trial, confirm the Investidor button still offers a
   purchase, buy, and confirm the copy stops saying "Teste grátis até…".

## 5. Known behaviours, so nobody debugs a non-bug

- **`stale` rows in `billing_events` are expected.** Several events converge on the same activation,
  so a late one is filed `stale` and skipped. The write would have been a no-op either way.
- **An immediate cancel from the Dashboard leaves access until the period end.**
  `apply_subscription_event`'s `cancel` branch keeps `current_period_end` on purpose, so cancelling
  mid-period through Stripe rather than through the app grants up to a month of free access. Closing
  it needs a new effect in a migration; use the app's cancel button instead.

## 6. Going live

Swap to the live secret key, re-create both Prices in live mode (ids differ), register the endpoint
against the production domain with its own `whsec_`, and update all four env vars together.

## 7. When a webhook is lost

Re-deliver it from the Stripe Dashboard, or `stripe events resend <evt_id>`.
`apply_subscription_event` is idempotent on `billing_events.event_key`, which is Stripe's own event
id, so replaying is always safe and is the supported repair path.
