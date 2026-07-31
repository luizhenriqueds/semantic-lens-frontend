import { fmtDist } from "@/lib/format";
import { POI_ICON } from "@/lib/icons";
import { MAX_NEAR_M } from "@/lib/pois";

const POIS: { cat: string; label: string }[] = [
  { cat: "university", label: "Universidade" },
  { cat: "hospital", label: "Hospital" },
  { cat: "supermarket", label: "Supermercado" },
  { cat: "shopping_center", label: "Shopping" },
  { cat: "park", label: "Parque" },
  { cat: "restaurant", label: "Restaurante" },
];

export default function PoiNearGrid({ nearest }: { nearest: Record<string, number> }) {
  return (
    <div className="poigrid">
      {POIS.map(({ cat, label }) => {
        const Icon = POI_ICON[cat];
        const d = nearest[cat];
        const dist = d == null ? "-" : d <= MAX_NEAR_M ? fmtDist(d) : `+${MAX_NEAR_M / 1000} km`;
        return (
          <div className="poi" key={cat}>
            <div className="pic">{Icon && <Icon />}</div>
            <div>
              <div className="lab">{label}</div>
              <div className="dist">{dist}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
