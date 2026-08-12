import Link from "next/link";
import type { ProfileKey, Property } from "@/lib/types";
import {
  investmentScore,
  money,
  PROFILE_SHORT,
  scoreForProfile,
  showDiscount,
  topGoals,
} from "@/lib/format";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import FavoriteButton from "@/components/property/FavoriteButton";
import PayBadges from "@/components/property/PayBadges";
import Ring from "@/components/ui/Ring";

export default function PropertyCard({
  p,
  highlightGoal,
}: {
  p: Property;
  highlightGoal?: ProfileKey | null;
}) {
  const quartos = p.bedrooms ?? 0;
  const nota = investmentScore(p);
  const top = topGoals(p, 2);
  // When the search targets a goal, make sure that goal is shown and marked so
  // the card explains why it matched - even if it isn't the property's top goal.
  let goals: { key: ProfileKey; on: boolean }[] = top.map((g) => ({ key: g.key, on: false }));
  if (highlightGoal) {
    if (goals.some((g) => g.key === highlightGoal)) {
      goals = goals.map((g) => ({ ...g, on: g.key === highlightGoal }));
    } else if (scoreForProfile(p, highlightGoal) != null) {
      goals = [
        { key: highlightGoal, on: true },
        ...top.slice(0, 1).map((g) => ({ key: g.key, on: false })),
      ];
    }
  }
  return (
    <div className="pcard">
      <Link className="pcardlink" href={`/property/${p.id}`} aria-label={p.title} />
      <div className="pphoto">
        <PropertyPhoto src={p.image} alt={`Foto do imóvel: ${p.title}`} />
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
        <PayBadges p={p} />
        <div className="pricebox">
          <div>
            <div className="now">{money(p.saleValue)}</div>
            {p.appraisedValue != null && (
              <div className="was">avaliado em {money(p.appraisedValue)}</div>
            )}
          </div>
        </div>
        {(nota != null || goals.length > 0) && (
          <div className="scorepill">
            {nota != null && (
              <div className="scoreblock">
                <Ring value={nota} />
                <span className="k">Nota</span>
              </div>
            )}
            {goals.length > 0 && (
              <div className="goals">
                <span className="k">Ideal para</span>
                <div className="goalpills">
                  {goals.map((g) => (
                    <span key={g.key} className={`goalpill${g.on ? " on" : ""}`}>
                      {PROFILE_SHORT[g.key]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
