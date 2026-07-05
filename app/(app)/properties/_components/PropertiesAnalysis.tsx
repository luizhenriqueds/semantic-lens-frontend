"use client";

import { useMemo } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { money, moneyShort, profileScore, SCORE_LABEL } from "@/lib/format";
import { propertyAge } from "@/lib/clusterStats";
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

// ── Vertical histogram ──────────────────────────────────────────────
function Histogram({
  values,
  bins = 9,
  fmt,
  unit = "imóveis",
  perBarLabels = false,
}: {
  values: number[];
  bins?: number;
  fmt: (v: number) => string;
  unit?: string;
  perBarLabels?: boolean;
}) {
  const { bars, max } = useMemo(() => {
    if (!values.length) return { bars: [], max: 0 };
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const width = (hi - lo) / bins || 1;
    const counts = Array.from({ length: bins }, () => 0);
    for (const v of values) {
      let idx = Math.floor((v - lo) / width);
      if (idx >= bins) idx = bins - 1;
      if (idx < 0) idx = 0;
      counts[idx]++;
    }
    const max = Math.max(...counts, 1);
    const bars = counts.map((c, i) => ({
      c,
      from: lo + i * width,
      to: lo + (i + 1) * width,
    }));
    return { bars, max };
  }, [values, bins]);

  if (!bars.length) return <div className="anempty">Sem dados</div>;
  const H = 130;

  return (
    <div className="histo">
      <div className="histo-bars" style={{ height: H }}>
        {bars.map((b, i) => (
          <div
            key={i}
            className="histo-bar"
            title={`${fmt(b.from)} – ${fmt(b.to)}: ${b.c} ${unit}`}
          >
            <span className="hb-count">{b.c || ""}</span>
            <i style={{ height: `${(b.c / max) * 100}%` }} />
          </div>
        ))}
      </div>
      {perBarLabels ? (
        <div className="histo-ticks">
          {bars.map((b, i) => (
            <span key={i}>{fmt(b.from)}</span>
          ))}
        </div>
      ) : (
        <div className="histo-axis">
          <span>{fmt(bars[0].from)}</span>
          <span>{fmt(bars[bars.length - 1].to)}</span>
        </div>
      )}
    </div>
  );
}

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
    const pscores = nums(items.map((p) => profileScore(p)));

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

    const ages = nums(items.map((p) => propertyAge(p.yearBuilt)));

    return {
      count: items.length,
      prices,
      discounts,
      areas,
      m2,
      ages,
      medianAge: median(ages),
      medianPrice: median(prices),
      p25: quantile(prices, 0.25),
      p75: quantile(prices, 0.75),
      medianDiscount: median(discounts),
      medianArea: median(areas),
      medianM2: median(m2),
      avgScore: pscores.length ? Math.round(mean(pscores)!) : null,
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
    { k: "Nota média", v: stats.avgScore != null ? String(stats.avgScore) : "—" },
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
          <Histogram values={stats.prices} fmt={moneyShort} bins={8} perBarLabels />
        </div>
        <div className="ancard">
          <h3>Distribuição de descontos</h3>
          <p className="ansub">Percentual de desconto sobre a avaliação.</p>
          <Histogram
            values={stats.discounts}
            fmt={(v) => `${Math.round(v)}%`}
            bins={8}
            perBarLabels
          />
        </div>
      </div>

      {stats.ages.length > 0 && (
        <div className="ancard">
          <h3>Distribuição de idade dos imóveis</h3>
          <p className="ansub">
            Idade estimada pelo ano de construção
            {stats.medianAge != null ? ` · mediana de ${Math.round(stats.medianAge)} anos` : ""}.
          </p>
          <Histogram
            values={stats.ages}
            fmt={(v) => `${Math.round(v)}a`}
            bins={8}
            unit="imóveis"
            perBarLabels
          />
        </div>
      )}

      <div className="angrid">
        <div className="ancard">
          <h3>Preço × área</h3>
          <p className="ansub">Cada ponto é um imóvel; tons mais fortes têm maior desconto.</p>
          <Scatter items={items} />
        </div>
        <div className="ancard">
          <h3>Nota média por objetivo</h3>
          <p className="ansub">Média das notas de investimento do grupo selecionado.</p>
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
