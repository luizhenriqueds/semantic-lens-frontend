import { regionTags, DNA_ROWS } from "@/lib/region";
import type { Region } from "@/lib/types";

function Stars({ n }: { n: number }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function DnaStars({ region }: { region: Region }) {
  const tags = regionTags(region);
  return (
    <>
      <div className="dnatags">
        <span className="rlabel">Perfil predominante</span>{" "}
        {tags.length ? (
          tags.map((t) => (
            <span className="rtag" key={t}>
              {t}
            </span>
          ))
        ) : (
          <span className="dist">Perfil equilibrado</span>
        )}
      </div>
      <div className="dnabody">
        {DNA_ROWS.map(({ key, label }) => (
          <div className="starrow" key={key}>
            <span>{label}</span>
            <Stars n={region.dna?.[key] ?? 0} />
          </div>
        ))}
      </div>
    </>
  );
}
