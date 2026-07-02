import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import SaveButton from "./_components/SaveButton";
import ScoreBars from "./_components/ScoreBars";
import PoiNearGrid from "@/components/region/PoiNearGrid";
import RegionScoreBars from "@/components/region/RegionScoreBars";
import PropertyMarket from "@/components/market/PropertyMarket";
import { getMarketStats, getProperties, getProperty, getRegion } from "@/lib/data";
import { fmtDate, money, PROFILE_EXPLAIN, PROFILE_LABEL, showDiscount } from "@/lib/format";
import { statsForProperty } from "@/lib/market";
import { IconBack, IconDoc } from "@/lib/icons";

export const revalidate = 120;

export async function generateStaticParams() {
  const all = await getProperties();
  return all.map((p) => ({ id: p.id }));
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();

  const [all, region, marketStats] = await Promise.all([
    getProperties(),
    p.h3 ? getRegion(p.h3) : Promise.resolve(null),
    getMarketStats(),
  ]);
  const market = statsForProperty(marketStats, p);

  const same = all.filter(
    (x) => p.clusterId != null && x.clusterId === p.clusterId && x.id !== p.id,
  );
  const rest = all
    .filter((x) => x.id !== p.id && x.clusterId !== p.clusterId)
    .sort(
      (a, b) =>
        Math.abs((a.saleValue ?? 0) - (p.saleValue ?? 0)) -
        Math.abs((b.saleValue ?? 0) - (p.saleValue ?? 0)),
    );
  const similar = [...same, ...rest].slice(0, 5);
  const data = fmtDate(p.auctionDate);

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

          <div className="infoblock">
            <h3>Nota por objetivo de investimento</h3>
            <ScoreBars scores={p.scores} />
            {p.profile && (
              <div className="explain">
                <b>{PROFILE_LABEL[p.profile]}:</b> {PROFILE_EXPLAIN[p.profile]} As notas vão de 0 a
                100 e são calculadas a partir dos dados do imóvel e do bairro.
              </div>
            )}
          </div>

          {region && (
            <div className="rpanel">
              <div className="rp-top">
                <div>
                  <h3>A região: {region.name}</h3>
                  <div className="where">
                    {region.city} · {region.numProps} imóveis analisados
                  </div>
                </div>
                <Link className="btn ghost" href={`/regions/${region.h3}`}>
                  Ver página da região ›
                </Link>
              </div>
              <RegionScoreBars region={region} />
              <PoiNearGrid region={region} />
              <div className="rnote">Calculado a partir de dados de mapa (OpenStreetMap).</div>
            </div>
          )}
        </div>

        <div>
          <div className="infoblock pricecard">
            <div className="now">{money(p.saleValue)}</div>
            {p.appraisedValue != null && (
              <div className="was">Valor de avaliação: {money(p.appraisedValue)}</div>
            )}
            {showDiscount(p) && (
              <div className="discrow">−{Math.round(p.discount!)}% de desconto</div>
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
              {p.deed && (
                <a className="btn ghost deedlink" href={p.deed} target="_blank" rel="noreferrer">
                  <IconDoc width={18} height={18} strokeWidth={1.7} />
                  Matrícula (PDF)
                </a>
              )}
            </div>
          </div>

          {market && <PropertyMarket stats={market} lance={p.saleValue} area={p.area} />}

          <div className="infoblock">
            <h3>Sobre o imóvel</h3>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "14.5px", lineHeight: 1.6 }}>
              {p.description ??
                `Imóvel de leilão da Caixa em ${p.neighborhood}, ${p.city}/${p.uf}.`}
              {p.clusterLabel && (
                <>
                  {" "}
                  Faz parte do grupo <b style={{ color: "var(--ink)" }}>“{p.clusterLabel}”</b>.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <>
          <div className="sectitle" style={{ marginTop: "26px" }}>
            <h2>Imóveis similares</h2>
          </div>
          <div className="pgrid compact">
            {similar.map((s) => (
              <PropertyCard key={s.id} p={s} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
