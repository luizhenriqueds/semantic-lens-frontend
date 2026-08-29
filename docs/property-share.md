# Sharing a property

`ShareButton` plus the per-property OpenGraph card. Both halves matter: the button starts the
share, the card is what the recipient actually sees.

## The button

An `<a href="https://wa.me/?text=…">`, not a `<button>`. wa.me stays the destination with JS off,
past a popup blocker, and if the handler throws. `navigator.share` is layered on top of it and the
choice is made at click time, not render time — so the server and client markup are identical and
there is no feature-detection state to hydrate.

`navigator.share` needs a secure context and transient activation, which is why it is called
synchronously inside the gesture and never after an `await`. Two rejection paths:

- `AbortError` is the user dismissing the sheet. That is a completed interaction; reopening what
  they just closed is worse than doing nothing.
- Anything else spends the gesture, so `window.open` would be blocked. Navigate with
  `window.location.href` instead.

The URL is built server-side with `abs()` rather than read from `window.location.href`. That pins
the canonical origin and, more importantly, keeps the link query-free: a `?utm_source=whatsapp`
would make WhatsApp treat every share as a new URL and re-scrape a card each time.

Two placements, one component. The price card's `.cta` is the primary one, but `.detailgrid`
collapses to a single column at 920px and the card lands after the entire left column — thousands
of pixels down, on exactly the devices where `navigator.share` exists. So `.dtop` puts a compact
twin next to "Voltar", label hidden below 640px.

## The card

`app/(public)/property/[id]/opengraph-image.tsx`. Before this existed, `og:image` pointed at the
Caixa photo, which is hotlinked and frequently 404s (see the comment in `PropertyPhoto.tsx`), so
the preview was often a bare link.

**The `images` key had to be deleted, not blanked.** Next skips the file convention when the
`openGraph` object merely _has_ an `images` property — the check is
`!source?.openGraph?.hasOwnProperty('images')`, so `images: undefined` still suppresses the card.

**The photo is fetched, not handed to Satori as a URL.** A 404 makes `ImageResponse` throw, which
500s the route and yields no card at all — strictly worse than the unreliable preview it replaces.
So: bounded timeout, reject anything that is not `image/*` (a missing photo comes back as a 200
HTML error page, so `res.ok` is not enough), reject oversized bodies, inline as a data URL, and
fall back to the typographic card on any doubt. `cache: "force-cache"` keeps it to one fetch per
listing per revalidate window.

**The photo is confined to 400px of the 1200px canvas.** `next/og` emits PNG only, and PNG is
lossless, so photographic pixels are expensive. WhatsApp drops the image entirely somewhere around
600 KB, and a full-bleed 1200×630 photo lands past that.

Measured on one real listing, so the lever is known if a card ever crosses the ceiling — though
the returns fall off fast, since the type half's antialiasing is a large share of the total:

| panel width   | PNG    |
| ------------- | ------ |
| 480           | 522 KB |
| 400 (current) | 478 KB |
| 360           | 449 KB |
| 320           | 411 KB |

The typographic variant, with no photo at all, is ~41 KB. Measure with:

```
curl -so /dev/null -w '%{size_download} bytes\n' "<og image url>"
```

**Satori constraints.** No CSS variables — colours are literals mirroring the dark theme so this
card and `app/opengraph-image.tsx` read as siblings. Explicit `display: flex` on any div with more
than one child. Truncation in JS, since `line-clamp` support is unreliable. `backgroundImage`
rather than `<img>`. No custom font: a font buffer is a per-render cost across ~30k listings, and
the built-in face covers Portuguese diacritics.

The one that costs an afternoon: **a number child counts as an element, not text.**
`<div>{score}</div>` with a numeric `score` fails the display:flex check even though it has a
single child, and the error names no component. Same for a literal beside an expression
(`Avaliação {money(v)}`). Every text child in the card is precomposed into a string for this
reason.

**Runtime is `nodejs`, not `edge`**: `getPropertyById` is `cached()` over supabase-js, the same
stack every other server component uses, and Node gives us `Buffer`. Reusing that cached read means
a scraper's separate hit on the image route resolves from the data cache rather than Postgres.

**The middleware matcher needed widening.** Its negative lookahead anchored `opengraph-image` at
position 1, so it excluded the root card but not `/property/<id>/opengraph-image-<hash>` — every
scraper fetch was being charged to the anonymous page rate-limit bucket.

## Verifying

`og:image` resolves absolutely through `metadataBase`, and carries a hash suffix because `(public)`
is a route group — read the real URL out of the tag rather than constructing it:

```
curl -s http://localhost:3000/property/<id> | grep -o '<meta property="og:[^>]*>'
```

Render three ids: one with a live photo, one whose detail page shows the placeholder, and one with
`saleValue`/`discount`/`auctionDate` all null — the third is the layout most likely to overflow.

On a preview deploy, Facebook's Sharing Debugger → "Scrape Again" is the only way to force a
WhatsApp re-fetch; WhatsApp shares Meta's crawler infrastructure and has no purge tool of its own.
Paste into a "Message yourself" chat on both a phone and WhatsApp Web — they fetch from different
places. Slack and Telegram are worth a look too: both explain why they rejected an image, where
WhatsApp fails silently.
