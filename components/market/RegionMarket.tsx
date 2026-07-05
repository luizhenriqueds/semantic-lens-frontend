import { fmtDay, money } from "@/lib/format";
import { moneyM2 } from "@/lib/market";
import type { MarketStats } from "@/lib/types";

export default function RegionMarket({ stats }: { stats: MarketStats[] }) {
  const collected = fmtDay(
    stats
      .map((s) => s.computedAt)
      .filter((v): v is string => !!v)
      .sort()
      .at(-1),
  );
  return (
    <div className="mkt">
      {stats.map((s) => {
        const { priceM2P25: lo, priceM2P75: hi, priceM2Median: med } = s;
        const pos =
          lo != null && hi != null && med != null && hi > lo
            ? Math.min(100, Math.max(0, ((med - lo) / (hi - lo)) * 100))
            : null;
        return (
          <div className="mktrow" key={s.addressKey}>
            <div className="mkt-type">
              <b>{s.propertyType ?? "Imóvel"}</b>
              <span>{s.sampleSize ?? 0} anúncios</span>
            </div>
            <div className="mkt-stat">
              <span className="k">Preço mediano</span>
              <span className="v">{money(s.priceMedian)}</span>
            </div>
            <div className="mkt-stat">
              <span className="k">Preço por m²</span>
              <span className="v">{moneyM2(s.priceM2Median)}</span>
            </div>
            <div className="mkt-rangecol">
              <span className="k">Faixa de preço por m²</span>
              {pos != null ? (
                <>
                  <div className="mkt-bar">
                    <i style={{ left: `${pos}%` }} />
                  </div>
                  <div className="mkt-ends">
                    <span>{moneyM2(lo)}</span>
                    <span>{moneyM2(hi)}</span>
                  </div>
                </>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        );
      })}
      <div className="rnote">
        Valores medianos de anúncios de venda na região (fonte: portais de imóveis).
        {collected && <> Dados coletados em {collected}.</>}
      </div>
    </div>
  );
}
