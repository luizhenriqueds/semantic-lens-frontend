"use client";

import { useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { money, moneyShort, SCORE_LABEL } from "@/lib/format";
import { moneyM2 } from "@/lib/market";
import type { Property, Scores } from "@/lib/types";
import { IconBuilding } from "@/lib/icons";

const nums = (arr: (number | null)[]) => arr.filter((v): v is number => v != null && !isNaN(v));

function median(v: number[]): number | null {
  return quantile(v, 0.5);
}
function quantile(values: number[], q: number): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
function mean(v: number[]): number | null {
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// Histogram over fixed `edges` (length = bins + 1); last bucket open-ended when its edge is Infinity.
function Histogram({
  values,
  edges,
  fmt,
  tickFmt = fmt,
  unit = "imóveis",
}: {
  values: number[];
  edges: number[];
  fmt: (v: number) => string;
  tickFmt?: (v: number) => string;
  unit?: string;
}) {
  const { bars, max } = useMemo(() => {
    const nb = edges.length - 1;
    const counts = Array.from({ length: nb }, () => 0);
    for (const v of values) {
      let idx = 0;
      while (idx < nb - 1 && v >= edges[idx + 1]) idx++;
      counts[idx]++;
    }
    const max = Math.max(...counts, 1);
    const bars = counts.map((c, i) => ({ c, from: edges[i], to: edges[i + 1] }));
    return { bars, max };
  }, [values, edges]);

  const H = 130;
  const label = (b: { from: number; to: number }) =>
    b.to === Infinity ? `${tickFmt(b.from)}+` : tickFmt(b.from);
  const range = (b: { from: number; to: number }) =>
    b.to === Infinity ? `${fmt(b.from)} ou mais` : `${fmt(b.from)} – ${fmt(b.to)}`;

  return (
    <div className="histo">
      <div className="histo-bars" style={{ height: H }}>
        {bars.map((b, i) => (
          <div key={i} className="histo-bar" title={`${range(b)}: ${b.c} ${unit}`}>
            <span className="hb-count">{b.c || ""}</span>
            <i style={{ height: `${(b.c / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="histo-ticks">
        {bars.map((b, i) => (
          <span key={i}>{label(b)}</span>
        ))}
      </div>
    </div>
  );
}

const PRICE_EDGES = [0, 100_000, 200_000, 300_000, 400_000, 500_000, 750_000, 1_000_000, Infinity];
const DISCOUNT_EDGES = [0, 10, 20, 30, 40, 50, 60, 70, Infinity];

// ── Scatter: area × price, tinted by discount ───────────────────────
function Scatter({ items }: { items: Property[] }) {
  const pts = useMemo(
    () =>
      items
        .filter((p) => p.area != null && p.area > 0 && p.saleValue != null)
        .map((p) => ({ x: p.area!, y: p.saleValue!, d: p.discount ?? 0 })),
    [items],
  );
  if (pts.length < 3) return <div className="anempty">Poucos imóveis com área e preço</div>;

  const W = 300;
  const H = 200;
  const PAD = 8;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const sx = (x: number) => PAD + ((x - xMin) / (xMax - xMin || 1)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD);
  const maxD = Math.max(...pts.map((p) => p.d), 1);

  return (
    <div>
      <svg className="scatter" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Preço por área">
        {pts.map((p, i) => {
          const t = Math.max(0, Math.min(1, p.d / maxD));
          return (
            <circle
              key={i}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={4}
              fill="var(--primary)"
              fillOpacity={0.28 + t * 0.6}
            >
              <title>
                {Math.round(p.x)} m² · {money(p.y)}
                {p.d > 0 ? ` · −${Math.round(p.d)}%` : ""}
              </title>
            </circle>
          );
        })}
      </svg>
      <div className="scatter-axis">
        <span>← menor área · {Math.round(xMin)} m²</span>
        <span>{Math.round(xMax)} m² →</span>
      </div>
      <div className="anlegend">
        <span className="dotlo" /> menor desconto
        <span className="dothi" /> maior desconto
      </div>
    </div>
  );
}

// ── Horizontal ranking bars ─────────────────────────────────────────
function Rank({
  rows,
  fmt,
}: {
  rows: { label: string; value: number; sub?: string }[];
  fmt: (v: number) => string;
}) {
  if (!rows.length) return <div className="anempty">Sem dados</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="rankbars">
      {rows.map((r) => (
        <div className="rankrow" key={r.label}>
          <span className="rk-label" title={r.label}>
            {r.label}
          </span>
          <div className="rk-track">
            <i style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="rk-val">{fmt(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

function topCounts(items: Property[], key: (p: Property) => string, limit = 6) {
  const m = new Map<string, number>();
  for (const p of items) {
    const k = key(p);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export default function PropertiesAnalysis({ items }: { items: Property[] }) {
  const stats = useMemo(() => {
    const prices = nums(items.map((p) => p.saleValue));
    const discounts = nums(items.map((p) => p.discount)).filter((d) => d > 0);
    const areas = nums(items.map((p) => p.area));
    const m2 = nums(
      items.map((p) => (p.area && p.area > 0 && p.saleValue != null ? p.saleValue / p.area : null)),
    );
    // Not profileScore(): it returns a different dimension per property, so averaging it would
    // mix airbnb with commercial with family.
    const invScores = nums(items.map((p) => p.scores.investment));

    const scoreDims: (keyof Scores)[] = [
      "investment",
      "liquidity",
      "flip",
      "airbnb",
      "student",
      "family",
      "commercial",
      "convenience",
    ];
    const scoreAvgs = scoreDims
      .map((d) => ({ dim: d, avg: mean(nums(items.map((p) => p.scores[d]))) }))
      .filter((s) => s.avg != null)
      .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

    return {
      count: items.length,
      prices,
      discounts,
      areas,
      m2,
      medianPrice: median(prices),
      p25: quantile(prices, 0.25),
      p75: quantile(prices, 0.75),
      medianDiscount: median(discounts),
      medianArea: median(areas),
      medianM2: median(m2),
      avgScore: invScores.length ? Math.round(mean(invScores)!) : null,
      scoredCount: invScores.length,
      financing: items.filter((p) => p.acceptsFinancing).length,
      fgts: items.filter((p) => p.acceptsFgts).length,
      scoreAvgs,
      topCities: topCounts(items, (p) => p.city),
      topTypes: topCounts(items, (p) => p.propertyType),
      topHoods: topCounts(items, (p) => (p.neighborhood ? `${p.neighborhood} · ${p.city}` : "")),
    };
  }, [items]);

  if (!items.length) {
    return (
      <EmptyState icon={<IconBuilding />} title="Nada para analisar">
        Ajuste os filtros para ver estatísticas sobre os imóveis selecionados.
      </EmptyState>
    );
  }

  const tiles: { k: string; v: string; s?: string }[] = [
    { k: "Imóveis", v: stats.count.toLocaleString("pt-BR") },
    { k: "Preço mediano", v: moneyShort(stats.medianPrice) },
    {
      k: "Faixa (p25–p75)",
      v:
        stats.p25 != null && stats.p75 != null
          ? `${moneyShort(stats.p25)} – ${moneyShort(stats.p75)}`
          : "—",
    },
    {
      k: "Desconto mediano",
      v: stats.medianDiscount != null ? `−${Math.round(stats.medianDiscount)}%` : "—",
    },
    { k: "Área mediana", v: stats.medianArea != null ? `${Math.round(stats.medianArea)} m²` : "—" },
    { k: "R$/m² mediano", v: moneyM2(stats.medianM2) },
    {
      k: "Nota média",
      v: stats.avgScore != null ? String(stats.avgScore) : "—",
      s:
        stats.avgScore != null
          ? `de investimento · ${stats.scoredCount} com nota`
          : "nenhum imóvel com nota",
    },
    {
      k: "Aceitam financiamento",
      v: `${stats.financing}`,
      s: stats.count ? `${Math.round((stats.financing / stats.count) * 100)}% do total` : undefined,
    },
  ];

  return (
    <div className="anwrap">
      <div className="antiles">
        {tiles.map((t) => (
          <div className="antile" key={t.k}>
            <div className="k">{t.k}</div>
            <div className="v">{t.v}</div>
            {t.s && <div className="s">{t.s}</div>}
          </div>
        ))}
      </div>

      <div className="angrid">
        <div className="ancard">
          <h3>Distribuição de preços</h3>
          <p className="ansub">Quantos imóveis em cada faixa de valor de venda.</p>
          <Histogram
            values={stats.prices}
            edges={PRICE_EDGES}
            fmt={moneyShort}
            tickFmt={(v) =>
              v >= 1_000_000 ? `R$${v / 1_000_000}mi` : `R$${Math.round(v / 1000)}k`
            }
          />
        </div>
        <div className="ancard">
          <h3>Distribuição de descontos</h3>
          <p className="ansub">Percentual de desconto sobre a avaliação.</p>
          <Histogram
            values={stats.discounts}
            edges={DISCOUNT_EDGES}
            fmt={(v) => `${Math.round(v)}%`}
          />
        </div>
      </div>

      <div className="angrid">
        <div className="ancard">
          <h3>Preço × área</h3>
          <p className="ansub">Cada ponto é um imóvel; tons mais fortes têm maior desconto.</p>
          <Scatter items={items} />
        </div>
        <div className="ancard">
          <h3>Nota média por objetivo</h3>
          <p className="ansub">
            Média de cada nota entre os imóveis filtrados. Notas que não se aplicam ao tipo do
            imóvel ficam de fora da média.
          </p>
          <div className="scorebars anscores">
            {stats.scoreAvgs.map((s) => {
              const v = Math.round(s.avg ?? 0);
              return (
                <div className={`sb${v < 55 ? " dim" : ""}`} key={s.dim}>
                  <div className="top">
                    <span className="name">{SCORE_LABEL[s.dim]}</span>
                    <span className="num">{v}</span>
                  </div>
                  <div className="track">
                    <i style={{ width: `${v}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="angrid an3">
        <div className="ancard">
          <h3>Cidades</h3>
          <p className="ansub">Onde estão os imóveis.</p>
          <Rank rows={stats.topCities} fmt={(v) => String(v)} />
        </div>
        <div className="ancard">
          <h3>Tipos de imóvel</h3>
          <p className="ansub">Composição por tipo.</p>
          <Rank rows={stats.topTypes} fmt={(v) => String(v)} />
        </div>
        <div className="ancard">
          <h3>Bairros em destaque</h3>
          <p className="ansub">Maior concentração de imóveis.</p>
          <Rank rows={stats.topHoods} fmt={(v) => String(v)} />
        </div>
      </div>
    </div>
  );
}
