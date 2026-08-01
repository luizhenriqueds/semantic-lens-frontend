# semantic-lens-frontend

Next.js (App Router) + React 19 + Tailwind CSS v4 frontend for the property-auction
dataset. It lets users search, compare and explore thousands of auction properties —
by natural-language query, by region, and by algorithmic groups — with per-goal scores
to surface the best opportunity for each objective.

## Highlights

- **Semantic search** — a Portuguese natural-language query is parsed into hard facets
  (type, city, bedrooms, price) plus soft intent (goal, nearby POI), embedded, and run
  through a hybrid (keyword + vector) retrieval + reranking pipeline.
- **Server-first** — pages are React Server Components reading Supabase with the service
  role key; a single cached read powers the list/detail/region views.
- **Regions & groups** — H3-cell region pages with scores, DNA and infrastructure; and
  algorithmic property clusters.
- **Accounts & plans** — Supabase Auth (e-mail/password, magic link, recovery) behind
  `middleware.ts`. Four tiers (`basic` → `investor` → `professional` / `platform`) with a
  7-day self-serve investor trial; entitlements are enforced server-side in
  `lib/entitlements/server.ts` and backed by RLS plus quota triggers.
- **Alerts & portfolio** — saved searches and favourites persist in Supabase, scoped by
  RLS and capped per plan.

## Stack

Next.js 15 · React 19 · Tailwind CSS v4 · TypeScript · Supabase (Postgres) · Leaflet
maps · DeepInfra (Qwen3 embeddings + reranker) · Upstash Vector (semantic cache).

## Data source

Reads server-side from Supabase using the **service role key** — RLS blocks the anon
role, so all reads run on the server. Backed by the `semantic-clusters-exp` stack
(local Data API on port `54421`; see the memory notes for the stack setup).

Key tables/RPCs: `properties`, `listings`, `pois`, `property_poi`, `property_scores`,
`property_profiles`, `property_clusters`, `clusters`, region tables (`region_cells`,
`region_scores`, `region_dna`, `region_features`, `region_neighbors`), and the
`hybrid_search` / `property_nearest_poi` functions.

## Search pipeline

`lib/data/search.ts` orchestrates it:

1. `parseFacets` splits the query into hard filters and soft intent (goal / POI).
2. `embedQuery` (DeepInfra Qwen3-Embedding) turns the normalized text into a vector.
3. `hybrid_search` RPC returns a candidate pool (keyword + vector), with progressive
   filter relaxation if the pool is too small.
4. Reranking: type-aware neural rerank, per-goal percentile blend, or POI-distance
   blend depending on the parsed intent.
5. `semanticCached` (Upstash Vector) short-circuits near-duplicate queries — supports a
   `shadow` mode that logs hit/match rates without serving, for threshold calibration.

## Structure

- `app/(app)/` — the panel: `dashboard`, `search`, `properties`, `groups`, `regions`,
  `regions/[h3]`, `property/[id]`, `alerts`, `portfolio`. Route-colocated
  `_components/`.
- `app/(marketing)/` — public landing page.
- `app/api/semcache-stats/` — semantic-cache hit-rate endpoint.
- `components/` — shell (sidebar, topbar, theme toggle), plus feature and `ui/`
  components.
- `app/actions/` — server actions: `auth`, `plan`, `alerts`, `favorites`, `export`,
  `settings`, `waitlist`. Each re-checks the session and entitlements server-side.
- `app/(report)/` — print-optimised PDF routes, gated on the `export` feature.
- `lib/` — `supabase` client, `data` (cached query + mapping layer), `facets` (query
  parsing), `embed`/`semanticCache` (search), `entitlements` (plan matrix + server gate),
  `auth` (message + redirect helpers), plus `format`, `geo`, `pois`, `region`, `icons`.

## Themes

Light (default) and dark palettes, toggled from the topbar and persisted to
`localStorage`. Palettes come from the `variant-4-painel` design mock.

## Performance

- Server Components cached with `unstable_cache` (120s revalidate). Most routes are
  dynamic — the app shell reads the auth cookie — so caching happens at the query layer
  rather than the route; navigations are kept warm via `staleTimes`.
- Column-selected queries with transient-failure retries; pagination past PostgREST's
  1000-row cap.
- Minimal client JS; local placeholder images (no external image requests).

## Environment

Copy `.env.example` to `.env.local` and fill it in — it documents every variable the app
reads, which is required and why. Note that Supabase needs **two** pairs: the
`NEXT_PUBLIC_` pair is read by `middleware.ts` and the browser client, the unprefixed pair
by the server-side data layer. Without the `NEXT_PUBLIC_` pair, authentication fails
silently on every route.

```bash
cp .env.example .env.local
```

## Develop

```bash
npm install
npm run dev          # http://localhost:3000

npm run build        # production build
npm run typecheck    # tsc --noEmit
npm test             # vitest (lib/**/*.test.ts)
npm run format       # prettier write; format:check to verify
```

CI runs `format:check`, `typecheck`, `test` and `build` on every pull request.
