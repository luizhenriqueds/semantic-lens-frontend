import Link from "next/link";
import { getFilterOptions } from "@/lib/data";
import { EMPTY_FILTER_OPTIONS } from "@/lib/types";
import { LANDING_GROUPS, landingsIn } from "@/lib/seo/landings";
import { resolveLandingFilters } from "@/lib/seo/resolve";

/** Internal-link block for the landing footer, every SEO page and the 404. Landings whose
 *  catalogue value is gone from the base are dropped rather than shipped as dead links. */
export default async function SeoLinks({ className = "" }: { className?: string }) {
  // Rendered into every route's payload, so it must never fail the page.
  const options = await getFilterOptions().catch(() => EMPTY_FILTER_OPTIONS);

  const groups = LANDING_GROUPS.map((g) => ({
    ...g,
    items: landingsIn(g.group).filter((l) => resolveLandingFilters(l, options)),
  })).filter((g) => g.items.length);

  if (!groups.length) return null;

  return (
    <nav
      className={`seolinks${className ? ` ${className}` : ""}`}
      aria-label="Leilões de imóveis por estado, cidade, tipo e faixa de preço"
    >
      {groups.map((g) => (
        <div className="seolinks-col" key={g.group}>
          <h2 className="seolinks-h">{g.title}</h2>
          <ul>
            {g.items.map((l) => (
              <li key={l.slug}>
                <Link href={`/leilao-de-imoveis/${l.slug}`}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Link className="seolinks-all" href="/leilao-de-imoveis">
        Ver todos os leilões de imóveis da Caixa
      </Link>
    </nav>
  );
}
