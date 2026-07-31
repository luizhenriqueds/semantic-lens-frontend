import AutoPrint from "@/app/(report)/_components/AutoPrint";
import ReportDenied from "@/app/(report)/_components/ReportDenied";
import ReportShell from "@/app/(report)/_components/ReportShell";
import { ColBars, Donut, DONUT_COLORS, HBars, int, moneyBi, pct } from "@/components/market/charts";
import { getMarketDashboard } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";
import { fmtDay, money } from "@/lib/format";
import { PROFILE_SHORT, SCORE_LABEL } from "@/lib/format/scores";
import type { ProfileKey, Scores } from "@/lib/types";

// The city table is built from divs, not a <table>, so its header cannot repeat across pages.
// Capping it keeps the block on one sheet.
const REPORT_CITIES = 20;

export const dynamic = "force-dynamic"; // getEntitlements reads cookies

export const metadata = { title: "Relatório · Painel de mercado" };

export default async function MarketReportPage() {
  const ent = await getEntitlements();
  if (!ent.can("export")) return <ReportDenied />;

  const d = await getMarketDashboard();
  if (!d) {
    return (
      <div className="report-empty">
        <h1>Painel indisponível</h1>
        <p>Os dados do painel de mercado ainda não foram calculados.</p>
      </div>
    );
  }

  const dnaRows = (Object.entries(d.dna) as [keyof Scores, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ key: k, label: SCORE_LABEL[k], v: Math.round(v) }));

  const profRows = (Object.entries(d.prof) as [ProfileKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ key: k, label: PROFILE_SHORT[k], n }));

  const bedRows = [
    { key: "b1", label: "1 dorm.", n: d.beds.b1 },
    { key: "b2", label: "2 dorm.", n: d.beds.b2 },
    { key: "b3", label: "3 dorm.", n: d.beds.b3 },
    { key: "b4plus", label: "4+ dorm.", n: d.beds.b4plus },
  ].sort((a, b) => b.n - a.n);

  const cities = d.cities.slice(0, REPORT_CITIES);

  return (
    <ReportShell
      title="Panorama do mercado de leilões"
      subtitle={`${int(d.kpi.available)} imóveis em oferta hoje no Brasil${
        d.computedAt ? ` · dados de ${fmtDay(d.computedAt)}` : ""
      }`}
      generatedAt={new Date()}
    >
      {/* ~70 rules in globals.css are scoped under `.market`; without this wrapper every chart
          collapses into a stack of bare numbers. */}
      <div className="market">
        <section className="report-section">
          <div className="statgrid">
            <div className="stat">
              <div className="k">Imóveis disponíveis</div>
              <div className="v">{int(d.kpi.available)}</div>
              <div className="s">de {int(d.kpi.catalogued)} catalogados</div>
            </div>
            <div className="stat">
              <div className="k">Deságio mediano</div>
              <div className="v accent">{pct(d.kpi.discount_median)}</div>
              <div className="s">arremate vs. avaliação oficial</div>
            </div>
            <div className="stat">
              <div className="k">Valor de avaliação</div>
              <div className="v">{moneyBi(d.kpi.appraisal_sum)}</div>
              <div className="s">soma das avaliações oficiais</div>
            </div>
            <div className="stat">
              <div className="k">Diferença de preço total</div>
              <div className="v accent">{moneyBi(d.kpi.price_gap_sum)}</div>
              <div className="s">gap entre avaliação e arremate</div>
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Leitura rápida</h2>
          <div className="insights">
            <div className="ins">
              <div className="lab">Oportunidade</div>
              <div className="big">{int(d.insights.discount_50plus)} imóveis</div>
              <p>
                estão com <b>50% ou mais de deságio</b> sobre a avaliação.
              </p>
            </div>
            <div className="ins">
              <div className="lab">Atenção</div>
              <div className="big">{d.insights.occupied_pct}% ocupados</div>
              <p>considere o custo e o prazo de desocupação antes de arrematar.</p>
            </div>
            <div className="ins">
              <div className="lab">Pagamento</div>
              <div className="big">{d.insights.fgts_pct}% aceitam FGTS</div>
              <p>
                e só <b>{d.insights.financing_pct}%</b> aceitam financiamento bancário.
              </p>
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Como a base se distribui</h2>
          <div className="grid2">
            <div className="card pad">
              <div className="cardhead">
                <h3>Distribuição do deságio</h3>
                <span className="k">% sobre avaliação</span>
              </div>
              <ColBars arr={d.disc} softIdx={[0, 3, 4]} />
            </div>
            <div className="card pad">
              <div className="cardhead">
                <h3>Nota de investimento</h3>
                <span className="k">índice 0-100</span>
              </div>
              <ColBars arr={d.inv} softIdx={[0, 4]} />
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Cidades com mais oferta</h2>
          <div className="card pad">
            <div className="rtable">
              <div className="rthead">
                <div>Cidade</div>
                <div className="num">Imóveis</div>
                <div className="num">Preço mediano</div>
                <div className="num">R$/m²</div>
                <div className="num">Deságio</div>
                <div className="num">Nota</div>
              </div>
              <div>
                {cities.map((c) => (
                  <div className="rtrow" key={`${c.city}-${c.uf}`}>
                    <div className="rg">
                      <b>{c.city}</b>
                      <span>{c.uf}</span>
                    </div>
                    <div className="num">{int(c.n)}</div>
                    <div className="num dim">
                      {c.sale_median != null ? money(c.sale_median) : "-"}
                    </div>
                    <div className="num dim">
                      {c.price_m2_median != null ? money(c.price_m2_median) : "-"}
                    </div>
                    <div className="num">
                      {c.discount_median != null ? `${Math.round(c.discount_median)}%` : "-"}
                    </div>
                    <div className="num">
                      {c.investment_median != null ? Math.round(c.investment_median) : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {d.cities.length > cities.length && (
              <p className="report-when">
                Mostrando as {cities.length} cidades com maior oferta, de {d.cities.length}.
              </p>
            )}
          </div>
        </section>

        <section className="report-section">
          <h2>Onde estão e o que são</h2>
          <div className="grid2 wide">
            <div className="card pad">
              <div className="cardhead">
                <h3>Por estado</h3>
              </div>
              <HBars
                arr={d.uf.map((u) => ({ key: u.uf, label: u.uf, n: u.n }))}
                total={d.kpi.available}
              />
            </div>
            <div className="card pad">
              <div className="cardhead">
                <h3>Tipos de imóvel</h3>
                <span className="k">{int(d.kpi.available)}</span>
              </div>
              <Donut size={150} slices={d.types} />
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Vocação dos imóveis</h2>
          <div className="grid2 wide">
            <div className="card pad">
              <div className="cardhead">
                <h3>Nota média por objetivo</h3>
                <span className="k">média 0-100</span>
              </div>
              <div className="dna">
                {dnaRows.map((r) => (
                  <div className={`sb${r.v < 55 ? " dim" : ""}`} key={r.key}>
                    <div className="top">
                      <span className="name">{r.label}</span>
                      <span className="num">{r.v}</span>
                    </div>
                    <div className="track">
                      <i style={{ width: `${r.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card pad">
              <div className="cardhead">
                <h3>Melhor uso</h3>
                <span className="k">perfil dominante</span>
              </div>
              <HBars arr={profRows} />
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Calendário e perfil físico</h2>
          <div className="grid3">
            <div className="card pad">
              <div className="cardhead">
                <h3>Próximos leilões</h3>
              </div>
              <div className="trio">
                <div className="t">
                  <div className="v accent">{int(d.timeline.next7)}</div>
                  <div className="l">nos próximos 7 dias</div>
                </div>
                {d.timeline.scheduled !== d.timeline.next7 && (
                  <div className="t">
                    <div className="v">{int(d.timeline.scheduled)}</div>
                    <div className="l">com data marcada</div>
                  </div>
                )}
                <div className="t">
                  <div className="v">{int(d.timeline.first_auction)}</div>
                  <div className="l">em 1ª praça</div>
                </div>
              </div>
            </div>
            <div className="card pad">
              <div className="cardhead">
                <h3>Situação de ocupação</h3>
              </div>
              <Donut
                size={128}
                slices={[
                  { label: "Ocupado", n: d.occ.occupied, color: DONUT_COLORS[0] },
                  { label: "Desocupado", n: d.occ.vacant, color: DONUT_COLORS[1] },
                  { label: "Não informado", n: d.occ.unknown, color: DONUT_COLORS[3] },
                ]}
              />
            </div>
            <div className="card pad">
              <div className="cardhead">
                <h3>Dormitórios</h3>
                <span className="k">residenciais</span>
              </div>
              <HBars arr={bedRows} />
            </div>
          </div>
        </section>

        <section className="report-section">
          <div className="note">
            <b>Metodologia.</b> Base ativa de {int(d.kpi.available)} imóveis com nota calculada (de{" "}
            {int(d.kpi.catalogued)} catalogados). Deságio considera apenas ofertas fora da 1ª praça.
            Medianas são usadas no lugar de médias para não distorcer com imóveis atípicos.
          </div>
        </section>
      </div>

      <AutoPrint />
    </ReportShell>
  );
}
