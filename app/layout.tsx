import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Lavra — Leilões inteligentes",
  description:
    "A primeira busca semântica e geográfica de leilões de imóveis do Brasil. Descreva o que procura e compare milhares de editais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* Property photos are served straight from Caixa; save the handshake. */}
        <link rel="preconnect" href="https://venda-imoveis.caixa.gov.br" />
      </head>
      <body>{children}</body>
    </html>
  );
}
