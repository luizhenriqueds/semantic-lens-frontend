import { money } from "@/lib/format";

// Shared by the /market panel and the printable market report, so both read from one set of
// marks. Server components: no state, no handlers, and every fill is either an inline background
// or an SVG stroke, which is what makes them print faithfully.

export const int = (n: number) => Math.round(n).toLocaleString("pt-BR");
export const pct = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";

/** Compact BRL for headline sums: R$ 6,13 bi / R$ 212,8 mi / R$ 45 mil. */
export function moneyBi(n: number): string {
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
export const DONUT_COLORS = [
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

export function Donut({ size, slices }: { size: number; slices: Slice[] }) {
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

export function ColBars({
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

export function HBars({
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
