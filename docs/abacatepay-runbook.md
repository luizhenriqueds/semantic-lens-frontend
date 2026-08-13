# AbacatePay - setup and operation

Card subscriptions through AbacatePay's hosted checkout. Their transparent checkout is PIX/boleto
and one-time only, so recurring billing has to leave our page and come back on `completionUrl`.

**The webhook, not the return URL, is what grants a plan.** A user can return before, after, or
never; every path through `CheckoutReturnDialog` is written around that.

## 1. Create the API key

Dashboard → **Nova chave**:

| Field         | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Versão da API | **API v2** — `lib/billing/abacate.ts` calls `api.abacatepay.com/v2` |
| Escopo        | **Leitura e escrita** — we create and cancel subscriptions          |
| Descrição     | `leilao-index-api-key-dev` / `leilao-index-api-key-prod`            |

**Permissões.** The integration only ever calls four endpoints:

| Endpoint                        | Called by            | When           |
| ------------------------------- | -------------------- | -------------- |
| `POST /v2/subscriptions/create` | `startCheckout`      | every purchase |
| `POST /v2/subscriptions/cancel` | `cancelSubscription` | user cancels   |
| `POST /v2/products/create`      | you, by curl         | once, at setup |
| `POST /v2/webhooks/create`      | you, by curl         | once, at setup |

So grant `SUBSCRIPTION:*` (their docs also show these endpoints under `CHECKOUT:*` — the published
permission table has no SUBSCRIPTION resource, so check the names the dropdown actually offers),
plus `PRODUCT:CREATE` and `WEBHOOK:CREATE`.

**Never grant `WITHDRAW:*` (saques), PIX transfers or `CONNECT:*`** on the production key. Those
move money out of the account and nothing here touches them, so a leaked key cannot drain it.

For the dev key it is fine to leave every permission selected: dev mode charges nothing, and a
permission mismatch there would only masquerade as an integration bug. A missing permission returns
**403**, which surfaces as `[billing] checkout create failed: HTTP 403` and a generic error on the
paywall.

Put the key in `ABACATEPAY_API_KEY`. The key alone selects the environment - `abc_dev_...` is
sandbox, and it still fires webhooks.

## 2. Create the products

The price and the billing cycle live on the product, not on the checkout call. One product per
sellable plan, prices in **cents**, matching `PLANS[*].price` in `lib/entitlements/plans.ts`.

```sh
curl -X POST https://api.abacatepay.com/v2/products/create \
  -H "Authorization: Bearer $ABACATEPAY_API_KEY" -H "Content-Type: application/json" \
  -d '{"externalId":"plan_investor","name":"Leilão Index Investidor","price":3900,"currency":"BRL","cycle":"MONTHLY"}'

curl -X POST https://api.abacatepay.com/v2/products/create \
  -H "Authorization: Bearer $ABACATEPAY_API_KEY" -H "Content-Type: application/json" \
  -d '{"externalId":"plan_professional","name":"Leilão Index Profissional","price":7900,"currency":"BRL","cycle":"MONTHLY"}'
```

Copy each `data.id` (`prod_...`) into `ABACATEPAY_PRODUCT_INVESTOR` / `ABACATEPAY_PRODUCT_PROFESSIONAL`.

No `trialDays`: our 7-day trial is card-free and runs entirely in `start_investor_trial()`.

If a product price ever drifts from `PLANS`, `startCheckout` refuses to redirect and logs
`[billing] price drift` — loud on purpose, rather than charging an amount the user was never shown.

## 3. Register the webhook

### Generate the secret

```sh
openssl rand -hex 32
```

That one value goes in three places, all identical:

1. `ABACATEPAY_WEBHOOK_SECRET` in `.env.local`
2. the **Secret** field on the webhook
3. the `?webhookSecret=` query string of the endpoint URL

Two and three are belt and braces on purpose: their docs never say whether they present the secret
as a header or on the URL, so `matchesWebhookSecret` accepts the query param,
`x-abacatepay-secret` / `x-webhook-secret` / `webhook-secret`, or `Authorization: Bearer`. Leaving
`ABACATEPAY_WEBHOOK_SECRET` unset rejects every delivery.

### A public URL

`endpoint` must be public HTTPS - localhost and private ranges are rejected. Locally:

```sh
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

It prints a `https://<random>.trycloudflare.com` host, which changes on every restart, so the
webhook has to be re-saved each session.

Only the **webhook** needs to be public. Leave `NEXT_PUBLIC_SITE_URL=http://localhost:3000`: that
builds `completionUrl`, which your own browser follows back to the tab you are already on.

### Create it

Dashboard → **Criar webhook**, version **Webhook v2**, or by curl:

```sh
curl -X POST https://api.abacatepay.com/v2/webhooks/create \
  -H "Authorization: Bearer $ABACATEPAY_API_KEY" -H "Content-Type: application/json" \
  -d '{
    "name": "leilao-index-dev-webhook",
    "endpoint": "https://<host>/api/webhooks/abacatepay?webhookSecret=<secret>",
    "secret": "<secret>",
    "events": ["checkout.completed","checkout.refunded","checkout.disputed","checkout.lost",
               "subscription.completed","subscription.renewed","subscription.cancelled",
               "subscription.trial_started"]
  }'
```

All eight events. The `checkout.*` half is there because `/subscriptions/create` returns a
`bill_...`, so the first payment may well arrive as a checkout event rather than a subscription one;
`effectOf` maps both onto the same effect, so whichever they send, it lands.

## 4. Dev-mode checklist

A dev key charges nothing and still fires webhooks. Approved card `4242 4242 4242 4242`; declines
use the `4000...` numbers from their docs.

1. Sign in, open **Configurações → Plano**, click "Assinar", pay with the approved card.
2. The return dialog should go pending → celebration. Then verify:
   `subscriptions.status = 'active'`, `users.role`, `users.role_expires_at` (period end + 3 days
   grace), `users.role_source = 'subscription'`, one `billing_events` row with `outcome = 'applied'`.
3. A previously locked feature (`/market`) now opens.
4. **Re-deliver the same event** from their dashboard → `{"received":true,"outcome":"duplicate"}`
   and nothing changes.
5. Decline card → no role change, the checkout row does not become `active`.
6. Cancel from settings → `cancel_at_period_end = true`, access retained. Set `role_expires_at` into
   the past by hand and confirm the account reads as `basic` again (no cron: `user_role_of()` does it).
7. Trial → paid: on a fresh account start the trial, confirm the Investidor button still offers a
   purchase, buy, and confirm the copy stops saying "Teste grátis até…".

## 5. Confirm the two undocumented details

Both are designed around defensively; the first real delivery settles them.

- **How they authenticate to us.** Every rejection logs `[billing] webhook rejected: headers=…` with
  header _names_ only. Once you see which channel they use, trim `SECRET_HEADERS` in
  `lib/billing/secret.ts` to just that one.
- **Whether any payload carries the `subs_...` id.** `/subscriptions/cancel` needs it and nothing
  else gives it to us. Check `billing_events.payload` after the first payment. If it never appears,
  in-app cancellation stays unavailable (`cancelSubscription` returns `pending` and says so) and the
  fallback is cancelling from their dashboard.

## 6. Going live

Swap to the production key (narrow its permissions per §1), re-create both products in the
production account (ids differ), generate a **fresh** secret, re-register the webhook against the
production domain, and update the four env vars.

## 7. When a webhook is lost

Re-deliver it from the AbacatePay dashboard. `apply_subscription_event` is idempotent on
`billing_events.event_key`, so replaying is always safe and is the supported repair path.
