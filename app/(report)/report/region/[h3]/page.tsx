import { notFound } from "next/navigation";
import AutoPrint from "@/app/(report)/_components/AutoPrint";
import ReportDenied from "@/app/(report)/_components/ReportDenied";
import ReportShell from "@/app/(report)/_components/ReportShell";
import ReportPropertyRow from "@/components/export/ReportPropertyRow";
import DnaStars from "@/app/(app)/regions/[h3]/_components/DnaStars";
import InfraGrid from "@/app/(app)/regions/[h3]/_components/InfraGrid";
import PoiNearGrid from "@/components/region/PoiNearGrid";
import RegionHighlights from "@/components/region/RegionHighlights";
import RegionScoreBars from "@/components/region/RegionScoreBars";
import RegionMarket from "@/components/market/RegionMarket";
import { getMarketStatsForCity, getPropertiesPage, getRegion, getRegionPois } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";
import { hasReliableMarket, statsForRegion } from "@/lib/market";
import { regionHighlights } from "@/lib/pois";
import { regionTags } from "@/lib/region";

// The listing table is capped so the report stays a report; the region page itself already reads
// 500 rows through the cached loader, and this reuses that exact call.
const REPORT_LISTINGS = 40;

export const dynamic = "force-dynamic"; // getEntitlements reads cookies

export const metadata = { title: "Relatório · Região" };

export default async function RegionReportPage({ params }: { params: Promise<{ h3: string }> }) {
  const ent = await getEntitlements();
  if (!ent.can("export")) return <ReportDenied />;

  const { h3 } = await params;
  const [region, cellPage, cellPois] = await Promise.all([
    getRegion(h3),
    getPropertiesPage({ filters: { h3 }, sort: "leilao", pageSize: 500 }),
    getRegionPois(h3),
  ]);
  if (!region) notFound();

  const here = cellPage.items;
  const tags = regionTags(region);
  const marketStats = await getMarketStatsForCity(region.city);
  const market = statsForRegion(marketStats, region).filter(hasReliableMarket);
  const highlights = regionHighlights(cellPois);

  return (
    <ReportShell
      title={`Região: ${region.name}`}
      subtitle={`${region.city} · ${here.length} ${
        here.length === 1 ? "imóvel" : "imóveis"
      } em leilão · célula ${region.h3}`}
      filters={tags.length ? tags.join(" · ") : null}
      generatedAt={new Date()}
    >
      <section className="report-section">
        <h2>Perfil da região</h2>
        <RegionScoreBars region={region} />
      </section>

      <section className="report-section">
        <h2>DNA do bairro</h2>
        <DnaStars region={region} />
      </section>

      <section className="report-section">
        <h2>Infraestrutura</h2>
        <InfraGrid region={region} />
      </section>

      <section className="report-section">
        <h2>O que existe por perto</h2>
        <PoiNearGrid nearest={region.nearest} />
        <RegionHighlights pois={highlights} />
      </section>

      {market.length > 0 && (
        <section className="report-section">
          <h2>Preços de mercado</h2>
          <RegionMarket stats={market} />
        </section>
      )}

      {here.length > 0 && (
        <section className="report-section">
          <h2>Imóveis em leilão nesta região</h2>
          <div className="report-rows">
            {here.slice(0, REPORT_LISTINGS).map((p) => (
              <ReportPropertyRow key={p.id} p={p} />
            ))}
          </div>
          {here.length > REPORT_LISTINGS && (
            <p className="report-when">
              Mostrando {REPORT_LISTINGS} dos {here.length} imóveis desta região.
            </p>
          )}
        </section>
      )}

      <AutoPrint />
    </ReportShell>
  );
}
