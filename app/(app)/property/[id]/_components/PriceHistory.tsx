import { money } from "@/lib/format";
import type { PriceHistoryPoint } from "@/lib/types";

const W = 640;
const H = 200;
const PAD = { top: 24, right: 16, bottom: 28, left: 16 };

function fmt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
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

  return (
    <div className="infoblock">
      <h3>Histórico de preços</h3>
      <div className="phist-head">
        <div>
          <div className="phist-now">{money(last.saleValue)}</div>
          <div className="phist-sub">
            {pts.length} anúncios · desde {fmt(first.date)}
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

      <div className="rnote">
        {stable
          ? "Este imóvel já foi anunciado mais de uma vez pelo mesmo valor de venda."
          : down
            ? "O valor de venda caiu ao longo dos anúncios — imóveis reofertados costumam ter descontos maiores."
            : "O valor de venda subiu entre um anúncio e outro."}
      </div>
    </div>
  );
}
