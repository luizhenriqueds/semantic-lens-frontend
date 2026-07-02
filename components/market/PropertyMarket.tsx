import { money } from "@/lib/format";
import { moneyM2 } from "@/lib/market";
import type { MarketStats } from "@/lib/types";

export default function PropertyMarket({
  stats,
  lance,
  area,
}: {
  stats: MarketStats;
  lance: number | null;
  area: number | null;
}) {
  const med = stats.priceMedian;
  const belowPct =
    med != null && med > 0 && lance != null ? Math.round((1 - lance / med) * 100) : null;
  const propM2 = lance != null && area != null && area > 0 ? lance / area : null;

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
      <div className="mktlines">
        <div className="mkt-line">
          <span>Preço mediano de venda no bairro</span>
          <b>{money(med)}</b>
        </div>
        {propM2 != null && (
          <div className="mkt-line">
            <span>Preço por m² deste imóvel</span>
            <b>{moneyM2(propM2)}</b>
          </div>
        )}
        <div className="mkt-line">
          <span>Preço por m² mediano no bairro</span>
          <b>{moneyM2(stats.priceM2Median)}</b>
        </div>
        {stats.priceM2P25 != null && stats.priceM2P75 != null && (
          <div className="mkt-line">
            <span>Faixa de preço por m²</span>
            <b>
              {moneyM2(stats.priceM2P25)} – {moneyM2(stats.priceM2P75)}
            </b>
          </div>
        )}
      </div>
      <div className="rnote">
        Baseado em {stats.sampleSize ?? 0} anúncio{stats.sampleSize === 1 ? "" : "s"} de{" "}
        {stats.propertyType?.toLowerCase() ?? "imóveis"} à venda no bairro (fonte: portais de
        imóveis).
      </div>
    </div>
  );
}
