# Go-live checklist

## Blockers found

- **No alert e-mails are sent from this repo.** `sendEmail` is only called from `app/actions/auth.ts`
  and `app/auth/confirm/route.ts`, but `lib/entitlements/copy.ts` promises saved-search and weekly
  digests. Confirm the sender lives in the backend, or the feature ships lying.
- **Rate limiting is off as configured.** `.env.example` ships `RATELIMIT_ENABLED=` empty and
  `RATELIMIT_SHADOW=true`. Same for the semantic cache: `SEMCACHE_ENABLED=true` with empty Upstash
  creds is a no-op.
- **`RATELIMIT_TRUSTED_PROXIES` / client IP header** must be pinned to the real edge. Trusting a
  client-supplied `x-forwarded-for` makes per-IP limiting decorative.
- **No favicon, `opengraph-image`, `robots.ts`, `sitemap.ts` or `metadataBase`** in `app/`.
- **No route-level `error.tsx`** — only `global-error.tsx`, so one failed query takes the page down.
- **No security headers** (CSP, HSTS, X-Frame-Options) in `next.config.ts`.

## Features

- [ ] Dashboard, Properties, Property detail, Analysis, Calendar
- [ ] Maps (Leaflet + clustering, mobile), Regions, Clusters/Groups
- [ ] Market, Recommendations (respects per-plan limit), Nearby places
- [ ] Portfolio/favorites, Settings, marketing landing + API waitlist
- [ ] Empty, loading and error states on each

## Search

- [ ] Full-text, exact match, goal-driven, distance/POI
- [ ] Hybrid on and `DEEPINFRA_API_KEY` valid in prod
- [ ] Zero-result, typo, very long and injection-ish queries don't 500
- [ ] DeepInfra failure degrades gracefully

## Data

- [ ] Action dates — parsing, past/upcoming, `America/Sao_Paulo`
- [ ] Addresses — normalization and missing-field fallbacks
- [ ] Prod corpus size: `is_listable` excludes unscored rows — confirm prod isn't serving a fraction
- [ ] pt-BR formatting; broken-photo fallback; data freshness visible

## Auth

- [ ] Sign-up → confirm → welcome; login errors; magic link; password reset
- [ ] `?redirect=` round-trip and open-redirect rejection
- [ ] Session refresh, sign-out, forged `sb-` cookie treated as anon

## Plans & billing

- [ ] All 5 roles × 14 features; `/market`, `/groups`, `/regions` walls; analysis + calendar views
- [ ] Quotas (basic: 10 favorites, 3 saved searches); enforced server-side, not just hidden in the UI
- [ ] RLS + quota triggers agree with `PLANS`; admin bypass shows the real plan
- [ ] Trial: start, expiry back to `basic`, no second trial, trial → paid
- [ ] AbacatePay prod cutover (runbook §6): prod key, products re-created, prices match `PLANS`,
      fresh secret, webhook on the prod domain
- [ ] Event replay → `duplicate`; declined card → no role change; price drift guard trips
- [ ] Cancel → `cancel_at_period_end`, access to period end + grace

## Alerts & e-mail

- [ ] Create/rename/toggle/delete; duplicate-name and limit errors; criteria round-trip
- [ ] Curated weekly alerts for entitled plans; digest delivery actually runs
- [ ] Unsubscribe path; SPF/DKIM/DMARC on the sending domain
- [ ] All 4 templates render in Gmail/Outlook/Apple Mail; `/api/emails/preview` 404s in prod

## Export & reports

- [ ] CSV for properties, filters and alert matches; 1000-row cap message; accents survive in Excel
- [ ] `/report/*` gated on `export`, requires a session, print CSS clean

## Filters

- [ ] Facets round-trip through the URL; shared links restore state
- [ ] Advanced filters gated; reset returns a clean corpus

## Rate limit

- [ ] `RATELIMIT_ENABLED=true`, `RATELIMIT_SHADOW` unset, Upstash Redis set, fails open on timeout
- [ ] All 5 buckets exercised; per-tier budgets correct; 429 is HTML for pages, JSON for `/api/*`
- [ ] `<Link>` prefetch doesn't burn the page budget on a normal session

## Semantic cache

- [ ] Upstash Vector set, shadow-mode hit rates reviewed and threshold calibrated before serving
- [ ] No leakage across users, plans or filter context; stale entries invalidate

## Copy

- [ ] pt-BR user-facing, English identifiers; no placeholders
- [ ] Upsell copy names the correct minimum plan
- [ ] Terms, privacy/LGPD, cookie notice, contact
- [ ] Brand consistent (`lavra.app` vs "semantic-lens")

## Security

- [ ] Service role key absent from the client bundle; RLS on every user-scoped table
- [ ] Webhook secret set (unset rejects every delivery, silently)
- [ ] All 9 server actions re-check session and entitlements; IDOR spot-check
- [ ] `npm audit`

## Observability

- [ ] Sentry DSN set, source maps upload, release/env tags, PII scrubbing
- [ ] Deliberate client + server error both land; `[billing]` logs searchable
- [ ] Uptime check on the domain and the webhook; someone on call

## Performance

- [ ] TTFB and cold start on dashboard/search against prod data volume
- [ ] Lighthouse on landing, dashboard, property detail; Leaflet lazily loaded
- [ ] 120s `unstable_cache` acceptable for auction dates; Supabase load under concurrent search

## UX & devices

- [ ] Mobile/tablet/desktop; Safari, Chrome, Firefox, iOS, Android
- [ ] Dark mode on every page and report; no theme flash
- [ ] Keyboard nav, focus, contrast, alt text, form labels

## Launch

- [ ] CI green; prod build with prod env; `NEXT_PUBLIC_SUPABASE_URL` matches `SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SITE_URL` = production domain
- [ ] DNS, HTTPS, www → apex; Supabase backups + PITR + migrations applied
- [ ] Staging smoke test; rollback rehearsed; support channel live
- [ ] Watch window: error rate, 429s, search cost, checkout conversion
