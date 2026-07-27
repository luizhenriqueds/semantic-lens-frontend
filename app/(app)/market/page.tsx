import Link from "next/link";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import EmptyState from "@/components/ui/EmptyState";
import { getMarketDashboard, type MarketOpp } from "@/lib/data";
import { fmtDay, money } from "@/lib/format";
import { PROFILE_SHORT, SCORE_LABEL } from "@/lib/format/scores";
import { IconBuilding } from "@/lib/icons";
import type { ProfileKey, Scores } from "@/lib/types";

const int = (n: number) => Math.round(n).toLocaleString("pt-BR");
const pct = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";

// Compact BRL for headline sums: R$ 6,13 bi / R$ 212,8 mi / R$ 45 mil.
function moneyBi(n: number): string {
  if (n >= 1e9)
    return (
      "R$ " +
      (n / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
      " bi"
    );
  if (n >= 1e6)
    return (
      "R$ " +
      (n / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) +
      " mi"
    );
  if (n >= 1e3) return "R$ " + Math.round(n / 1e3).toLocaleString("pt-BR") + " mil";
  return money(n);
}

const DONUT_COLORS = ["var(--primary)", "var(--primary-soft)", "#8AA57C", "var(--line)"];

function Donut({
  size,
  slices,
}: {
  size: number;
  slices: { label: string; n: number; color?: string }[];
}) {
  const total = slices.reduce((s, d) => s + d.n, 0) || 1;
  let off = 25; // start at 12 o'clock
  return (
    <div className="donutwrap">
      <svg className="donut" width={size} height={size} viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--surface-2)" strokeWidth="6" />
        {slices.map((d, i) => {
          const len = (d.n / total) * 100;
          const dashoffset = off;
          off -= len;
          return (
            <circle
              key={d.label}
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke={d.color ?? DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth="6"
              strokeDasharray={`${len} ${100 - len}`}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </svg>
      <div className="legend">
        {slices.map((d, i) => (
          <div className="row" key={d.label}>
            <i style={{ background: d.color ?? DONUT_COLORS[i % DONUT_COLORS.length] }} />
            {d.label}
            <span className="n">{int(d.n)}</span>
            <span className="p">{pct((d.n / total) * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColBars({
  arr,
  softIdx = [],
}: {
  arr: { label: string; n: number; sub?: string }[];
  softIdx?: number[];
}) {
  const max = Math.max(...arr.map((d) => d.n), 1);
  return (
    <div className="bars">
      {arr.map((d, i) => (
        <div className="col" key={d.label}>
          <div
            className={`fill${softIdx.includes(i) ? " soft" : ""}`}
            style={{ height: `${Math.max(3, Math.round((d.n / max) * 100))}%` }}
          >
            <span className="cap">{int(d.n)}</span>
          </div>
          <div className="xl">
            {d.label}
            {d.sub && <small>{d.sub}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

function HBars({
  arr,
  total,
}: {
  arr: { key: string; label: React.ReactNode; n: number }[];
  total?: number;
}) {
  const max = Math.max(...arr.map((d) => d.n), 1);
  const sum = total ?? arr.reduce((s, d) => s + d.n, 0);
  return (
    <div className="hbars">
      {arr.map((d) => (
        <div className="hbar" key={d.key}>
          <div className="lb">{d.label}</div>
          <div className="track">
            <i style={{ width: `${Math.round((d.n / max) * 100)}%` }} />
          </div>
          <div className="val">
            {int(d.n)}
            <small> · {pct((d.n / sum) * 100)}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function Ring({ v }: { v: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - v / 100);
  return (
    <svg className="score-ring" viewBox="0 0 46 46">
      <circle cx="23" cy="23" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="4.5" />
      <circle
        cx="23"
        cy="23"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={off}
        transform="rotate(-90 23 23)"
      />
      <text x="23" y="27" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">
        {v}
      </text>
    </svg>
  );
}

function oppTitle(o: MarketOpp): string {
  return o.area_m2 ? `${o.property_type} · ${int(o.area_m2)} m²` : o.property_type;
}

export default async function MarketPage() {
  const d = await getMarketDashboard();

  if (!d) {
    return (
      <section className="view market">
        <EmptyState icon={<IconBuilding />} title="Painel indisponível">
          Os dados do painel de mercado ainda não foram calculados. Tente novamente mais tarde.
        </EmptyState>
      </section>
    );
  }

  const scorePct = (v: number) => Math.round(v);
  const scoredPct = d.kpi.catalogued ? Math.round((d.kpi.available / d.kpi.catalogued) * 100) : 0;

  const dnaRows = (Object.entries(d.dna) as [keyof Scores, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ key: k, label: SCORE_LABEL[k], v }));

  const profRows = (Object.entries(d.prof) as [ProfileKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ key: k, label: PROFILE_SHORT[k], n }));

  const bedRows = [
    { key: "b1", label: "1 dorm.", n: d.beds.b1 },
    { key: "b2", label: "2 dorm.", n: d.beds.b2 },
    { key: "b3", label: "3 dorm.", n: d.beds.b3 },
    { key: "b4plus", label: "4+ dorm.", n: d.beds.b4plus },
  ];

  return (
    <section className="view market">
      <div className="pagehead">
        <h1>Panorama do mercado de leilões</h1>
        <p>
          Uma leitura de <b>{int(d.kpi.available)} imóveis</b> em oferta hoje no Brasil — deságios,
          notas de investimento, onde estão e o que se destaca. Recalculado a cada rodada.
        </p>
        {d.computedAt && <p className="updated">Atualizado em {fmtDay(d.computedAt)}</p>}
      </div>

      {/* KPIs */}
      <div className="statgrid">
        <div className="stat">
          <div className="k">Imóveis disponíveis</div>
          <div className="v">{int(d.kpi.available)}</div>
          <div className="s">
            de {int(d.kpi.catalogued)} catalogados · <b>{scoredPct}% com nota</b>
          </div>
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
          <div className="s">gap entre avaliação e arremate na base</div>
        </div>
      </div>

      {/* Insights */}
      <div className="insights">
        <div className="ins">
          <div className="lab">Oportunidade</div>
          <div className="big">{int(d.insights.discount_50plus)} imóveis</div>
          <p>
            estão com <b>50% ou mais de deságio</b> sobre a avaliação — é onde mora a margem.
          </p>
        </div>
        <div className="ins">
          <div className="lab">Atenção</div>
          <div className="big">{d.insights.occupied_pct}% ocupados</div>
          <p>
            a maioria dos imóveis está <b>ocupada</b>. Considere o custo e o prazo de desocupação
            antes de arrematar.
          </p>
        </div>
        <div className="ins">
          <div className="lab">Pagamento</div>
          <div className="big">{d.insights.fgts_pct}% aceitam FGTS</div>
          <p>
            mas só <b>{d.insights.financing_pct}% aceitam financiamento</b> bancário. Planeje o
            caixa: a maior parte exige pagamento à vista.
          </p>
        </div>
      </div>

      {/* Distributions */}
      <div className="sectitle">
        <h2>Como a base se distribui</h2>
        <span className="hint">{int(d.kpi.available)} imóveis com nota de investimento</span>
      </div>
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
            <span className="k">índice 0–100</span>
          </div>
          <ColBars arr={d.inv} softIdx={[0, 4]} />
        </div>
      </div>

      {/* Top cities */}
      <div className="sectitle">
        <h2>Cidades com mais oferta</h2>
        <Link href="/regions">Ver todas as regiões →</Link>
      </div>
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
            {d.cities.map((c) => (
              <Link
                className="rtrow"
                key={`${c.city}-${c.uf}`}
                href={`/properties?city=${encodeURIComponent(c.city)}`}
              >
                <div className="rg">
                  <b>{c.city}</b>
                  <span>{c.uf}</span>
                </div>
                <div className="num">{int(c.n)}</div>
                <div className="num dim">{c.sale_median != null ? money(c.sale_median) : "—"}</div>
                <div className="num dim">
                  {c.price_m2_median != null ? money(c.price_m2_median) : "—"}
                </div>
                <div className="num">
                  {c.discount_median != null ? `${Math.round(c.discount_median)}%` : "—"}
                </div>
                <div className="num">
                  {c.investment_median != null ? (
                    <>
                      <div>{Math.round(c.investment_median)}</div>
                      <div className="minibar">
                        <i style={{ width: `${Math.round(c.investment_median)}%` }} />
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Geo + type */}
      <div className="grid2 wide">
        <div className="card pad">
          <div className="cardhead">
            <h3>Onde estão os imóveis</h3>
            <span className="k">por estado</span>
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

      {/* Score DNA + profile */}
      <div className="sectitle">
        <h2>Vocação dos imóveis</h2>
        <span className="hint">melhor uso estimado pela nota</span>
      </div>
      <div className="grid2 wide">
        <div className="card pad">
          <div className="cardhead">
            <h3>Nota média do mercado por objetivo</h3>
            <span className="k">média 0–100</span>
          </div>
          <div className="dna">
            {dnaRows.map((r) => (
              <div className={`sb${r.v < 55 ? " dim" : ""}`} key={r.key}>
                <div className="top">
                  <span className="name">{r.label}</span>
                  <span className="num">{scorePct(r.v)}</span>
                </div>
                <div className="track">
                  <i style={{ width: `${scorePct(r.v)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card pad">
          <div className="cardhead">
            <h3>Melhor uso — imóveis classificados</h3>
            <span className="k">perfil dominante</span>
          </div>
          <HBars arr={profRows.map((p) => ({ key: p.key, label: p.label, n: p.n }))} />
        </div>
      </div>

      {/* Calendar + physical profile */}
      <div className="sectitle">
        <h2>Calendário e perfil físico</h2>
      </div>
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
            <div className="t">
              <div className="v">{int(d.timeline.scheduled)}</div>
              <div className="l">agendados</div>
            </div>
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
              { label: "Ocupado", n: d.occ.occupied, color: "var(--primary)" },
              { label: "Desocupado", n: d.occ.vacant, color: "var(--primary-soft)" },
              { label: "Não informado", n: d.occ.unknown, color: "var(--line)" },
            ]}
          />
        </div>
        <div className="card pad">
          <div className="cardhead">
            <h3>Dormitórios</h3>
            <span className="k">imóveis residenciais</span>
          </div>
          <HBars arr={bedRows} />
        </div>
      </div>

      {/* Top opportunities */}
      <div className="sectitle">
        <h2>Destaques da rodada</h2>
        <span className="hint">nota alta + deságio real</span>
      </div>
      <div className="oppgrid">
        {d.opp.map((o) => (
          <Link className="opp" key={o.property_id} href={`/property/${o.property_id}`}>
            <Ring v={Math.round(o.investment ?? 0)} />
            <div className="thumb">
              <PropertyPhoto
                src={o.image ?? null}
                alt={`Foto do imóvel: ${oppTitle(o)}`}
                sizes="64px"
              />
            </div>
            <div className="body">
              <div className="t">{oppTitle(o)}</div>
              <div className="loc">
                {o.city}, {o.uf}
              </div>
              <div className="facts">
                <span>
                  Nota <b>{Math.round(o.investment ?? 0)}</b>
                </span>
                {o.area_m2 != null && (
                  <span>
                    <b>{int(o.area_m2)}</b> m²
                  </span>
                )}
              </div>
            </div>
            <div className="price">
              <div className="now">{o.sale_value != null ? money(o.sale_value) : "—"}</div>
              {o.appraised_value != null && <div className="was">{money(o.appraised_value)}</div>}
              {o.discount != null && <div className="disc">−{Math.round(o.discount)}%</div>}
            </div>
          </Link>
        ))}
      </div>

      <div className="note" style={{ marginTop: 22 }}>
        <b>Metodologia.</b> Base ativa de {int(d.kpi.available)} imóveis com nota calculada (de{" "}
        {int(d.kpi.catalogued)} catalogados). Deságio considera apenas ofertas fora da 1ª praça.
        Medianas são usadas no lugar de médias para não distorcer com imóveis atípicos.
      </div>
    </section>
  );
}
