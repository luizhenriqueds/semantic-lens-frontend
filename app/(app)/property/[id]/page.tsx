import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import BackButton from "./_components/BackButton";
import SaveButton from "./_components/SaveButton";
import ScoreBars from "./_components/ScoreBars";
import VisualScore from "./_components/VisualScore";
import PropertyRanks from "./_components/PropertyRanks";
import Ring from "@/components/ui/Ring";
import {
  BlockSkeleton,
  InlineSkeleton,
  MarketSlot,
  PriceHistorySlot,
  RecommendationsSlot,
  RegionSlot,
  ScoreBreakdownSlot,
  ScoreWeightsSlot,
} from "./_components/sections";
import { getPropertyById, getPropertyDetailText } from "@/lib/data";
import Hint from "@/components/ui/Hint";
import {
  fmtDate,
  fmtDist,
  money,
  PROFILE_LABEL,
  SCORE_EXPLAIN,
  SCORE_FIELD,
  SCORE_GENERAL_EXPLAIN,
  showDiscount,
} from "@/lib/format";

// Dynamic: the app layout reads the auth cookie, so this route can't be static.
export const dynamic = "force-dynamic";

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

  return (
    <section className="view">
      <BackButton />

      <div className="dhead">
        <div className="loc">
          {p.propertyType}
          {p.occupancyStatus ? ` · ${p.occupancyStatus}` : ""}
        </div>
        <h1>{heading}</h1>
        <div className="loc">
          {p.city}/{p.uf}
          {p.centerProximity != null && ` · a ${fmtDist(p.centerProximity)} do centro`}
        </div>
        <div className="matr">
          MATRÍCULA CAIXA {p.id}
          {p.modality ? ` · ${p.modality.toUpperCase()}` : ""}
          {data ? ` · LEILÃO EM ${data.toUpperCase()}` : ""}
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

          <PropertyRanks p={p} />

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
                <b>{PROFILE_LABEL[p.profile]}:</b> {SCORE_EXPLAIN[SCORE_FIELD[p.profile]]} As notas
                vão de 0 a 100 e comparam este imóvel com os outros da mesma cidade.
              </div>
            )}
            <Suspense fallback={<div className="skel" style={{ height: 120, borderRadius: 12 }} />}>
              <ScoreBreakdownSlot p={p} />
            </Suspense>
          </div>

          <Suspense fallback={<BlockSkeleton height={320} />}>
            <RegionSlot p={p} heading={heading} />
          </Suspense>
        </div>

        <div>
          <div className="infoblock pricecard">
            {p.inactive && (
              <div className="inactive-note">
                Anúncio inativo - este imóvel não aparece mais na oferta atual da Caixa.
              </div>
            )}
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
              {data ? ` · leilão em ${data}` : ""}
            </div>
            <div className="cta">
              <SaveButton id={p.id} />
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
            <MarketSlot p={p} />
          </Suspense>

          <div className="infoblock">
            <h3>Sobre o imóvel</h3>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "14.5px", lineHeight: 1.6 }}>
              {p.description ??
                `Imóvel de leilão da Caixa em ${p.neighborhood}, ${p.city}/${p.uf}.`}
              {p.clusterLabel && p.clusterId != null && (
                <>
                  {" "}
                  Faz parte do grupo{" "}
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
        <RecommendationsSlot id={p.id} />
      </Suspense>
    </section>
  );
}
