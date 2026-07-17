import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import BackButton from "./_components/BackButton";
import SaveButton from "./_components/SaveButton";
import ScoreBars from "./_components/ScoreBars";
import PriceHistory from "./_components/PriceHistory";
import ScoreBreakdown from "./_components/ScoreBreakdown";
import ScoreWeights from "./_components/ScoreWeights";
import VisualScore from "./_components/VisualScore";
import NearbyPois from "./_components/NearbyPois";
import PropertyRanks from "./_components/PropertyRanks";
import RegionPanel from "@/components/region/RegionPanel";
import PropertyMarket from "@/components/market/PropertyMarket";
import SimilarCarousel, { type RecItem } from "@/components/property/SimilarCarousel";
import Ring from "@/components/ui/Ring";
import {
  getMarketComparables,
  getPriceHistory,
  getProperties,
  getProperty,
  getPropertyPois,
  getRecommendations,
  getRegion,
  getScoreExplain,
} from "@/lib/data";
import Hint from "@/components/ui/Hint";
import {
  discountPercentile,
  fmtDate,
  fmtDist,
  money,
  PROFILE_LABEL,
  SCORE_EXPLAIN,
  SCORE_FIELD,
  SCORE_GENERAL_EXPLAIN,
  showDiscount,
} from "@/lib/format";

export const revalidate = 120;

export async function generateStaticParams() {
  const all = await getProperties();
  return all.map((p) => ({ id: p.id }));
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();

  const [all, region, market, priceHistory, recs, propertyPois, scoreExplain] = await Promise.all([
    getProperties(),
    p.h3 ? getRegion(p.h3) : Promise.resolve(null),
    getMarketComparables(p.uf, p.city, p.neighborhood, p.propertyType, p.area),
    getPriceHistory(p.id),
    getRecommendations(p.id),
    getPropertyPois(p.id),
    getScoreExplain(p.id),
  ]);
  const nearby = propertyPois;

  const propById = new Map(all.map((x) => [x.id, x]));
  // Only surface recommendations that are a strong match (≥ 75%).
  const toItems = (kind: "visual" | "similar"): RecItem[] =>
    recs
      .filter((r) => r.kind === kind)
      .map((r) => {
        const rp = propById.get(r.recId);
        if (!rp) return null;
        return { p: rp, match: Math.min(100, Math.round((r.similarity ?? 0) * 100)) };
      })
      .filter((x): x is RecItem => x !== null && x.match >= 75);
  const recVisual = toItems("visual");
  const recSemantic = toItems("similar");

  // deriveTitle already appends the neighborhood when there is no bedroom count.
  const heading =
    p.neighborhood && !p.title.endsWith(p.neighborhood)
      ? `${p.title} — ${p.neighborhood}`
      : p.title;

  const data = fmtDate(p.auctionDate);
  const discPct = showDiscount(p) ? discountPercentile(all, p) : null;

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
              <div className="v">{p.area != null ? `${Math.round(p.area)} m²` : "—"}</div>
            </div>
            <div className="f">
              <div className="k">Quartos</div>
              <div className="v">{p.bedrooms ?? "—"}</div>
            </div>
            <div className="f">
              <div className="k">Vagas</div>
              <div className="v">{p.parkingSpots ?? "—"}</div>
            </div>
            <div className="f">
              <div className="k">Situação</div>
              <div className="v" style={{ fontSize: "15px" }}>
                {p.occupancyStatus ?? "—"}
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
                    {scoreExplain && <ScoreWeights explain={scoreExplain} />}
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
            <ScoreBreakdown p={p} explain={scoreExplain} />
          </div>

          {region && (
            <RegionPanel region={region} pois={nearby} lat={p.lat} lon={p.lon} title={heading} />
          )}

          <NearbyPois pois={propertyPois} />
        </div>

        <div>
          <div className="infoblock pricecard">
            {p.inactive && (
              <div className="inactive-note">
                Anúncio inativo — este imóvel não aparece mais na oferta atual da Caixa.
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

          <PriceHistory points={priceHistory} />

          {market && (
            <PropertyMarket
              stats={market}
              lance={p.saleValue}
              area={p.area}
              appraised={p.appraisedValue}
            />
          )}

          <div className="infoblock">
            <h3>Sobre o imóvel</h3>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "14.5px", lineHeight: 1.6 }}>
              {p.description ??
                `Imóvel de leilão da Caixa em ${p.neighborhood}, ${p.city}/${p.uf}.`}
              {p.clusterLabel && p.clusterId != null && (
                <>
                  {" "}
                  Faz parte do grupo{" "}
                  <Link className="inlinelink" href={`/properties?cluster=${p.clusterId}`}>
                    “{p.clusterLabel}”
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <SimilarCarousel
        title="Mais imóveis como este"
        subtitle="Imóveis com aparência parecida com este."
        items={recVisual}
      />
      <SimilarCarousel
        title="Quem viu este também considerou"
        subtitle="Outras oportunidades parecidas em perfil e preço."
        items={recSemantic}
      />
    </section>
  );
}
