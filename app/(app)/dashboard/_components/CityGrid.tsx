import Link from "next/link";
import SectionHead from "@/components/discovery/SectionHead";
import { MIN_RAIL_ITEMS } from "@/components/discovery/RailSection";
import type { MarketCity } from "@/lib/data";
import { countShort, money } from "@/lib/format";

export default function CityGrid({ cities }: { cities: MarketCity[] }) {
  if (cities.length < MIN_RAIL_ITEMS) return null;
  return (
    <section className="railsec">
      <SectionHead
        title="Explore por cidade"
        why="onde há mais oferta - com preço mediano, deságio e nota da região"
        moreHref="/regions"
        moreLabel="Ver todas as regiões"
      />
      <div className="regiongrid">
        {cities.map((c) => {
          const nota = c.investment_median == null ? null : Math.round(c.investment_median);
          return (
            <Link
              className="region"
              key={`${c.city}-${c.uf}`}
              href={`/properties?city=${encodeURIComponent(c.city)}`}
            >
              <div className="c">{c.city}</div>
              <div className="u">{c.uf}</div>
              <div className="n">
                <b>{countShort(c.n)}</b> imóveis
                {c.sale_median != null && <> · mediana {money(c.sale_median)}</>}
              </div>
              {nota != null && (
                <>
                  <div className="minibar">
                    <i style={{ width: `${nota}%` }} />
                  </div>
                  <div className="foot">
                    <span>nota {nota}</span>
                    {c.discount_median != null && (
                      <span>deságio {Math.round(c.discount_median)}%</span>
                    )}
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
