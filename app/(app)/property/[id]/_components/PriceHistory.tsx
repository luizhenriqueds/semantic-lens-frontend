import { money, periodLabel } from "@/lib/format";
import type { PriceHistoryPoint } from "@/lib/types";

const W = 640;
const H = 200;
const PAD = { top: 24, right: 16, bottom: 28, left: 16 };
// Above this many transitions, the middle ones collapse behind a toggle.
const COLLAPSE_ABOVE = 5;

function fmt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

type Transition = { modality: string; date: string; saleValue: number };

function TimelineRow({ t, now }: { t: Transition; now?: boolean }) {
  return (
    <li className={`phist-timeline-item${now ? " now" : ""}`}>
      <span className="phist-timeline-dot" aria-hidden="true" />
      <div className="phist-timeline-body">
        <span className="phist-timeline-label">{t.modality}</span>
        <span className="phist-timeline-meta">
          {fmt(t.date)} · {money(t.saleValue)}
        </span>
      </div>
    </li>
  );
}

// Renders the historical listing price for a property that was published more
// than once. Only shown when there are at least two distinct price points.
export default function PriceHistory({ points }: { points: PriceHistoryPoint[] }) {
  const pts = points.filter(
    (p): p is PriceHistoryPoint & { saleValue: number } => p.saleValue != null,
  );
  if (pts.length < 2) return null;

  const first = pts[0];
  const last = pts[pts.length - 1];
  // Points mark the ends of each interval, so a run can span two of them.
  const states = pts.filter(
    (p, i) => !i || p.saleValue !== pts[i - 1].saleValue || p.modality !== pts[i - 1].modality,
  ).length;
  // The span the chart actually plots - `getPriceHistory` returns the whole history, so a fixed
  // window here would contradict the axis labels below.
  const period = periodLabel(first.date, last.date);
  const delta = last.saleValue - first.saleValue;
  const deltaPct = first.saleValue > 0 ? Math.round((delta / first.saleValue) * 100) : 0;
  const down = delta < 0;
  const stable = delta === 0;

  const times = pts.map((p) => new Date(p.date).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const values = pts.map((p) => p.saleValue);
  let vMin = Math.min(...values);
  let vMax = Math.max(...values);
  if (vMin === vMax) {
    vMin = vMin * 0.95;
    vMax = vMax * 1.05;
  }
  const span = vMax - vMin || 1;
  const padV = span * 0.18;
  vMin -= padV;
  vMax += padV;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + (tMax === tMin ? 0.5 : (t - tMin) / (tMax - tMin)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - vMin) / (vMax - vMin)) * plotH;

  const coords = pts.map((p, i) => ({ px: x(times[i]), py: y(p.saleValue), p }));
  const line = coords.map((c) => `${c.px.toFixed(1)},${c.py.toFixed(1)}`).join(" ");
  const area =
    `M ${coords[0].px.toFixed(1)} ${(H - PAD.bottom).toFixed(1)} ` +
    coords.map((c) => `L ${c.px.toFixed(1)} ${c.py.toFixed(1)}`).join(" ") +
    ` L ${coords[coords.length - 1].px.toFixed(1)} ${(H - PAD.bottom).toFixed(1)} Z`;

  const stroke = stable ? "var(--primary-soft)" : down ? "var(--good)" : "var(--warn)";

  // Distinct modalities in order, keeping the date/price of the announcement that introduced each.
  const transitions = pts.reduce<Transition[]>((acc, p) => {
    if (p.modality && p.modality !== acc[acc.length - 1]?.modality) {
      acc.push({ modality: p.modality, date: p.date, saleValue: p.saleValue });
    }
    return acc;
  }, []);
  const middleTransitions = transitions.slice(1, -1);

  return (
    <div className="infoblock">
      <h3>Histórico de preços</h3>
      <div className="phist-head">
        <div>
          <div className="phist-now">{money(last.saleValue)}</div>
          <div className="phist-sub">
            {states} {states === 1 ? "anúncio" : "anúncios"}
            {period ? ` nos últimos ${period}` : ` · desde ${fmt(first.date)}`}
          </div>
        </div>
        <div className={`phist-delta${stable ? " flat" : down ? " down" : " up"}`}>
          {stable ? (
            "Preço estável"
          ) : (
            <>
              {down ? "▼" : "▲"} {money(Math.abs(delta))}
              <span>
                {" "}
                ({deltaPct > 0 ? "+" : ""}
                {deltaPct}%)
              </span>
            </>
          )}
        </div>
      </div>

      <svg
        className="phist-chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico do histórico de preços"
      >
        <defs>
          <linearGradient id="phistfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#phistfill)" />
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => {
          const isEnd = i === 0 || i === coords.length - 1;
          return (
            <g key={i}>
              <circle
                cx={c.px}
                cy={c.py}
                r={isEnd ? 4.5 : 3}
                fill="var(--surface)"
                stroke={stroke}
                strokeWidth="2.2"
              />
              {isEnd && (
                <text
                  x={Math.min(Math.max(c.px, 30), W - 30)}
                  y={c.py - 11}
                  textAnchor="middle"
                  className="phist-lbl"
                >
                  {money(c.p.saleValue)}
                </text>
              )}
            </g>
          );
        })}
        <text x={PAD.left} y={H - 8} textAnchor="start" className="phist-axis">
          {fmt(first.date)}
        </text>
        <text x={W - PAD.right} y={H - 8} textAnchor="end" className="phist-axis">
          {fmt(last.date)}
        </text>
      </svg>

      {transitions.length > 1 && (
        <div className="phist-mod">
          <span className="phist-mod-lbl">Mudança de modalidade</span>
          <ol className="phist-timeline">
            <TimelineRow t={transitions[0]} />
            {middleTransitions.length > 0 &&
              (transitions.length > COLLAPSE_ABOVE ? (
                <li className="phist-timeline-item phist-timeline-toggle">
                  <details>
                    <summary>
                      <span className="phist-timeline-dot" aria-hidden="true" />
                      <span className="phist-timeline-label">
                        +{middleTransitions.length} mudanças
                      </span>
                      <span className="phist-timeline-chevron" aria-hidden="true" />
                    </summary>
                    <ol className="phist-timeline-nested">
                      {middleTransitions.map((t, i) => (
                        <TimelineRow key={i} t={t} />
                      ))}
                    </ol>
                  </details>
                </li>
              ) : (
                middleTransitions.map((t, i) => <TimelineRow key={i} t={t} />)
              ))}
            <TimelineRow t={transitions[transitions.length - 1]} now />
          </ol>
        </div>
      )}

      <div className="rnote">
        {stable
          ? transitions.length > 1
            ? "Este imóvel foi reanunciado pelo mesmo valor, mas em outra modalidade de venda."
            : "Este imóvel já foi anunciado mais de uma vez pelo mesmo valor de venda."
          : down
            ? "O valor de venda caiu ao longo dos anúncios - imóveis reofertados costumam ter descontos maiores."
            : "O valor de venda subiu entre um anúncio e outro."}
      </div>
    </div>
  );
}
