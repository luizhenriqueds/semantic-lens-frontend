import { ImageResponse } from "next/og";
import { loadPropertyById, loadPropertyPhoto } from "@/lib/data";
import { fmtDate, money, showDiscount, titleCase } from "@/lib/format";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";
import type { Property } from "@/lib/types";

export const runtime = "nodejs";
// Paired with the uncached read below, which is what lets this TTL stand. See docs/property-share.md.
export const revalidate = 604_800;
export const alt = `Imóvel de leilão da Caixa no ${SITE_NAME}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Literals: Satori resolves no CSS variables. Mirrors the dark theme.
const BG = "#17181a";
const PANEL = "#222325";
const LINE = "#363739";
const INK = "#e8e9ea";
const INK_SOFT = "#a8abac";
const INK_FAINT = "#74777a";
const GREEN = "#8fb07e";
const GREEN_WASH = "#26302a";

const PHOTO_TIMEOUT_MS = 2500;
const PHOTO_MAX_BYTES = 1_500_000;
// Bounded because next/og emits lossless PNG and WhatsApp drops an oversized card entirely.
// See docs/property-share.md.
const PHOTO_WIDTH = 400;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

// The local Supabase stack serves the bucket over plain http; production is https either way.
const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost)[:/]/;

// Fetched rather than handed to Satori as a URL: a dead photo would throw and 500 the route.
async function embeddablePhoto(src: string | null): Promise<string | null> {
  if (!src || !(src.startsWith("https://") || LOOPBACK.test(src))) return null;
  try {
    const res = await fetch(src, {
      signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS),
      cache: "force-cache",
    });
    const type = (res.headers.get("content-type") ?? "").split(";")[0];
    // A missing photo comes back as a 200 HTML error page, so res.ok is not enough.
    if (!res.ok || !type.startsWith("image/")) {
      console.warn(`[og] photo rejected (${res.status} ${type || "no type"}): ${src}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > PHOTO_MAX_BYTES) {
      console.warn(`[og] photo ${buf.byteLength} bytes, out of range: ${src}`);
      return null;
    }
    return `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
  } catch (err) {
    console.warn(`[og] photo fetch failed: ${src}`, err);
    return null;
  }
}

function Mark({ scale = 1 }: { scale?: number }) {
  return (
    <svg width={48 * scale} height={48 * scale} viewBox="0 0 48 48">
      <rect width="48" height="48" rx="13" fill="#2f5d3a" />
      <g transform="translate(4.8 4.9) scale(0.8)">
        <path
          d="M25 9H15a9 9 0 0 0-9 9v14a9 9 0 0 0 9 9h18a9 9 0 0 0 9-9v-14"
          fill="none"
          stroke="#fbfcfb"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="#fbfcfb">
          <rect x="12.5" y="27" width="5" height="7" rx="2.5" />
          <rect x="21.75" y="22" width="5" height="12" rx="2.5" />
          <rect x="31" y="5" width="5" height="29" rx="2.5" />
        </g>
      </g>
    </svg>
  );
}

function Fallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 24,
        background: BG,
        padding: 72,
      }}
    >
      <Mark scale={1.5} />
      <div style={{ fontSize: 56, color: INK, fontWeight: 700 }}>{SITE_NAME}</div>
      <div style={{ fontSize: 28, color: GREEN }}>{SITE_TAGLINE}</div>
    </div>
  );
}

function Card({ p, photo }: { p: Property; photo: string | null }) {
  const where = p.neighborhood
    ? `${titleCase(p.neighborhood)}, ${titleCase(p.city)}/${p.uf}`
    : `${titleCase(p.city)}/${p.uf}`;

  const facts = [
    p.area ? `${p.area.toLocaleString("pt-BR")} m²` : null,
    p.bedrooms ? `${p.bedrooms} quarto${p.bedrooms > 1 ? "s" : ""}` : null,
    p.parkingSpots ? `${p.parkingSpots} vaga${p.parkingSpots > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const date = fmtDate(p.auctionDate);
  const meta = [p.modality, date ? `leilão em ${date}` : null].filter(Boolean).join(" · ");
  const off = showDiscount(p) ? `−${Math.round(p.discount!)}%` : null;
  // Precomposed into strings: Satori counts a number, or a literal beside an expression, as an
  // element and then demands display:flex on the parent.
  const appraised = p.appraisedValue != null ? `Avaliação ${money(p.appraisedValue)}` : null;
  const note = p.scores.investment != null ? String(Math.round(p.scores.investment)) : null;
  const price = p.saleValue ? money(p.saleValue) : "Consulte";
  const pad = photo ? 56 : 72;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: BG }}>
      {photo && (
        <img
          src={photo}
          alt=""
          width={PHOTO_WIDTH}
          height={size.height}
          style={{ flex: "none", objectFit: "cover" }}
        />
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: pad,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Mark scale={0.92} />
            <div style={{ fontSize: 26, color: INK, fontWeight: 700 }}>{SITE_NAME}</div>
          </div>
          {note && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "12px 20px",
                borderRadius: 16,
                background: PANEL,
                border: `1px solid ${LINE}`,
              }}
            >
              <div style={{ fontSize: 40, color: GREEN, fontWeight: 800 }}>{note}</div>
              <div style={{ fontSize: 15, color: INK_FAINT, letterSpacing: 1 }}>NOTA</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: photo ? 40 : 48,
              color: INK,
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            {clip(p.title, 46)}
          </div>
          <div style={{ fontSize: 26, color: INK_SOFT }}>{clip(where, 40)}</div>
          {facts && <div style={{ fontSize: 24, color: INK_FAINT }}>{facts}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: photo ? 68 : 86, color: INK, fontWeight: 800 }}>{price}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {appraised && <div style={{ fontSize: 22, color: INK_FAINT }}>{appraised}</div>}
            {off && (
              <div
                style={{
                  display: "flex",
                  padding: "6px 16px",
                  borderRadius: 100,
                  background: GREEN_WASH,
                  color: GREEN,
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {off}
              </div>
            )}
          </div>
          {meta && (
            <div style={{ fontSize: 20, color: INK_FAINT, textTransform: "uppercase" }}>
              {clip(meta, 52)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Required, or the route is never cached. See docs/property-share.md.
export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export default async function PropertyOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadPropertyById(id);
  if (!p) return new ImageResponse(<Fallback />, size);
  const photo = await embeddablePhoto(await loadPropertyPhoto(id).catch(() => null));
  return new ImageResponse(<Card p={p} photo={photo} />, size);
}
