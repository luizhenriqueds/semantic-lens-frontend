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
import UpgradeWall from "@/components/plan/UpgradeWall";
import { getEntitlements } from "@/lib/entitlements/server";
import {
  getMarketStatsForCity,
  getPoisNear,
  getPropertiesPage,
  getRegion,
  getRegionPois,
} from "@/lib/data";
import { centroid, clusterByProximity } from "@/lib/geo";
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

// Caps concurrent POI lookups per region page; smaller stray clusters are dropped first.
const MAX_POI_CLUSTERS = 24;

// Dynamic: the app layout reads the auth cookie, so this route can't be static.
export const dynamic = "force-dynamic";

export default async function RegionPage({ params }: { params: Promise<{ h3: string }> }) {
  const { h3 } = await params;
  const ent = await getEntitlements();
  if (!ent.can("regions")) {
    return (
      <section className="view">
        {/* The region name is behind the paid fetch, so the generic title is all there is. */}
        <div className="pagehead">
          <h1>Regiões</h1>
        </div>
        <UpgradeWall feature="regions" role={ent.role} trial={ent.trial}>
          A leitura completa de cada região: perfil, DNA do bairro, o que existe por perto, preços
          de mercado e regiões semelhantes.
        </UpgradeWall>
      </section>
    );
  }

  const [region, cellPage, cellPois] = await Promise.all([
    getRegion(h3),
    getPropertiesPage({ filters: { h3 }, sort: "leilao", pageSize: 500 }),
    getRegionPois(h3),
  ]);
  if (!region) notFound();

  const highlights = regionHighlights(cellPois);

  // Must match what /properties?h3= lists, which drops inactive listings.
  const here = cellPage.items;
  const tags = regionTags(region);
  const marketStats = await getMarketStatsForCity(region.city);
  const market = statsForRegion(marketStats, region).filter(hasReliableMarket);

  const geo = here.filter((p) => p.lat != null && p.lon != null);
  const center = geo.length > 0 ? centroid(geo) : null;

  // One POI lookup per ~1km sub-cluster, not one for the whole region - a region-wide
  // centroid can land far from any actual property and drag in kilometres-away "nearby" POIs.
  const poiClusters = clusterByProximity(geo)
    .sort((a, b) => b.length - a.length)
    .slice(0, MAX_POI_CLUSTERS);
  const nearbyLists = await Promise.all(
    poiClusters.map((cluster) => {
      const c = centroid(cluster);
      return getPoisNear(c.lat, c.lon, 5000).then((pois) =>
        nearbyPois(pois, c.lat, c.lon, { radius: 3000, limit: 80 }),
      );
    }),
  );
  const seenPoiIds = new Set<number>();
  const nearby = nearbyLists.flat().filter((p) => {
    if (seenPoiIds.has(p.id)) return false;
    seenPoiIds.add(p.id);
    return true;
  });

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
                  <span className="v">{avg(here, field) ?? "-"}</span>
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
