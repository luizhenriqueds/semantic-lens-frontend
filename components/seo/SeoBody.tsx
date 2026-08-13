import Link from "next/link";
import SeoLinks from "./SeoLinks";

const MAX_CRAWLABLE_PAGES = 5;

/** Prose, FAQ and real <a> pagination under the list. The app pager is button-driven, so without
 *  this nothing past page 1 is reachable by a crawler. */
export default function SeoBody({
  slug,
  body,
  faq,
  page,
  totalPages,
}: {
  slug: string;
  body: string[];
  faq: { q: string; a: string }[];
  page: number;
  totalPages: number;
}) {
  const last = Math.min(totalPages, MAX_CRAWLABLE_PAGES);
  const base = `/leilao-de-imoveis/${slug}`;

  return (
    <section className="seobody">
      {last > 1 && (
        <nav className="seobody-pages" aria-label="Páginas de resultados">
          {Array.from({ length: last }, (_, i) => i + 1).map((n) =>
            n === page ? (
              <span aria-current="page" key={n}>
                {n}
              </span>
            ) : (
              <Link href={n === 1 ? base : `${base}?page=${n}`} key={n}>
                {n}
              </Link>
            ),
          )}
        </nav>
      )}

      <div className="seobody-prose">
        {body.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </div>

      {faq.length > 0 && (
        <div className="seobody-faq">
          <h2>Perguntas frequentes</h2>
          {faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      )}

      <SeoLinks className="seolinks-inpage" />
    </section>
  );
}
