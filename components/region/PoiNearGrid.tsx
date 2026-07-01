import { fmtDist } from "@/lib/format";
import { POI_ICON } from "@/lib/icons";
import type { Region } from "@/lib/types";

const POIS: { cat: string; label: string }[] = [
  { cat: "university", label: "Universidade" },
  { cat: "hospital", label: "Hospital" },
  { cat: "supermarket", label: "Supermercado" },
  { cat: "shopping_center", label: "Shopping" },
  { cat: "park", label: "Parque" },
  { cat: "restaurant", label: "Restaurante" },
];

export default function PoiNearGrid({ region }: { region: Region }) {
  return (
    <div className="poigrid">
      {POIS.map(({ cat, label }) => {
        const Icon = POI_ICON[cat];
        return (
          <div className="poi" key={cat}>
            <div className="pic">{Icon && <Icon />}</div>
            <div>
              <div className="lab">{label}</div>
              <div className="dist">{fmtDist(region.nearest[cat])}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
