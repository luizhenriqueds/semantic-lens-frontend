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
- **Client-side alerts & portfolio** — saved searches and favourites live in
  `localStorage` (no auth/backend).

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
- `lib/` — `supabase` client, `data` (cached query + mapping layer), `facets` (query
  parsing), `embed`/`semanticCache` (search), plus `format`, `geo`, `pois`, `region`,
  `icons`, and client `localStore` for alerts/portfolio.

## Themes

Light (default) and dark palettes, toggled from the topbar and persisted to
`localStorage`. Palettes come from the `variant-4-painel` design mock.

## Performance

- Server Components cached with `unstable_cache` (120s revalidate) — most pages are
  prerendered and revalidated; navigations kept warm via `staleTimes`.
- Column-selected queries with transient-failure retries; pagination past PostgREST's
  1000-row cap.
- Minimal client JS; local placeholder images (no external image requests).

## Environment

Set in `.env.local`:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DEEPINFRA_API_KEY=              # embeddings + reranker

# Optional — semantic cache (falls back to no-op if unset)
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
SEMCACHE_ENABLED=true           # or SEMCACHE_SHADOW=true to calibrate
```

## Develop

```bash
npm install
npm run dev      # http://localhost:3000

npm run build    # production build
npm run lint
npm run format   # prettier
```
