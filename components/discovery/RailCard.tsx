import Link from "next/link";
import FavoriteButton from "@/components/property/FavoriteButton";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import AuctionFlag from "@/components/property/AuctionFlag";
import ReasonChips from "@/components/discovery/ReasonChips";
import type { Reason } from "@/lib/discovery";
import { money, showDiscount } from "@/lib/format";
import type { Property } from "@/lib/types";

export default function RailCard({ p, reasons }: { p: Property; reasons: Reason[] }) {
  const beds = p.bedrooms ?? 0;
  return (
    <article className="pcard railcard">
      <Link className="pcardlink" href={`/property/${p.id}`} aria-label={p.title} />
      <div className="pphoto">
        <PropertyPhoto src={p.image} alt={`Foto do imóvel: ${p.title}`} sizes="262px" />
        <span className="tag">{p.propertyType}</span>
        {showDiscount(p) && <span className="disc">−{Math.round(p.discount!)}%</span>}
        {p.inactive && <span className="statuspill">Inativo</span>}
        <FavoriteButton id={p.id} title={p.title} />
      </div>
      <div className="pbody">
        <h3>{p.title}</h3>
        <div className="loc">
          {p.neighborhood} · {p.city}/{p.uf}
        </div>
        <AuctionFlag p={p} />
        <div className="facts">
          {p.area != null && (
            <span>
              <b>{Math.round(p.area)} m²</b>
            </span>
          )}
          {beds > 0 && (
            <span>
              <b>{beds}</b> quarto{beds > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="pricebox">
          <div>
            <div className="now">{money(p.saleValue)}</div>
            {p.appraisedValue != null && showDiscount(p) && (
              <div className="was">{money(p.appraisedValue)}</div>
            )}
          </div>
        </div>
        <ReasonChips reasons={reasons} />
      </div>
    </article>
  );
}
