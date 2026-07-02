import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Lavra — Leilões inteligentes",
  description:
    "A primeira busca semântica e geográfica de leilões de imóveis do Brasil. Descreva o que procura e compare milhares de editais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
