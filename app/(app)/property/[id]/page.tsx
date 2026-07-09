import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import SaveButton from "./_components/SaveButton";
import ScoreBars from "./_components/ScoreBars";
import PriceHistory from "./_components/PriceHistory";
import ScoreBreakdown from "./_components/ScoreBreakdown";
import VisualScore from "./_components/VisualScore";
import NearbyPois from "./_components/NearbyPois";
import PropertyRanks from "./_components/PropertyRanks";
import RegionPanel from "@/components/region/RegionPanel";
import PropertyMarket from "@/components/market/PropertyMarket";
import MarketHistory from "@/components/market/MarketHistory";
import SimilarCarousel, { type RecItem } from "@/components/property/SimilarCarousel";
import Ring from "@/components/ui/Ring";
import {
  getMarketHistory,
  getMarketStats,
  getPois,
  getPriceHistory,
  getProperties,
  getProperty,
  getPropertyPois,
  getRecommendations,
  getRegion,
} from "@/lib/data";
import { addressKey } from "@/lib/market";
import { nearbyPois } from "@/lib/pois";
import {
  discountPercentile,
  fmtDate,
  money,
  PROFILE_EXPLAIN,
  PROFILE_LABEL,
  showDiscount,
} from "@/lib/format";
import { statsForProperty } from "@/lib/market";
import { IconBack } from "@/lib/icons";

export const revalidate = 120;

export async function generateStaticParams() {
  const all = await getProperties();
  return all.map((p) => ({ id: p.id }));
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();

  const [all, region, marketStats, priceHistory, pois, marketHistory, recs, propertyPois] =
    await Promise.all([
      getProperties(),
      p.h3 ? getRegion(p.h3) : Promise.resolve(null),
      getMarketStats(),
      getPriceHistory(p.id),
      p.lat != null && p.lon != null ? getPois() : Promise.resolve([]),
      getMarketHistory(addressKey(p.uf, p.city, p.neighborhood, p.propertyType)),
      getRecommendations(p.id),
      getPropertyPois(p.id),
    ]);
  const market = statsForProperty(marketStats, p);
  const nearby =
    p.lat != null && p.lon != null ? nearbyPois(pois, p.lat, p.lon, { radius: 2500 }) : [];

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

  const data = fmtDate(p.auctionDate);
  const discPct = showDiscount(p) ? discountPercentile(all, p) : null;

  return (
    <section className="view">
      <Link href="/properties" className="backbtn">
        <IconBack width={18} height={18} strokeWidth={2} /> Voltar
      </Link>

      <div className="dhead">
        <div className="loc">
          {p.propertyType}
          {p.occupancyStatus ? ` · ${p.occupancyStatus}` : ""}
        </div>
        <h1>
          {p.title} — {p.neighborhood}
        </h1>
        <div className="loc">
          {p.city}/{p.uf}
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
            <h3>Nota por objetivo de investimento</h3>
            {p.scores.investment != null && (
              <div className="investhead">
                <Ring value={p.scores.investment} size={66} />
                <div>
                  <div className="ih-k">Nota geral de investimento</div>
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
                <b>{PROFILE_LABEL[p.profile]}:</b> {PROFILE_EXPLAIN[p.profile]} As notas vão de 0 a
                100 e são calculadas a partir dos dados do imóvel e do bairro.
              </div>
            )}
            <ScoreBreakdown p={p} />
          </div>

          {region && (
            <RegionPanel
              region={region}
              pois={nearby}
              lat={p.lat}
              lon={p.lon}
              title={`${p.title} — ${p.neighborhood}`}
            />
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

          <MarketHistory points={marketHistory} />

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
