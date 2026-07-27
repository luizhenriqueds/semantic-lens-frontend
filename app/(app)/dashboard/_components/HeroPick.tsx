import Link from "next/link";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import Ring from "@/components/ui/Ring";
import { heroReasons } from "@/lib/discovery";
import { money, showDiscount } from "@/lib/format";
import type { Property } from "@/lib/types";

export default function HeroPick({ p, now }: { p: Property; now: Date }) {
  const why = heroReasons(p, now);
  return (
    <article className="hero">
      <div className="heroimg">
        <PropertyPhoto
          src={p.image}
          alt={`Foto do imóvel: ${p.title}`}
          sizes="(max-width: 1180px) 100vw, 620px"
          priority
        />
        {showDiscount(p) && <span className="disc">−{Math.round(p.discount!)}% da avaliação</span>}
        {p.scores.investment != null && (
          <span className="heroring">
            <Ring value={p.scores.investment} size={62} />
          </span>
        )}
      </div>
      <div className="herobody">
        <div className="lab">A escolha desta rodada</div>
        <h2>{p.title}</h2>
        <div className="loc">
          {p.neighborhood} · {p.city}/{p.uf}
        </div>
        <div className="heroprice">
          <span className="now">{money(p.saleValue)}</span>
          {p.appraisedValue != null && showDiscount(p) && (
            <span className="was">{money(p.appraisedValue)}</span>
          )}
        </div>
        <ul className="herowhy">
          {why.map((w) => (
            <li key={w.strong}>
              <span>
                <b>{w.strong}</b>
                {w.lead}
              </span>
            </li>
          ))}
        </ul>
        <div className="heroact">
          <Link className="btn solid" href={`/property/${p.id}`}>
            Ver o imóvel
          </Link>
        </div>
      </div>
    </article>
  );
}
