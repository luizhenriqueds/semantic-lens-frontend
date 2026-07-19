import { fmtDay, money, moneyShort } from "@/lib/format";
import { marketQuality, moneyM2 } from "@/lib/market";
import type { MarketStats } from "@/lib/types";

type Mark = {
  key: string;
  label: string;
  value: number;
  kind: "you" | "appraised" | "market";
};

const KIND_ORDER: Record<Mark["kind"], number> = { you: 0, appraised: 1, market: 2 };

// A horizontal number line plotting this property's bid against the market
// benchmark and appraisal. Labels live in a legend below so the dots never
// overlap, even in the narrow sidebar.
function PriceScale({ marks }: { marks: Mark[] }) {
  const values = marks.map((m) => m.value);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const pad = (hi - lo || hi || 1) * 0.14;
  lo -= pad;
  hi += pad;
  const pos = (v: number) => ((v - lo) / (hi - lo || 1)) * 100;
  const legend = [...marks].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);

  return (
    <div className="priceplot">
      <div className="pp-track">
        {marks.map((m) => (
          <span
            className={`pp-dot ${m.kind}`}
            key={m.key}
            style={{ left: `${pos(m.value)}%` }}
            title={`${m.label}: ${moneyShort(m.value)}`}
          />
        ))}
      </div>
      <div className="pp-legend">
        {legend.map((m) => (
          <div className="pp-item" key={m.key}>
            <span className={`pp-swatch ${m.kind}`} />
            <span className="pp-name">{m.label}</span>
            <b className="pp-value">{moneyShort(m.value)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

// Market benchmark: real same-size comps > per-m² estimate > raw median.
function marketBenchmark(stats: MarketStats, area: number | null) {
  const med = stats.priceMedian;
  if (stats.sizeMatched)
    return { value: med, label: "Valor de mercado (comparáveis)", basis: "comps" as const };
  const est =
    area != null && area > 0 && stats.priceM2Median != null ? area * stats.priceM2Median : null;
  if (est != null)
    return { value: est, label: "Valor de mercado (por m²)", basis: "perM2" as const };
  return { value: med, label: "Mediana do bairro", basis: "median" as const };
}

export default function PropertyMarket({
  stats,
  lance,
  area,
  appraised = null,
}: {
  stats: MarketStats;
  lance: number | null;
  area: number | null;
  appraised?: number | null;
}) {
  const quality = marketQuality(stats);

  if (quality === "none") {
    return (
      <div className="infoblock">
        <h3>Comparativo de mercado</h3>
        <div className="rnote" style={{ marginTop: 0 }}>
          Ainda não encontramos anúncios comparáveis suficientes neste bairro para uma análise de
          mercado confiável.
        </div>
      </div>
    );
  }

  const med = stats.priceMedian;
  const propM2 = lance != null && area != null && area > 0 ? lance / area : null;
  // Degenerate sample: show only the raw references, no derived comparisons.
  if (quality === "thin") {
    return (
      <div className="infoblock">
        <h3>Comparativo de mercado</h3>
        <div className="mkt-tiles">
          {med != null && (
            <div className="mkt-stat">
              <div className="k">Mediana do bairro</div>
              <div className="v">{money(med)}</div>
              <div className="s">preço de venda</div>
            </div>
          )}
          {propM2 != null && (
            <div className="mkt-stat">
              <div className="k">R$/m² deste imóvel</div>
              <div className="v">{moneyM2(propM2)}</div>
              {stats.priceM2Median != null && (
                <div className="s">bairro: {moneyM2(stats.priceM2Median)}</div>
              )}
            </div>
          )}
        </div>
        <div className="rnote">
          Os {stats.sampleSize ?? 0} anúncio{stats.sampleSize === 1 ? "" : "s"} encontrados neste
          bairro têm preços muito parecidos entre si, então não é possível estimar com segurança se
          este imóvel está acima ou abaixo do mercado.
          {fmtDay(stats.computedAt) && <> Dados coletados em {fmtDay(stats.computedAt)}.</>}
        </div>
      </div>
    );
  }
  const { value: compareValue, label: marketLabel, basis } = marketBenchmark(stats, area);

  const belowPct =
    compareValue != null && compareValue > 0 && lance != null
      ? Math.round((1 - lance / compareValue) * 100)
      : null;

  const upside = compareValue != null && lance != null ? compareValue - lance : null;
  const upsidePct =
    upside != null && lance != null && lance > 0 ? Math.round((upside / lance) * 100) : null;
  const showUpside =
    upside != null &&
    upside > 0 &&
    compareValue != null &&
    compareValue <= Math.max(lance ?? 0, appraised ?? 0, 1) * 3;

  const p25 = stats.priceM2P25;
  const p75 = stats.priceM2P75;
  const rangePos =
    propM2 != null && p25 != null && p75 != null && p75 > p25
      ? Math.min(100, Math.max(0, Math.round(((propM2 - p25) / (p75 - p25)) * 100)))
      : null;

  const areaDelta =
    area != null && stats.areaMedian != null && stats.areaMedian > 0
      ? Math.round(((area - stats.areaMedian) / stats.areaMedian) * 100)
      : null;

  const marks: Mark[] = [];
  if (lance != null) marks.push({ key: "you", label: "Este imóvel", value: lance, kind: "you" });
  if (appraised != null)
    marks.push({ key: "appr", label: "Valor de avaliação", value: appraised, kind: "appraised" });
  if (compareValue != null)
    marks.push({ key: "mkt", label: marketLabel, value: compareValue, kind: "market" });
  const sortedMarks = [...marks].sort((a, b) => a.value - b.value);

  return (
    <div className="infoblock">
      <h3>Comparativo de mercado</h3>
      {belowPct != null && (
        <div className={`mkt-flag${belowPct >= 0 ? " good" : " over"}`}>
          {belowPct >= 0
            ? `${belowPct}% abaixo do preço de mercado`
            : `${-belowPct}% acima do preço de mercado`}
        </div>
      )}

      {sortedMarks.length >= 2 && <PriceScale marks={sortedMarks} />}

      <div className="mkt-tiles">
        {showUpside && (
          <div className="mkt-stat good">
            <div className="k">Potencial de ganho</div>
            <div className="v mkt-up">{moneyShort(upside!)}</div>
            <div className="s">+{upsidePct}% sobre o lance</div>
          </div>
        )}
        {propM2 != null && (
          <div className="mkt-stat">
            <div className="k">R$/m² deste imóvel</div>
            <div className="v">{moneyM2(propM2)}</div>
            {stats.priceM2Median != null && (
              <div className="s">bairro: {moneyM2(stats.priceM2Median)}</div>
            )}
          </div>
        )}
        {areaDelta != null && (
          <div className="mkt-stat">
            <div className="k">Área vs. bairro</div>
            <div className={`v${areaDelta >= 0 ? " mkt-up" : ""}`}>
              {areaDelta >= 0 ? "+" : ""}
              {areaDelta}%
            </div>
            <div className="s">mediana {Math.round(stats.areaMedian!)} m²</div>
          </div>
        )}
        {med != null && (
          <div className="mkt-stat">
            <div className="k">
              {basis === "comps" ? "Mediana de similares" : "Mediana do bairro"}
            </div>
            <div className="v">{money(med)}</div>
            <div className="s">preço de venda</div>
          </div>
        )}
      </div>

      {p25 != null && p75 != null && (
        <div className="mkt-range">
          <div className="mkt-range-labels">
            <span>{moneyM2(p25)}</span>
            <span>Faixa de preço por m² no bairro</span>
            <span>{moneyM2(p75)}</span>
          </div>
          <div className="mkt-range-bar">
            {rangePos != null && (
              <span className="mkt-range-dot" style={{ left: `${rangePos}%` }} />
            )}
          </div>
          {rangePos != null && (
            <div className="mkt-range-note">
              {rangePos <= 25
                ? "Este imóvel está entre os mais baratos do bairro por m²."
                : rangePos >= 75
                  ? "Este imóvel está entre os mais caros do bairro por m²."
                  : "Este imóvel está na faixa intermediária de preço por m² do bairro."}
            </div>
          )}
        </div>
      )}
      <div className="rnote">
        Baseado em {stats.sampleSize ?? 0} anúncio{stats.sampleSize === 1 ? "" : "s"} de{" "}
        {stats.propertyType?.toLowerCase() ?? "imóveis"}{" "}
        {basis === "comps" ? "de porte similar " : ""}à venda no bairro (fonte: portais de imóveis).
        {fmtDay(stats.computedAt) && <> Dados coletados em {fmtDay(stats.computedAt)}.</>}
      </div>
    </div>
  );
}
