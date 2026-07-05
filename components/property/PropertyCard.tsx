import Link from "next/link";
import type { Property } from "@/lib/types";
import { investmentScore, money, PROFILE_LABEL, profileScore, showDiscount } from "@/lib/format";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import Ring from "@/components/ui/Ring";

export default function PropertyCard({ p }: { p: Property }) {
  const quartos = p.bedrooms ?? 0;
  const nota = investmentScore(p);
  return (
    <Link className="pcard" href={`/property/${p.id}`}>
      <div className="pphoto">
        <PropertyPhoto src={p.image} alt={`Foto do imóvel: ${p.title}`} />
        <span className="tag">{p.propertyType}</span>
        {showDiscount(p) && <span className="disc">−{Math.round(p.discount!)}%</span>}
        {p.inactive && <span className="statuspill">Inativo</span>}
      </div>
      <div className="pbody">
        <h3>{p.title}</h3>
        <div className="loc">
          {p.neighborhood} · {p.city}/{p.uf}
        </div>
        <div className="facts">
          {p.area != null && (
            <span>
              <b>{Math.round(p.area)} m²</b>
            </span>
          )}
          {quartos > 0 && (
            <span>
              <b>{quartos}</b> quarto{quartos > 1 ? "s" : ""}
            </span>
          )}
          {p.modality && <span>{p.modality}</span>}
        </div>
        <div className="pricebox">
          <div>
            <div className="now">{money(p.saleValue)}</div>
            {p.appraisedValue != null && (
              <div className="was">avaliado em {money(p.appraisedValue)}</div>
            )}
          </div>
        </div>
        {(nota != null || p.profile) && (
          <div className="scorepill">
            <Ring value={nota ?? profileScore(p)} />
            <div className="meta">
              <div className="k">{nota != null ? "Nota de investimento" : "Melhor para"}</div>
              <div className="v">{p.profile ? PROFILE_LABEL[p.profile] : "Investimento geral"}</div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
