import Link from "next/link";
import { notFound } from "next/navigation";
import DnaStars from "./_components/DnaStars";
import InfraGrid from "./_components/InfraGrid";
import PoiNearGrid from "@/components/region/PoiNearGrid";
import RegionHighlights from "@/components/region/RegionHighlights";
import RegionMapTabs from "@/components/region/RegionMapTabs";
import SameAddressGroups from "@/components/region/SameAddressGroups";
import RegionScoreBars from "@/components/region/RegionScoreBars";
import RegionMarket from "@/components/market/RegionMarket";
import { getMarketStats, getPoisNear, getProperties, getRegion, getRegionPois } from "@/lib/data";
import { hasReliableMarket, statsForRegion } from "@/lib/market";
import { nearbyPois, regionHighlights } from "@/lib/pois";
import { IconBack, IconPin } from "@/lib/icons";
import { regionTags } from "@/lib/region";
import type { Property } from "@/lib/types";

const MEDIA_ROWS: { field: keyof Property["scores"]; label: string }[] = [
  { field: "liquidity", label: "Liquidez média" },
  { field: "flip", label: "Flip médio" },
  { field: "airbnb", label: "Temporada (média)" },
  { field: "student", label: "Estudantil médio" },
  { field: "family", label: "Familiar médio" },
];

function avg(list: Property[], field: keyof Property["scores"]): number | null {
  const vals = list.map((p) => p.scores[field]).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export const revalidate = 120;

// On-demand ISR rather than prerendering every h3 cell at build.
export async function generateStaticParams() {
  return [];
}

export default async function RegionPage({ params }: { params: Promise<{ h3: string }> }) {
  const { h3 } = await params;
  const [region, all, marketStats, cellPois] = await Promise.all([
    getRegion(h3),
    getProperties(),
    getMarketStats(),
    getRegionPois(h3),
  ]);
  if (!region) notFound();

  const highlights = regionHighlights(cellPois);

  // Must match what /properties?h3= lists, which drops inactive listings.
  const here = all.filter((p) => p.h3 === h3 && !p.inactive);
  const tags = regionTags(region);
  const market = statsForRegion(marketStats, region).filter(hasReliableMarket);

  const geo = here.filter((p) => p.lat != null && p.lon != null);
  const center =
    geo.length > 0
      ? {
          lat: geo.reduce((s, p) => s + p.lat!, 0) / geo.length,
          lon: geo.reduce((s, p) => s + p.lon!, 0) / geo.length,
        }
      : null;
  const nearby = center
    ? nearbyPois(await getPoisNear(center.lat, center.lon, 5000), center.lat, center.lon, {
        radius: 3000,
        limit: 80,
      })
    : [];

  return (
    <section className="view">
      <Link href="/regions" className="backbtn">
        <IconBack width={18} height={18} strokeWidth={2} /> Voltar para regiões
      </Link>

      <div className="rhead">
        <div className="pin">
          <IconPin />
        </div>
        <div className="rh-main">
          <div className="sub">
            {region.city}
            {region.subLabel ? ` · ${region.subLabel}` : ""} · {here.length}{" "}
            {here.length === 1 ? "imóvel" : "imóveis"} em leilão
          </div>
          <h2>{region.name}</h2>
        </div>
        <div className="rh-side">
          <div className="tags">
            <span className="rlabel">Perfil predominante</span>
            {tags.map((t) => (
              <span className="rtag" key={t}>
                {t}
              </span>
            ))}
          </div>
          {here.length > 0 && (
            <Link className="btn solid" href={`/properties?h3=${region.h3}`}>
              Ver {here.length} {here.length > 1 ? "imóveis" : "imóvel"} em leilão aqui
            </Link>
          )}
        </div>
      </div>

      <div className="rgrid">
        <div className="rcard">
          <h3>1. Perfil da região</h3>
          <div className="rcbody">
            <RegionScoreBars region={region} />
          </div>
        </div>
        <div className="rcard">
          <h3>2. O que existe por perto?</h3>
          <div className="rcbody">
            <PoiNearGrid nearest={region.nearest} />
            <div className="rnote">Distância até o serviço mais próximo.</div>
          </div>
        </div>
        <div className="rcard">
          <h3>3. DNA da região</h3>
          <div className="rcbody">
            <DnaStars region={region} />
          </div>
        </div>
      </div>

      {highlights.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="rcard">
            <h3>Estabelecimentos no entorno</h3>
            <div className="rcbody">
              <RegionHighlights pois={highlights} />
            </div>
          </div>
        </div>
      )}

      {center && geo.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="rcard">
            <h3>Mapa da região</h3>
            <div className="rcbody">
              <RegionMapTabs center={center} properties={geo} pois={nearby} />
            </div>
          </div>
        </div>
      )}

      {here.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SameAddressGroups properties={here} />
        </div>
      )}

      {market.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="rcard">
            <h3>Preços de mercado na região</h3>
            <div className="rcbody">
              <RegionMarket stats={market} />
            </div>
          </div>
        </div>
      )}

      <div className="rgrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rcard">
          <h3>Infraestrutura no entorno</h3>
          <div className="rcbody">
            <InfraGrid region={region} />
          </div>
        </div>
        <div className="rcard">
          <h3>Médias dos imóveis na região</h3>
          <div className="rcbody">
            <div className="medias">
              {MEDIA_ROWS.map(({ field, label }) => (
                <div className="media" key={field}>
                  <span className="l">{label}</span>
                  <span className="v">{avg(here, field) ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rgrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="rcard">
          <h3>Regiões semelhantes</h3>
          <div className="rcbody">
            {region.neighbors.length ? (
              <div className="simgrid">
                {region.neighbors.map((n) => {
                  const pct = Math.round(n.similarity * 100);
                  return (
                    <Link className="sim" href={`/regions/${n.h3}`} key={n.h3}>
                      <b>{n.name}</b>
                      <div className="p">{pct}% de semelhança</div>
                      <div className="bar">
                        <i style={{ width: `${pct}%` }} />
                      </div>
                      <span className="simlink">Ver região ›</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="rabout">Sem regiões semelhantes calculadas.</p>
            )}
          </div>
        </div>
        <div className="rcard">
          <h3>Sobre a região</h3>
          <div className="rcbody">
            <p className="rabout">
              {region.summary ??
                `${region.name}, em ${region.city}, com ${here.length} ${
                  here.length === 1 ? "imóvel" : "imóveis"
                } em leilão.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
