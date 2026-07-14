import Link from "next/link";
import type { Property } from "@/lib/types";
import {
  fmtDate,
  fmtDist,
  investmentScore,
  money,
  PROFILE_LABEL,
  profileScore,
  showDiscount,
} from "@/lib/format";
import { POI_ICON } from "@/lib/icons";
import { POI_LABEL } from "@/lib/pois";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import FavoriteButton from "@/components/property/FavoriteButton";
import Ring from "@/components/ui/Ring";

export default function PropertyRow({
  p,
  poiCats,
  poiRadius,
}: {
  p: Property;
  poiCats?: string[];
  poiRadius?: number;
}) {
  const quartos = p.bedrooms ?? 0;
  const vagas = p.parkingSpots ?? 0;
  const data = fmtDate(p.auctionDate);
  const nota = investmentScore(p);
  const poiChips = (poiCats ?? [])
    .map((c) => ({ c, d: p.nearestPoi[c] }))
    .filter(
      (x): x is { c: string; d: number } => x.d != null && (poiRadius == null || x.d <= poiRadius),
    );
  return (
    <div className="wcard">
      <Link className="wcardlink" href={`/property/${p.id}`} aria-label={p.title} />
      <div className="wphoto">
        <PropertyPhoto src={p.image} alt={`Foto do imóvel: ${p.title}`} sizes="184px" />
        {showDiscount(p) && <span className="disc">−{Math.round(p.discount!)}%</span>}
        {p.inactive && <span className="statuspill">Inativo</span>}
        <FavoriteButton id={p.id} title={p.title} />
      </div>
      <div className="wmain">
        <span className="tag">{p.propertyType}</span>
        <div className="ttl">{p.title}</div>
        <div className="sub">
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
          {vagas > 0 && (
            <span>
              <b>{vagas}</b> vaga{vagas > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {poiChips.length > 0 && (
          <div className="rowpoi">
            {poiChips.map(({ c, d }) => {
              const Icon = POI_ICON[c];
              return (
                <span className="rowpoichip" key={c}>
                  {Icon && <Icon />}
                  {POI_LABEL[c] ?? c} · {fmtDist(d)}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div>
        <div className="colk">Preço no leilão</div>
        <div className="colv price">{money(p.saleValue)}</div>
        {showDiscount(p) && (
          <div className="sub">−{Math.round(p.discount!)}% sobre a avaliação</div>
        )}
      </div>
      <div>
        <div className="colk">Leilão</div>
        <div className="colv">{p.modality ?? "—"}</div>
        {data && <div className="sub">{data}</div>}
      </div>
      {(nota != null || p.profile) && (
        <div className="wscore">
          <Ring value={nota ?? profileScore(p)} size={46} />
          <div>
            <div className="colk">{nota != null ? "Nota de investimento" : "Melhor objetivo"}</div>
            <div className="lab">{p.profile ? PROFILE_LABEL[p.profile] : "Investimento"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
