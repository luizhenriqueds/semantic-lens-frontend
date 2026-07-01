import type { Metadata } from "next";
import "@/app/globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export const metadata: Metadata = {
  title: "Matrícula — Painel de leilões",
  description:
    "Compare milhares de imóveis de leilão e encontre a melhor oportunidade para o seu objetivo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app">
          <Sidebar />
          <div className="main">
            <Topbar />
            <div className="content">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
