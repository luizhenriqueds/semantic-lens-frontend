import Link from "next/link";
import type { Property } from "@/lib/types";
import { fmtDate, money, PROFILE_LABEL, profileScore } from "@/lib/format";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import Ring from "@/components/ui/Ring";

export default function PropertyRow({ p }: { p: Property }) {
  const quartos = p.quartos ?? 0;
  const vagas = p.vagas ?? 0;
  const data = fmtDate(p.dataLeilao);
  return (
    <Link className="wcard" href={`/property/${p.id}`}>
      <div className="wphoto">
        <PropertyPhoto src={p.image} alt={`Foto do imóvel: ${p.titulo}`} sizes="184px" />
        {p.desc != null && <span className="disc">−{Math.round(p.desc)}%</span>}
      </div>
      <div className="wmain">
        <span className="tag">{p.tipo}</span>
        <div className="ttl">{p.titulo}</div>
        <div className="sub">
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
          {vagas > 0 && (
            <span>
              <b>{vagas}</b> vaga{vagas > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div>
        <div className="colk">Preço no leilão</div>
        <div className="colv price">{money(p.lance)}</div>
        {p.desc != null && <div className="sub">−{Math.round(p.desc)}% sobre a avaliação</div>}
      </div>
      <div>
        <div className="colk">Leilão</div>
        <div className="colv">{p.modalidade ?? "—"}</div>
        {data && <div className="sub">{data}</div>}
      </div>
      {p.perfil && (
        <div className="wscore">
          <Ring value={profileScore(p)} size={46} />
          <div>
            <div className="colk">Melhor objetivo</div>
            <div className="lab">{PROFILE_LABEL[p.perfil]}</div>
          </div>
        </div>
      )}
    </Link>
  );
}
