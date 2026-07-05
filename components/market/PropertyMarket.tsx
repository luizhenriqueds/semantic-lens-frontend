import { fmtDay, money, moneyShort } from "@/lib/format";
import { hasReliableMarket, moneyM2 } from "@/lib/market";
import type { MarketStats } from "@/lib/types";

type Mark = { key: string; label: string; value: number; kind: "you" | "market" | "est" };

const KIND_ORDER: Record<Mark["kind"], number> = { you: 0, market: 1, est: 2 };

// A horizontal number line that plots this property's bid against the market
// median and estimated value. The dots sit on the track for the visual
// comparison; the exact labels live in a legend below so they never overlap,
// even in the narrow sidebar or when two values are close together.
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
  if (!hasReliableMarket(stats)) {
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
  const belowPct =
    med != null && med > 0 && lance != null ? Math.round((1 - lance / med) * 100) : null;
  const propM2 = lance != null && area != null && area > 0 ? lance / area : null;

  // An estimate below the higher of appraisal/bid — or wildly above it — is unreliable, so we hide it.
  const rawEst =
    area != null && area > 0 && stats.priceM2Median != null ? area * stats.priceM2Median : null;
  const estFloor = Math.max(lance ?? 0, appraised ?? 0);
  const estValue =
    rawEst != null && estFloor > 0 && rawEst >= estFloor && rawEst <= estFloor * 3 ? rawEst : null;
  const upside = estValue != null && lance != null ? estValue - lance : null;
  const upsidePct =
    upside != null && lance != null && lance > 0 ? Math.round((upside / lance) * 100) : null;

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
  if (med != null)
    marks.push({ key: "med", label: "Mediana do bairro", value: med, kind: "market" });
  if (estValue != null)
    marks.push({ key: "est", label: "Valor estimado", value: estValue, kind: "est" });
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
        {upside != null && upsidePct != null && upside > 0 && (
          <div className="mkt-stat good">
            <div className="k">Potencial de ganho</div>
            <div className="v mkt-up">{moneyShort(upside)}</div>
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
            <div className="k">Mediana do bairro</div>
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
        {stats.propertyType?.toLowerCase() ?? "imóveis"} à venda no bairro (fonte: portais de
        imóveis).
        {fmtDay(stats.computedAt) && <> Dados coletados em {fmtDay(stats.computedAt)}.</>}
      </div>
    </div>
  );
}
