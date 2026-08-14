import { Suspense } from "react";
import Link from "next/link";
import SeoLinks from "@/components/seo/SeoLinks";

export const metadata = { title: "Página não encontrada" };

// Reached often on purpose: property/[id] calls notFound() whenever a listing is withdrawn, which
// on a base this size is a steady trickle of crawler hits. The link block recycles that budget.
export default function NotFound() {
  return (
    <main className="nf">
      <h1>Página não encontrada</h1>
      <p>
        O conteúdo que você procura não existe, saiu do ar ou já foi arrematado. A oferta da Caixa
        muda todo dia — abaixo estão os caminhos mais usados.
      </p>
      <div className="nf-actions">
        <Link className="btn solid" href="/leilao-de-imoveis">
          Ver leilões da Caixa
        </Link>
        <Link className="btn" href="/properties">
          Buscar imóveis
        </Link>
        <Link className="btn" href="/">
          Voltar ao início
        </Link>
      </div>
      {/* Streamed: a 404 is served to crawlers by the thousand and must not wait on the DB. */}
      <Suspense fallback={null}>
        <SeoLinks />
      </Suspense>
    </main>
  );
}
