"use client";

import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { fmtBucket, fmtValue, rangeHref, type RangeDim } from "@/lib/facets/range";
import { ANALYSIS_EDGES, type AnalysisData } from "@/lib/facets/analysis";
import { money, moneyShort, SCORE_LABEL } from "@/lib/format";
import { moneyM2 } from "@/lib/market";
import { IconBuilding } from "@/lib/icons";

// Histogram over fixed `edges` (length = bins + 1); last bucket open-ended when its edge is Infinity.
function Histogram({
  counts,
  edges,
  tickFmt,
  unit = "imóveis",
  dim,
  onPick,
}: {
  counts: number[];
  edges: number[];
  tickFmt?: (v: number) => string;
  unit?: string;
  dim: RangeDim;
  onPick: (dim: RangeDim, from: number, to: number) => void;
}) {
  const bars = counts.map((c, i) => ({ c, from: edges[i], to: edges[i + 1] ?? Infinity }));
  const max = Math.max(...counts, 1);
  const H = 130;
  const tick = (v: number) => (tickFmt ? tickFmt(v) : fmtValue(dim, v));

  return (
    <div className="histo">
      <div className="histo-bars" style={{ height: H }}>
        {bars.map((b, i) => {
          const title = `${fmtBucket(dim, b.from, b.to)}: ${b.c} ${unit}`;
          const bar = (
            <>
              <span className="hb-count">{b.c || ""}</span>
              <i style={{ height: `${(b.c / max) * 100}%` }} />
            </>
          );
          return b.c ? (
            <Link
              key={i}
              className="histo-bar link"
              href={rangeHref(dim, b.from, b.to)}
              title={`${title} - ver na lista`}
              prefetch={false}
              onClick={(e) => {
                // Plain clicks filter in place; the href stays real for new-tab/share.
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onPick(dim, b.from, b.to);
              }}
            >
              {bar}
            </Link>
          ) : (
            <div key={i} className="histo-bar" title={title}>
              {bar}
            </div>
          );
        })}
      </div>
      <div className="histo-ticks">
        {bars.map((b, i) => (
          <span key={i}>{b.to === Infinity ? `${tick(b.from)}+` : tick(b.from)}</span>
        ))}
      </div>
    </div>
  );
}

// ── Scatter: area × price, tinted by discount ───────────────────────
function Scatter({ pts }: { pts: { x: number; y: number; d: number }[] }) {
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
  rows: { label: string; value: number }[];
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

export default function PropertiesAnalysis({
  data,
  onPickRange,
}: {
  data: AnalysisData;
  onPickRange: (dim: RangeDim, from: number, to: number) => void;
}) {
  if (!data.count) {
    return (
      <EmptyState icon={<IconBuilding />} title="Nada para analisar">
        Ajuste os filtros para ver estatísticas sobre os imóveis selecionados.
      </EmptyState>
    );
  }

  const tiles: { k: string; v: string; s?: string }[] = [
    { k: "Imóveis", v: data.count.toLocaleString("pt-BR") },
    { k: "Preço mediano", v: moneyShort(data.medianPrice) },
    {
      k: "Faixa (p25-p75)",
      v:
        data.p25Price != null && data.p75Price != null
          ? `${moneyShort(data.p25Price)} - ${moneyShort(data.p75Price)}`
          : "-",
    },
    {
      k: "Desconto mediano",
      v: data.medianDiscount != null ? `−${Math.round(data.medianDiscount)}%` : "-",
    },
    { k: "Área mediana", v: data.medianArea != null ? `${Math.round(data.medianArea)} m²` : "-" },
    { k: "R$/m² mediano", v: moneyM2(data.medianM2) },
    {
      k: "Nota média",
      v: data.avgScore != null ? String(data.avgScore) : "-",
      s:
        data.avgScore != null
          ? `de investimento · ${data.scoredCount} com nota`
          : "nenhum imóvel com nota",
    },
    {
      k: "Aceitam financiamento",
      v: `${data.financing}`,
      s: data.count ? `${Math.round((data.financing / data.count) * 100)}% do total` : undefined,
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
            counts={data.hist.price}
            edges={ANALYSIS_EDGES.price}
            tickFmt={(v) =>
              v >= 1_000_000 ? `R$${v / 1_000_000}mi` : `R$${Math.round(v / 1000)}k`
            }
            dim="price"
            onPick={onPickRange}
          />
        </div>
        <div className="ancard">
          <h3>Distribuição de descontos</h3>
          <p className="ansub">Percentual de desconto sobre a avaliação.</p>
          <Histogram
            counts={data.hist.discount}
            edges={ANALYSIS_EDGES.discount}
            dim="discount"
            onPick={onPickRange}
          />
        </div>
        <div className="ancard">
          <h3>Distribuição de áreas</h3>
          <p className="ansub">Quantos imóveis em cada faixa de área útil.</p>
          <Histogram
            counts={data.hist.area}
            edges={ANALYSIS_EDGES.area}
            tickFmt={(v) => `${Math.round(v)}m²`}
            dim="area"
            onPick={onPickRange}
          />
        </div>
        <div className="ancard">
          <h3>Distribuição de notas</h3>
          <p className="ansub">Nota geral de investimento, de 0 a 100.</p>
          <Histogram
            counts={data.hist.invest}
            edges={ANALYSIS_EDGES.invest}
            dim="invest"
            onPick={onPickRange}
          />
        </div>
      </div>

      <div className="angrid">
        <div className="ancard">
          <h3>Preço × área</h3>
          <p className="ansub">Cada ponto é um imóvel; tons mais fortes têm maior desconto.</p>
          <Scatter pts={data.scatter} />
        </div>
        <div className="ancard">
          <h3>Nota média por objetivo</h3>
          <p className="ansub">
            Média de cada nota entre os imóveis filtrados. Notas que não se aplicam ao tipo do
            imóvel ficam de fora da média.
          </p>
          <div className="scorebars anscores">
            {data.scoreAvgs.map((s) => {
              const v = Math.round(s.avg);
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
          <Rank rows={data.topCities} fmt={(v) => String(v)} />
        </div>
        <div className="ancard">
          <h3>Tipos de imóvel</h3>
          <p className="ansub">Composição por tipo.</p>
          <Rank rows={data.topTypes} fmt={(v) => String(v)} />
        </div>
        <div className="ancard">
          <h3>Bairros em destaque</h3>
          <p className="ansub">Maior concentração de imóveis.</p>
          <Rank rows={data.topHoods} fmt={(v) => String(v)} />
        </div>
      </div>
    </div>
  );
}
