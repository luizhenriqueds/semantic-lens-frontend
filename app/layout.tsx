import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import JsonLd from "@/components/seo/JsonLd";
import { organizationLd, websiteLd } from "@/lib/seo/jsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo/site";
import "@/app/globals.css";

// Self-hosted: the Google stylesheet was a render-blocking third-party request on every load.
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// No canonical or openGraph.url here: metadata is inherited, so a root canonical would make every
// page that does not override it claim to be the homepage. Canonical is always set per route.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "leilão de imóveis",
    "imóveis em leilão",
    "leilão de imóveis Caixa",
    "imóveis Caixa",
    "venda direta Caixa",
    "imóveis abaixo do valor de mercado",
    "leilão de apartamento",
    "leilão de casa",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // icon.svg, apple-icon and opengraph-image are picked up from app/ by file convention.
  formatDetection: { telephone: false },
};

// Next injects width=device-width on its own; this export is for themeColor and the notch inset.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf0ef" },
    { media: "(prefers-color-scheme: dark)", color: "#17181a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* Property photos are served straight from Caixa; save the handshake. */}
        <link rel="preconnect" href="https://venda-imoveis.caixa.gov.br" />
      </head>
      <body>
        <JsonLd data={[organizationLd(), websiteLd()]} />
        {children}
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
