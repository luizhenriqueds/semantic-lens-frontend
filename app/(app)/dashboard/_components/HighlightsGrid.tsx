import Link from "next/link";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import SectionHead from "@/components/discovery/SectionHead";
import { MIN_RAIL_ITEMS } from "@/components/discovery/RailSection";
import Ring from "@/components/ui/Ring";
import { money, showDiscount } from "@/lib/format";
import type { Property } from "@/lib/types";

export default function HighlightsGrid({ items }: { items: Property[] }) {
  if (items.length < MIN_RAIL_ITEMS) return null;
  return (
    <section className="railsec">
      <SectionHead
        title="Destaques da rodada"
        why="nota de investimento alta somada a deságio real"
      />
      <div className="oppgrid photo">
        {items.map((p) => (
          <Link className="opp" key={p.id} href={`/property/${p.id}`}>
            <Ring value={p.scores.investment} size={46} />
            <div className="thumb">
              <PropertyPhoto src={p.image} alt="" sizes="62px" />
            </div>
            <div className="body">
              <div className="t">{p.title}</div>
              <div className="loc">
                {p.city}, {p.uf}
                {p.area != null ? ` · ${Math.round(p.area)} m²` : ""}
              </div>
            </div>
            <div className="price">
              <div className="now">{money(p.saleValue)}</div>
              {showDiscount(p) && <div className="disc">−{Math.round(p.discount!)}%</div>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
