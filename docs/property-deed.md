# Matrícula and auctioneer on the detail page

Both come from columns backend migration `0091_auctioneer_and_deed.sql` added to `properties`:
`auctioneer_name`, `deed_path`, `deed_source_url`, `deed_fetched_at`.

## Where they are read

Neither is in `property_list_mv` — that view was built in `0057` and has never been recreated,
and `0091` deliberately left these columns unindexed to keep them out of the table's HOT-blocking
set (which `0092` exists to keep empty). So they are read per-id from the base table.

They ride along on `loadPropertyDetailText` (`lib/data/details.ts`) rather than getting their own
query: that read already selects from `properties` by `property_id` on `DETAIL_REVALIDATE`, so
this costs no extra round trip and stays on the same cache key as the description it sits beside.

## Which deed URL

`deed_source_url` — the PDF still hosted on the Caixa page
(`venda-imoveis.caixa.gov.br/editais/matricula/<UF>/<id>.pdf`).

`deed_path` is the mirrored copy in the `property-deeds` bucket, which `0091` describes as
existing so the app "can serve a matrícula that outlives the listing". Switching to it is the
obvious follow-up — the Caixa URL dies with the listing, and it is a third-party host we do not
control — but the mirror needs a signed-URL or public-bucket decision first, so the source URL is
what ships now.

## Placement

Both are auction paperwork, not property attributes, so neither goes in the `.factgrid`:

- **Matrícula** is a `btn ghost` in the price card's `.cta` stack, after "Ver anúncio original" —
  the column already holds the other outbound links and needs no layout change for a fourth. The
  label says "(PDF)" because the link leaves the site and opens a document.
- **Auctioneer** sits under `.when`, which already carries the modality and auction date. It only
  exists for real auction modalities (1º/2º Leilão), not for Venda Direta or Licitação, so most
  listings will not show it.

Both render only when the column is non-null. Names come back uppercase from the crawl and go
through `titleCase`, which keeps Portuguese connectives lowercase ("Brenno de Figueiredo Porto").
