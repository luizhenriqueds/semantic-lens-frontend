import Link from "next/link";
import type { DeedResult } from "@/lib/data";
import type { Property } from "@/lib/types";

export default function DeedResults({
  results,
}: {
  results: (DeedResult & { property?: Property })[];
}) {
  return (
    <div className="deedlist">
      {results.map((r) => (
        <Link key={r.id} className="deedcard" href={`/property/${r.id}`}>
          <div className="deedtop">
            <div className="deedid">
              <h3>{r.property?.title ?? `Matrícula ${r.id}`}</h3>
              {r.property && (
                <div className="deedloc">
                  {r.property.neighborhood} · {r.property.city}/{r.property.uf}
                </div>
              )}
            </div>
            <span className="deedrel">
              <span className="matchdot" aria-hidden="true" />
              <b>{Math.round(r.relevance)}%</b>
            </span>
          </div>
          {r.reason && <div className="deedreason">{r.reason}</div>}
          <p className="deedexcerpt">
            {r.excerpt.slice(0, 320)}
            {r.excerpt.length > 320 ? "…" : ""}
          </p>
        </Link>
      ))}
    </div>
  );
}
