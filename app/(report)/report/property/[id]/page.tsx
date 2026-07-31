import { notFound } from "next/navigation";
import AutoPrint from "@/app/(report)/_components/AutoPrint";
import ReportDenied from "@/app/(report)/_components/ReportDenied";
import ReportShell from "@/app/(report)/_components/ReportShell";
import PriceHistory from "@/app/(app)/property/[id]/_components/PriceHistory";
import PropertyRanks from "@/app/(app)/property/[id]/_components/PropertyRanks";
import ScoreBreakdown from "@/app/(app)/property/[id]/_components/ScoreBreakdown";
import PropertyMarket from "@/components/market/PropertyMarket";
import RegionScoreBars from "@/components/region/RegionScoreBars";
import {
  getMarketComparables,
  getPriceHistory,
  getPropertyById,
  getPropertyPois,
  getRegion,
  getScoreExplain,
} from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";
import { fmtDay, fmtDist, money, SCORE_LABEL } from "@/lib/format";
import { MAX_NEAR_M, POI_LABEL, POI_ORDER } from "@/lib/pois";
import type { Scores } from "@/lib/types";

export const dynamic = "force-dynamic"; // getEntitlements reads cookies

export const metadata = { title: "Relatório · Ficha do imóvel" };

export default async function PropertyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const ent = await getEntitlements();
  if (!ent.can("export")) return <ReportDenied />;

  const { id } = await params;
  const p = await getPropertyById(id);
  if (!p) notFound();

  // Awaited together, never streamed: a Suspense boundary here would let AutoPrint fire while
  // skeletons were still on screen.
  const [explain, history, region, market, pois] = await Promise.all([
    getScoreExplain(p.id),
    getPriceHistory(p.id),
    p.h3 ? getRegion(p.h3) : Promise.resolve(null),
    getMarketComparables(p.uf, p.city, p.neighborhood, p.propertyType, p.area),
    getPropertyPois(p.id),
  ]);

  const nearest: Record<string, number> = {};
  for (const poi of pois) {
    if (nearest[poi.category] == null || poi.distance < nearest[poi.category]) {
      nearest[poi.category] = poi.distance;
    }
  }
  const nearRows = POI_ORDER.filter((c) => nearest[c] != null && nearest[c] <= MAX_NEAR_M);

  const scoreRows = (Object.entries(p.scores) as [keyof Scores, number | null][])
    .filter((e): e is [keyof Scores, number] => e[1] != null)
    .sort((a, b) => b[1] - a[1]);

  return (
    <ReportShell
      title={p.title}
      subtitle={`${p.neighborhood ? `${p.neighborhood} · ` : ""}${p.city}/${p.uf} · Matrícula ${p.id}`}
      generatedAt={new Date()}
    >
      <section className="report-section">
        <div className="statgrid">
          <div className="stat">
            <div className="k">Valor de venda</div>
            <div className="v accent">{money(p.saleValue)}</div>
            {p.discount != null && <div className="s">{Math.round(p.discount)}% de deságio</div>}
          </div>
          <div className="stat">
            <div className="k">Valor de avaliação</div>
            <div className="v">{money(p.appraisedValue)}</div>
          </div>
          <div className="stat">
            <div className="k">Área</div>
            <div className="v">{p.area != null ? `${p.area} m²` : "-"}</div>
            <div className="s">
              {p.bedrooms != null ? `${p.bedrooms} dorm.` : "dormitórios não informados"}
            </div>
          </div>
          <div className="stat">
            <div className="k">Leilão</div>
            <div className="v">{p.auctionDate ? fmtDay(p.auctionDate) : "-"}</div>
            <div className="s">{p.modality ?? "modalidade não informada"}</div>
          </div>
        </div>
      </section>

      <section className="report-section">
        <h2>Ficha</h2>
        <div className="card pad">
          <div className="rtable">
            <div className="rtrow">
              <div>Endereço</div>
              <div className="num">{p.rawAddress ?? "-"}</div>
            </div>
            <div className="rtrow">
              <div>Ocupação</div>
              <div className="num">{p.occupancyStatus ?? "-"}</div>
            </div>
            <div className="rtrow">
              <div>Condomínio</div>
              <div className="num">{p.condoPaymentRule ?? "-"}</div>
            </div>
            <div className="rtrow">
              <div>IPTU e tributos</div>
              <div className="num">{p.taxPaymentRule ?? "-"}</div>
            </div>
            <div className="rtrow">
              <div>Formas de pagamento</div>
              <div className="num">
                {[p.acceptsFinancing && "financiamento", p.acceptsFgts && "FGTS"]
                  .filter(Boolean)
                  .join(" · ") || "somente à vista"}
              </div>
            </div>
            {p.link && (
              <div className="rtrow">
                <div>Anúncio</div>
                <div className="num">{p.link}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="report-section">
        <h2>Notas</h2>
        <PropertyRanks p={p} />
        <div className="dna">
          {scoreRows.map(([k, v]) => (
            <div className={`sb${v < 55 ? " dim" : ""}`} key={k}>
              <div className="top">
                <span className="name">{SCORE_LABEL[k]}</span>
                <span className="num">{Math.round(v)}</span>
              </div>
              <div className="track">
                <i style={{ width: `${Math.round(v)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Tese de investimento</h2>
        <ScoreBreakdown p={p} explain={explain} />
      </section>

      {history.length >= 2 && (
        <section className="report-section">
          <PriceHistory points={history} />
        </section>
      )}

      {market && (
        <section className="report-section">
          <PropertyMarket
            stats={market}
            lance={p.saleValue}
            area={p.area}
            appraised={p.appraisedValue}
          />
        </section>
      )}

      {region && (
        <section className="report-section">
          <h2>A região: {region.name}</h2>
          <p className="report-sub">
            {region.city} · {region.numProps} {region.numProps === 1 ? "imóvel" : "imóveis"} em
            leilão · região {region.h3}
          </p>
          <RegionScoreBars region={region} />
        </section>
      )}

      {nearRows.length > 0 && (
        <section className="report-section">
          <h2>Lugares próximos</h2>
          <div className="report-rows">
            {nearRows.map((c) => (
              <div className="report-row" key={c}>
                <div>
                  <b>{POI_LABEL[c] ?? c}</b>
                </div>
                <div className="val">{fmtDist(nearest[c])}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AutoPrint />
    </ReportShell>
  );
}
