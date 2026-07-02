import { PROFILE_LABEL } from "@/lib/format";
import type { ProfileKey, Scores } from "@/lib/types";

const ROWS: { key: ProfileKey; field: keyof Scores }[] = [
  { key: "family", field: "family" },
  { key: "high_liquidity", field: "liquidity" },
  { key: "flip", field: "flip" },
  { key: "student", field: "student" },
  { key: "airbnb", field: "airbnb" },
  { key: "commercial", field: "commercial" },
];

export default function ScoreBars({ scores }: { scores: Scores }) {
  const ordered = [...ROWS].sort((a, b) => (scores[b.field] ?? -1) - (scores[a.field] ?? -1));
  return (
    <div className="scorebars">
      {ordered.map(({ key, field }) => {
        const v = scores[field];
        const dim = v == null || v < 60;
        return (
          <div key={key} className={`sb${dim ? " dim" : ""}`}>
            <div className="top">
              <span className="name">{PROFILE_LABEL[key]}</span>
              <span className="num">{v == null ? "—" : Math.round(v)}</span>
            </div>
            <div className="track">
              <i style={{ width: `${v == null ? 0 : Math.round(v)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
