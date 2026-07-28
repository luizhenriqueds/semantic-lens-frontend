import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { getMarketDashboard } from "@/lib/data";
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

// Ordered by size, so the ramp steps lightness rather than hue - adjacent slices have to
// stay apart. Mixed against --surface so it inverts with the theme.
const DONUT_COLORS = [
  "var(--primary)",
  "color-mix(in srgb, var(--primary) 62%, var(--surface))",
  "color-mix(in srgb, var(--primary) 34%, var(--surface))",
  "color-mix(in srgb, var(--ink-faint) 62%, var(--surface))",
  "color-mix(in srgb, var(--ink-faint) 34%, var(--surface))",
  "var(--line)",
];
// Past this, slices are folded into a single "Outros": a 0.1% sliver is unreadable anyway.
const DONUT_MAX_SLICES = 5;
// Blank arc between slices, in % of the circumference.
const DONUT_GAP = 0.8;

type Slice = { label: string; n: number; color?: string };

function foldSmall(slices: Slice[]): Slice[] {
  if (slices.length <= DONUT_MAX_SLICES + 1) return slices;
  const head = slices.slice(0, DONUT_MAX_SLICES);
  const rest = slices.slice(DONUT_MAX_SLICES);
  return [...head, { label: "Outros", n: rest.reduce((s, d) => s + d.n, 0), color: "var(--line)" }];
}

const DONUT_R = 15.9;
// Dashes are path units, not percent: 2πr is 99.9, and rounding it to 100 left a sliver of
// bare track at 12 o'clock that read as a rendering fault.
const DONUT_C = 2 * Math.PI * DONUT_R;
const pathLen = (fraction: number) => fraction * DONUT_C;

function Donut({ size, slices }: { size: number; slices: Slice[] }) {
  const shown = foldSmall([...slices].sort((a, b) => b.n - a.n));
  const total = shown.reduce((s, d) => s + d.n, 0) || 1;
  let off = DONUT_C / 4; // start at 12 o'clock
  return (
    <div className="donutwrap">
      <svg className="donut" width={size} height={size} viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={DONUT_R} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
        {shown.map((d, i) => {
          const len = pathLen(d.n / total);
          const dashoffset = off;
          off -= len;
          // the gap must not swallow a slice whole: tiny ones stay a visible tick
          const arc = Math.max(len > 0 ? 0.6 : 0, len - pathLen(DONUT_GAP / 100));
          return (
            <circle
              key={d.label}
              cx="21"
              cy="21"
              r={DONUT_R}
              fill="none"
              stroke={d.color ?? DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth="6"
              strokeDasharray={`${arc} ${DONUT_C - arc}`}
              strokeDashoffset={dashoffset}
            >
              <title>{`${d.label}: ${int(d.n)} (${pct((d.n / total) * 100)})`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="legend">
        {shown.map((d, i) => (
          <div className="row" key={d.label}>
            <i style={{ background: d.color ?? DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="lb">{d.label}</span>
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

  // Ranked like every other HBars block on the page, not in bedroom order.
  const bedRows = [
    { key: "b1", label: "1 dorm.", n: d.beds.b1 },
    { key: "b2", label: "2 dorm.", n: d.beds.b2 },
    { key: "b3", label: "3 dorm.", n: d.beds.b3 },
    { key: "b4plus", label: "4+ dorm.", n: d.beds.b4plus },
  ].sort((a, b) => b.n - a.n);

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
                <div className="num notacell">
                  {c.investment_median != null ? (
                    <>
                      <div className="minibar">
                        <i style={{ width: `${Math.round(c.investment_median)}%` }} />
                      </div>
                      <span>{Math.round(c.investment_median)}</span>
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
            {/* the MV currently reports `scheduled` equal to `next7`; the same number
                twice reads as a bug, so the tile only shows when it adds information */}
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
              // mid-tone, not a tint: a pale slice reads as a hole in the ring
              { label: "Desocupado", n: d.occ.vacant, color: DONUT_COLORS[1] },
              { label: "Não informado", n: d.occ.unknown, color: DONUT_COLORS[3] },
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

      <div className="note" style={{ marginTop: 22 }}>
        <b>Metodologia.</b> Base ativa de {int(d.kpi.available)} imóveis com nota calculada (de{" "}
        {int(d.kpi.catalogued)} catalogados). Deságio considera apenas ofertas fora da 1ª praça.
        Medianas são usadas no lugar de médias para não distorcer com imóveis atípicos.
      </div>
    </section>
  );
}
