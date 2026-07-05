import { money, moneyShort } from "@/lib/format";
import type { MarketHistoryPoint } from "@/lib/types";

const W = 620;
const H = 150;
const PAD = { top: 18, right: 14, bottom: 24, left: 14 };

function fmt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function MarketHistory({ points }: { points: MarketHistoryPoint[] }) {
  const pts = points.filter(
    (p): p is MarketHistoryPoint & { priceMedian: number } => p.priceMedian != null,
  );
  if (pts.length < 2) return null;

  const first = pts[0];
  const last = pts[pts.length - 1];
  const delta = last.priceMedian - first.priceMedian;
  const deltaPct = first.priceMedian > 0 ? Math.round((delta / first.priceMedian) * 100) : 0;
  const up = delta > 0;

  const times = pts.map((p) => new Date(p.date).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const values = pts.map((p) => p.priceMedian);
  let vMin = Math.min(...values);
  let vMax = Math.max(...values);
  if (vMin === vMax) {
    vMin *= 0.95;
    vMax *= 1.05;
  }
  const pad = (vMax - vMin) * 0.18;
  vMin -= pad;
  vMax += pad;

  const x = (t: number) =>
    PAD.left + (tMax === tMin ? 0.5 : (t - tMin) / (tMax - tMin)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - vMin) / (vMax - vMin)) * (H - PAD.top - PAD.bottom);

  const coords = pts.map((p, i) => ({ px: x(times[i]), py: y(p.priceMedian) }));
  const line = coords.map((c) => `${c.px.toFixed(1)},${c.py.toFixed(1)}`).join(" ");
  const stroke = up ? "var(--warn)" : "var(--good)";

  return (
    <div className="infoblock">
      <h3>Mercado ao longo do tempo</h3>
      <div className="phist-head">
        <div>
          <div className="phist-now">{money(last.priceMedian)}</div>
          <div className="phist-sub">preço mediano do bairro · desde {fmt(first.date)}</div>
        </div>
        <div className={`phist-delta${up ? " up" : " down"}`}>
          {up ? "▲" : "▼"} {moneyShort(Math.abs(delta))}
          <span>
            {" "}
            ({deltaPct > 0 ? "+" : ""}
            {deltaPct}%)
          </span>
        </div>
      </div>
      <svg
        className="phist-chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Preço mediano do bairro ao longo do tempo"
      >
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.px}
            cy={c.py}
            r="3.2"
            fill="var(--surface)"
            stroke={stroke}
            strokeWidth="2"
          />
        ))}
        <text x={PAD.left} y={H - 7} textAnchor="start" className="phist-axis">
          {fmt(first.date)}
        </text>
        <text x={W - PAD.right} y={H - 7} textAnchor="end" className="phist-axis">
          {fmt(last.date)}
        </text>
      </svg>
    </div>
  );
}
