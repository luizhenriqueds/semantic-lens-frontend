import Link from "next/link";
import type { Property } from "@/lib/types";
import { money, PROFILE_LABEL, profileScore } from "@/lib/format";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import Ring from "@/components/ui/Ring";

export default function PropertyCard({ p }: { p: Property }) {
  const quartos = p.quartos ?? 0;
  return (
    <Link className="pcard" href={`/property/${p.id}`}>
      <div className="pphoto">
        <PropertyPhoto src={p.image} alt={`Foto do imóvel: ${p.titulo}`} />
        <span className="tag">{p.tipo}</span>
        {p.desc != null && <span className="disc">−{Math.round(p.desc)}%</span>}
      </div>
      <div className="pbody">
        <h3>{p.titulo}</h3>
        <div className="loc">
          {p.bairro} · {p.cidade}/{p.uf}
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
          {p.modalidade && <span>{p.modalidade}</span>}
        </div>
        <div className="pricebox">
          <div>
            <div className="now">{money(p.lance)}</div>
            {p.aval != null && <div className="was">avaliado em {money(p.aval)}</div>}
          </div>
        </div>
        {p.perfil && (
          <div className="scorepill">
            <Ring value={profileScore(p)} />
            <div className="meta">
              <div className="k">Melhor para</div>
              <div className="v">{PROFILE_LABEL[p.perfil]}</div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
