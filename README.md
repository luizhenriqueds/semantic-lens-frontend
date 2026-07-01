# Matrícula — Painel de leilões

Next.js (App Router) + React + Tailwind CSS frontend for the property-auction dataset,
implementing the `variant-4-painel` design mock with real data from the local Supabase
stack `semantic-clusters-exp`.

## Data source

Reads server-side from Supabase (`SUPABASE_URL`, service role key) — Studio at
http://127.0.0.1:54423, Data API at http://127.0.0.1:54421. RLS blocks the anon role,
so all reads run on the server with the service key. Set env in `.env.local`.

Tables used: `properties`, `listings`, `property_scores`, `property_profiles`,
`property_clusters`, `clusters`, `region_cells`, `region_scores`, `region_dna`,
`region_features`, `region_neighbors`.

## Structure

- `app/` — routes: home, `buscar`, `imoveis`, `grupos`, `regioes`, `regioes/[h3]`,
  `alertas`, `carteira`, `imovel/[id]`.
- `components/` — shell (sidebar, topbar, theme toggle) and view components.
- `lib/` — `supabase` client, `data` (cached query + mapping layer), formatting,
  search, region helpers, icons.

## Themes

Two palettes: light (`oliva`, default) and dark (`carvao`), toggled via the topbar and
persisted to `localStorage`.

## Performance

- Server Components with `unstable_cache` (120s ISR) — most pages are statically
  prerendered and revalidated.
- Column-selected queries; a single cached read powers the list/search/detail views.
- Minimal client JS; local placeholder images (no external image requests).

## Develop

```bash
npm install
npm run dev
```
