import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import BackButton from "./_components/BackButton";
import AvailabilityNote from "./_components/AvailabilityNote";
import CheckedOn from "./_components/CheckedOn";
import InactiveNote from "./_components/InactiveNote";
import SaveButton from "./_components/SaveButton";
import ScoreBars from "./_components/ScoreBars";
import VisualScore from "./_components/VisualScore";
import PropertyRanks from "./_components/PropertyRanks";
import PayCards from "./_components/PayCards";
import Ring from "@/components/ui/Ring";
import {
  PriceHistorySlot,
  RegionSlot,
  ScoreBreakdownSlot,
  ScoreWeightsSlot,
} from "./_components/sections";
import { BlockSkeleton, InlineSkeleton } from "./_components/skeletons";
import MarketSection from "./_components/MarketSection";
import RecommendationsSection from "./_components/RecommendationsSection";
import JsonLd from "@/components/seo/JsonLd";
import { getPropertyById, getPropertyDetailText, isListable } from "@/lib/data";
import { breadcrumbLd, realEstateListingLd } from "@/lib/seo/jsonLd";
import { slugify } from "@/lib/seo/slug";
import Hint from "@/components/ui/Hint";
import {
  fmtDate,
  fmtDist,
  money,
  titleCase,
  PROFILE_LABEL,
  SCORE_EXPLAIN,
  SCORE_FIELD,
  SCORE_GENERAL_EXPLAIN,
  showDiscount,
} from "@/lib/format";
import { addressLine } from "@/lib/geo";
import { IconPin } from "@/lib/icons";

// Cached, which is why this route sits under (public): one sitemap crawl is ~30k requests, and each
// was a full dynamic render. Keep in step with DETAIL_REVALIDATE - next takes the shortest
// revalidate in the tree, so a longer literal here is silently capped by the data reads below.
export const revalidate = 21_600;

export const maxDuration = 20;

// Empty on purpose: 30k listings must not be prerendered at build. It has to exist all the same -
// without it a dynamic segment is served on demand and never written to the cache.
export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // `cached()`, so the page body's own call below is the same read.
  const p = await getPropertyById(id);
  if (!p) return { title: "Imóvel não encontrado", robots: { index: false, follow: false } };

  const city = titleCase(p.city);
  const where = p.neighborhood
    ? `${titleCase(p.neighborhood)}, ${city}/${p.uf}`
    : `${city}/${p.uf}`;
  const price = p.saleValue ? ` por ${money(p.saleValue)}` : "";
  const off = p.discount ? `, ${Math.round(p.discount)}% abaixo da avaliação` : "";
  const size = p.area ? `${p.area.toLocaleString("pt-BR")} m²` : null;
  const rooms = p.bedrooms ? `${p.bedrooms} quarto${p.bedrooms > 1 ? "s" : ""}` : null;
  const note =
    p.scores.investment != null ? ` Nota de Investimento ${p.scores.investment}/100.` : "";

  return {
    title: `${p.title} em ${where} — leilão da Caixa${price}`,
    description: `${p.propertyType} ${[size, rooms].filter(Boolean).join(", ")} em ${where}, ${
      p.modality ?? "leilão"
    } da Caixa${price}${off}.${note} Veja região, comparação de mercado e o porquê da nota.`,
    alternates: { canonical: `/property/${id}` },
    openGraph: {
      url: `/property/${id}`,
      type: "article",
      title: `${p.title} em ${where} — leilão da Caixa${price}`,
      images: p.image ? [p.image] : undefined,
    },
    // Sold and unscored listings stay out of the index.
    robots: { index: isListable(p) && !p.inactive, follow: true },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // The shell blocks only on these two single-row lookups (run concurrently);
  // every other section streams in through the Suspense boundaries below.
  const [base, text] = await Promise.all([getPropertyById(id), getPropertyDetailText(id)]);
  if (!base) notFound();
  const p = { ...base, description: text.description, visualNote: text.visualNote };

  // deriveTitle already appends the neighborhood when there is no bedroom count.
  const heading =
    p.neighborhood && !p.title.endsWith(p.neighborhood)
      ? `${p.title} - ${p.neighborhood}`
      : p.title;

  const data = fmtDate(p.auctionDate);
  const discPct = showDiscount(p) ? p.discountPercentile : null;
  // A property awaiting its first scoring batch still renders; the ranking blocks just stay out.
  const scored = Object.values(p.scores).some((v) => v != null);

  return (
    <section className="view">
      <JsonLd
        data={[
          realEstateListingLd(p),
          breadcrumbLd([
            { name: "Início", path: "/" },
            { name: "Leilão de imóveis", path: "/leilao-de-imoveis" },
            {
              name: titleCase(p.city),
              path: `/leilao-de-imoveis/${slugify(p.city)}-${p.uf.toLowerCase()}`,
            },
            { name: p.title, path: `/property/${p.id}` },
          ]),
        ]}
      />
      <BackButton />

      <div className="dhead">
        <div className="loc">
          {p.propertyType}
          {p.occupancyStatus ? ` · ${p.occupancyStatus}` : ""}
        </div>
        <h1>{heading}</h1>
        {p.rawAddress && (
          <div className="loc">
            <IconPin className="addr-pin" aria-hidden />
            {addressLine(p.rawAddress)}
          </div>
        )}
        <div className="loc">
          {p.city}/{p.uf}
          {p.centerProximity != null && ` · a ${fmtDist(p.centerProximity)} do centro`}
        </div>
        <div className="matr">
          MATRÍCULA CAIXA {p.id}
          {p.modality ? ` · ${p.modality.toUpperCase()}` : ""}
          {data ? (
            ` · LEILÃO EM ${data.toUpperCase()}`
          ) : (
            <CheckedOn id={p.id} initial={text.lastSeen} variant="meta" />
          )}
        </div>
      </div>

      <div className="detailgrid">
        <div>
          <div className="gallery">
            <PropertyPhoto
              src={p.image}
              alt={`Foto do imóvel: ${p.title}`}
              sizes="(max-width: 920px) 100vw, 700px"
            />
            <span className="badge">{p.propertyType}</span>
          </div>

          <VisualScore p={p} />

          <div className="factgrid">
            <div className="f">
              <div className="k">Área útil</div>
              <div className="v">{p.area != null ? `${Math.round(p.area)} m²` : "-"}</div>
            </div>
            <div className="f">
              <div className="k">Quartos</div>
              <div className="v">{p.bedrooms ?? "-"}</div>
            </div>
            <div className="f">
              <div className="k">Vagas</div>
              <div className="v">{p.parkingSpots ?? "-"}</div>
            </div>
            <div className="f">
              <div className="k">Situação</div>
              <div className="v" style={{ fontSize: "15px" }}>
                {p.occupancyStatus ?? "-"}
              </div>
            </div>
          </div>

          <PayCards p={p} />

          <PropertyRanks p={p} />

          {scored && (
            <div className="infoblock">
              <h3 className="h3-hint">
                Nota por objetivo de investimento
                <Hint title="Como ler as notas" align="left">
                  {SCORE_GENERAL_EXPLAIN}
                </Hint>
              </h3>
              {p.scores.investment != null && (
                <div className="investhead">
                  <Ring value={p.scores.investment} size={66} />
                  <div className="ih-body">
                    <div className="ih-k-row">
                      <div className="ih-k">Nota geral de investimento</div>
                      <Suspense fallback={<InlineSkeleton width={86} height={20} />}>
                        <ScoreWeightsSlot id={p.id} />
                      </Suspense>
                    </div>
                    <div className="ih-s">
                      Índice ponderado que combina as notas por objetivo, o desconto e o mercado do
                      bairro em uma única nota de 0 a 100.
                    </div>
                  </div>
                </div>
              )}
              <ScoreBars scores={p.scores} />
              {p.profile && (
                <div className="explain">
                  <b>{PROFILE_LABEL[p.profile]}:</b> {SCORE_EXPLAIN[SCORE_FIELD[p.profile]]} As
                  notas vão de 0 a 100 e comparam este imóvel com os outros da mesma cidade.
                </div>
              )}
              <Suspense
                fallback={<div className="skel" style={{ height: 120, borderRadius: 12 }} />}
              >
                <ScoreBreakdownSlot p={p} />
              </Suspense>
            </div>
          )}

          <Suspense fallback={<BlockSkeleton height={320} />}>
            <RegionSlot p={p} heading={heading} />
          </Suspense>
        </div>

        <div>
          <div className="infoblock pricecard">
            <InactiveNote id={p.id} initial={p.inactive} />
            <div className="now">{money(p.saleValue)}</div>
            {p.appraisedValue != null && (
              <div className="was">Valor de avaliação: {money(p.appraisedValue)}</div>
            )}
            {showDiscount(p) && (
              <div className="discrow">−{Math.round(p.discount!)}% de desconto</div>
            )}
            {discPct != null && discPct >= 50 && (
              <div className="disc-rank">
                Desconto maior que o de <b>{discPct}%</b> dos imóveis acompanhados
              </div>
            )}
            <div className="when">
              {p.modality && <b>{p.modality}</b>}
              {data ? (
                ` · leilão em ${data}`
              ) : (
                <CheckedOn id={p.id} initial={text.lastSeen} variant="inline" />
              )}
            </div>
            {!data && <AvailabilityNote id={p.id} initial={text.lastSeen} />}
            <div className="cta">
              <SaveButton id={p.id} propertyLabel={heading} />
              {p.link && (
                <a
                  className="btn ghost"
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ justifyContent: "center" }}
                >
                  Ver anúncio original
                </a>
              )}
            </div>
          </div>

          <Suspense fallback={<BlockSkeleton height={150} />}>
            <PriceHistorySlot id={p.id} />
          </Suspense>

          <Suspense fallback={<BlockSkeleton height={220} />}>
            <MarketSection id={p.id} />
          </Suspense>

          <div className="infoblock">
            <h3>Sobre o imóvel</h3>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "14.5px", lineHeight: 1.6 }}>
              {p.description ??
                `Imóvel de leilão da Caixa em ${p.neighborhood}, ${p.city}/${p.uf}.`}
              {p.clusterLabel && p.clusterId != null && (
                <>
                  {" "}
                  Faz parte da coleção{" "}
                  <Link className="inlinelink" href={`/properties?cluster_id=${p.clusterId}`}>
                    “{p.clusterLabel}”
                  </Link>
                  .
                </>
              )}
            </p>
          </div>

          {(p.condoPaymentRule || p.taxPaymentRule) && (
            <div className="infoblock">
              <h3>Quem paga as dívidas do imóvel</h3>
              <div className="debtrules">
                {p.condoPaymentRule && (
                  <div className="debtrule">
                    <span className="dr-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 21V9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3" />
                      </svg>
                    </span>
                    <div>
                      <div className="dr-k">Condomínio</div>
                      <p>{p.condoPaymentRule}</p>
                    </div>
                  </div>
                )}
                {p.taxPaymentRule && (
                  <div className="debtrule">
                    <span className="dr-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4" />
                      </svg>
                    </span>
                    <div>
                      <div className="dr-k">IPTU e tributos</div>
                      <p>{p.taxPaymentRule}</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="dr-note">
                Conforme a seção “Regras para pagamento das despesas” do edital da Caixa.
              </p>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <RecommendationsSection id={p.id} />
      </Suspense>
    </section>
  );
}
