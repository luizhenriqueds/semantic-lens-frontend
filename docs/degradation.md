# Degrading on a failed read

How the app behaves when Postgres does not answer in time, and why each read degrades the way
it does.

## The failure being handled

Production reads abort at 8 s (`DB_TIMEOUT_MS`, `lib/supabase/dbFetch.ts`). The aborts cluster at
the top of each hour: the backend's `crawl-followups` flow runs at minute :00 of every hour from
08:00 to 23:00 and again 00:00–04:00 (`semantic-lens-batch/prefect.yaml`), and each 26-minute
slice ends with seven `REFRESH MATERIALIZED VIEW CONCURRENTLY` plus seven `VACUUM (ANALYZE)` and
a `pg_prewarm` of the HNSW index, on a connection that deliberately sets no `statement_timeout`.
Against a database already measured at ~70% IOwait during that window
(`semantic-lens-batch` migration `0092`), a normally fast read can cross 8 s.

That is the trigger. The bug worth fixing in this repo is what each caller does about it.

## The rule

A read whose caller cannot tell an empty result from a failed one must fail loudly. `rpcJson`
takes `{ required: true }` and `requiredRows` throws where `rows` returns `[]`.

The reason is `cached()`: it wraps `unstable_cache`, which memoises whatever the loader returns
but stores nothing when the loader throws. So a swallowed failure is not a blip — it is pinned for
the whole revalidate window, and the page keeps serving a confidently wrong empty state long after
the database recovered.

## `property_filter_options`

The one read on `CATALOGUE_REVALIDATE` (6 h), and the reason the filter dropdowns were rendering
their triggers ("Estado: todos") with nothing inside. One timed-out read blanked the catalogue for
six hours, for every visitor. `next.config.ts`'s `staleTimes.dynamic: 120` sat on top of it, which
is why a fresh incognito window sometimes looked healthy.

Two guards, because the RPC can fail in two shapes:

- `{ required: true }` covers the timeout.
- An explicit check that `ufs` is non-empty covers the other one: since backend migration `0101`
  the RPC reads a single-row MV and `COALESCE`s a missing row to empty lists, so an unpopulated
  `property_filter_options_mv` returns HTTP 200 with a well-formed empty catalogue. `required`
  cannot see that.

`loadFilterOptions` also keeps the last good catalogue in module scope, so a warm lambda rides out
a blip on the previous answer instead of failing. Callers then choose:

- `/properties` catches to `null` and shows a note. The list, search and tabs keep working.
- `SeoLinks` catches to `EMPTY_FILTER_OPTIONS` — it renders into every route's payload including
  the 404, so it must never fail a page.
- `search.ts` catches to no cities: facet parsing is an enhancement, not the search.
- The SEO landing and the sitemap deliberately let it throw. A spurious 404 de-indexes a page and
  a truncated sitemap signals mass removal; a 500 is the better failure.

## `auction_calendar`

Same swallow, shorter window (120 s), but a worse-looking symptom: an empty counts map renders a
full month of dead cells under "Nenhum leilão no calendário", so a failed read was indistinguishable
from a filter that genuinely matches no future auctions. Now `{ required: true }`, and
`loadPropertiesView` keeps `counts: null` distinct from `{}` so the view can say the read failed.

`property_list_mv` reads follow the same split: `map` was already `null`-on-failure for this
reason, and `proximity` hides itself because a dozen counts for two charts are never worth the
whole view.

## The RPC behind it

`auction_calendar` was the last RPC still calling `property_list_matched(p_filters)` — a plpgsql
`RETURN QUERY EXECUTE` that cannot be inlined, so all 47 columns of every matching row were
materialised into a tuplestore just to produce a count per date, with the date bound applied after
the function returned. Migrations `0097`, `0100`, `0101` and `0103` each removed that shape from a
sibling RPC (measuring 12 s, 31 s and a statement timeout respectively); `0110` does it here, going
through `property_list_where` and reading two columns.
