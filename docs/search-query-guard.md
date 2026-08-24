# Guarding the search inputs

Status: layers 1, 2 and 4 shipped — `lib/facets/limits.ts` holds the caps, `simplifyFacets` in
`lib/facets/parse.ts` holds the budget. Layer 3 is still a proposal.

## Why

Two text inputs reach the database with no bound on what the user typed:

| Input                                 | Path                                                                  | Reaches                                               |
| ------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| `/search` (`SearchHero`, `TopSearch`) | `hybridSearch` → `canonicalQuery` → `parseFacets` → `runHybridSearch` | `hybrid_search`, `resolve_pois`, `property_list_page` |
| `/properties` free-text box           | `parseQueryTerms` → `toRpcFilters` → `p_filters.q`                    | `property_list_page` (token-AND over `search_text`)   |

Neither caps length, token count, or how many facets a single query may activate. Two
consequences:

**Fan-out.** A query is not one read. Worst case, per branch of `runHybridSearch`:

| Branch                   | Reads                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `centerProximityHits`    | 3 × `countProperties` (`tightestRadius`) + 1 × `getPropertiesPage` = **4**                                                  |
| `categoryProximityHits`  | same = **4**                                                                                                                |
| `poiProximityHits`       | 4 × `resolve_pois` + 1 × `properties_near_pois` + up to 3 × `getPropertiesByIds`, then falls through to the above = **~13** |
| `buildPool` (hybrid arm) | up to 4 × `hybrid_search` + 1 × `getPropertiesByIds` = **5**                                                                |

`DB_MAX_CONCURRENCY` is 8 and `DB_QUEUE_TIMEOUT_MS` is 3000, so a handful of concurrent
POI-shaped queries can hold the whole permit pool. That is the shape behind
`db queue timeout after 3000ms` and, once postgrest starts answering 503, `breaker open`.

**Cache-key explosion.** `cachedSearch` keys on the canonicalised query and `cachedPage` keys on
the serialised filters. An unbounded input means an unbounded key space, so long queries are
always a cold read and never amortise.

**Predicate pile-up on `/properties`.** `property_list_mv.search_text` is only
type + neighborhood + city + uf, and `p_filters.q` is a token-AND over it. Past a handful of tokens
the extra terms cannot narrow anything that is not already zero; they only add predicates to a scan
that runs either way.

## The guard

Four layers, in order of value per unit of risk. Layers 1, 2 and 4 are cheap and self-contained;
layer 3 changes retrieval behaviour and should ship separately.

### Layer 1 — hard input caps (shipped)

`lib/facets/limits.ts`: `MAX_QUERY_CHARS = 120`, `MAX_QUERY_TOKENS = 16`,
`MAX_PROPERTIES_Q_TOKENS = 8`, and `clampQuery()`, which collapses whitespace and trims on a word
boundary. It is idempotent, so the client and server caps cannot split one query across two cache
keys.

- **Client**: `maxLength={MAX_QUERY_CHARS}` on `SearchHero`, `TopSearch` and the `/properties`
  filter box — the only layer the user experiences as a limit rather than as silent truncation.
- **Server, `/search`**: `canonicalQuery()` clamps. It is the single funnel both `hybridSearch` and
  `parseQuery` cross, so one edit covers the `?q=` URL param, alert resolution and the report
  routes. `app/(app)/search/page.tsx` clamps again so the box and the heading show what actually
  ran.
- **Server, `/properties`**: `parsePropertySearchParams` clamps, so the chip and the alert
  description describe the same string that reached the RPC.

Truncation is silent and lossy by design: a 400 on a long query is worse than answering the first
120 characters, which is where the intent is. Measure the live distribution before defending 120 —
if p99 is 60 characters, the cap is free.

### Layer 2 — facet budget (shipped)

`simplifyFacets(f): { facets, dropped }` in `lib/facets/parse.ts`, called once in
`runHybridSearch`. The cost driver is not facet count as such — hard filters all ride one
`p_filters` — it is (a) which retrieval branch runs and (b) how empty the pool gets, because
`buildPool` buys another widening rung each time it comes up short.

So, two rules:

- **One branch.** `poi` > `center` > `goal`; the rest are nulled. Two spatial branches never both
  run, and a `goal` alongside a `poi` was always dead work — the POI branch ranks by distance and
  ignores it, but the deeper `matchCount: 200` pool got built anyway.
- **`MAX_FACETS = 4` hard filters**, in the order `type`, `city`, `priceMax`, `bedroomsMin`,
  `parkingMin`, `bathroomsMin`. Price sits third deliberately: showing results the user cannot
  afford is the worst way to fail.

`dropped` becomes the `fallbackNote` the `.searchnote` slot already renders, so saying so is copy,
not new UI:

> Sua busca tinha critérios demais. Buscamos sem: vagas, banheiros.

Four hard filters is more than any ordinary query carries, which is the point — the existing
`parse.test.ts` fixtures all pass through untouched.

### Layer 3 — bound the fan-out (ship separately)

Only worth doing if layers 1–2 do not flatten the queue-timeout rate:

- `tightestRadius` probes three rungs in parallel. For a query that survived layer 2 with 3+ facets
  the corpus is already narrow, so start at the tightest rung and probe one.
- `buildPool`'s unfiltered widening rung scans the whole corpus. Skip it for any query layer 2
  simplified — it is already wider than what was asked for.
- Scale `POI_FANOUT` (40) down with facet count; cap `nearProximityHits` at two batches.

### Layer 4 — cheap rejection before the expensive hops (shipped)

`searchable()` in `lib/data/search.ts` returns `EMPTY` for a query with fewer than two letters or
no lexical token of length ≥ 2, before any branch, embedding or pool. Deliberately narrow: it
catches `???` and `1234`, not keyboard mash. Telling gibberish from real Portuguese needs a
dictionary, and guessing would reject legitimate searches — mash still runs and lands on the
existing "não encontramos imóveis muito parecidos" note, which is the right answer for it.

## Not shipped

Layer 3 stays a proposal; only worth doing if the above does not flatten the queue-timeout rate:

- `tightestRadius` probes three rungs in parallel. For a query at the facet budget the corpus is
  already narrow, so start at the tightest rung and probe one.
- `buildPool`'s unfiltered widening rung scans the whole corpus. Skip it for any query layer 2
  simplified — it is already wider than what was asked for.
- Scale `POI_FANOUT` (40) down with facet count; cap `nearProximityHits` at two batches.

## Signal to watch

`[db] … queued=`, the permit-queue depth `dbFetch` already logs. It rises before anything times
out, so it is the leading indicator that the caps need tightening.
