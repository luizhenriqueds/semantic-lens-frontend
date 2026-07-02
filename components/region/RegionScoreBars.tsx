import type { Region } from "@/lib/types";

const ROWS: { field: keyof Region["scores"]; label: string }[] = [
  { field: "convenience", label: "Conveniência" },
  { field: "family", label: "Familiar" },
  { field: "student", label: "Estudantil" },
  { field: "commercial", label: "Comercial" },
  { field: "airbnb", label: "Airbnb" },
  { field: "walkability", label: "Caminhabilidade" },
];

export default function RegionScoreBars({ region }: { region: Region }) {
  const rows = [...ROWS].sort(
    (a, b) => (region.scores[b.field] ?? -1) - (region.scores[a.field] ?? -1),
  );
  return (
    <div className="scorebars">
      {rows.map(({ field, label }) => {
        const v = region.scores[field];
        const dim = v == null || v < 55;
        return (
          <div key={field} className={`sb${dim ? " dim" : ""}`}>
            <div className="top">
              <span className="name">{label}</span>
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
