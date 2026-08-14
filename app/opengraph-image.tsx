import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const alt = `${SITE_NAME} — leilão de imóveis da Caixa com nota de investimento`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// No custom font: shipping a font buffer here costs more than the default typeface is worth.
// The mark is inlined rather than reusing <BrandLogo>: Satori resolves no CSS variables, so the
// component's --brand-tone-* fills would render as currentColor.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#17181a",
        padding: 72,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="72" height="72" viewBox="0 0 48 48">
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, color: "#e8e9ea", fontWeight: 700 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 22, color: "#8fb07e" }}>{SITE_TAGLINE}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 62, color: "#e8e9ea", lineHeight: 1.15, fontWeight: 700 }}>
          Saiba quais leilões valem o lance.
        </div>
        <div style={{ fontSize: 28, color: "#a8abac", lineHeight: 1.4, maxWidth: 900 }}>
          Imóveis da Caixa com desconto e uma Nota de Investimento de 0 a 100 — preço, região e
          revenda, sempre com o porquê.
        </div>
      </div>
    </div>,
    size,
  );
}
