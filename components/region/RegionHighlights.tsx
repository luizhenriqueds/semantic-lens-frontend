import { POI_ICON } from "@/lib/icons";
import { POI_LABEL } from "@/lib/pois";
import type { Poi } from "@/lib/types";

export default function RegionHighlights({ pois }: { pois: Poi[] }) {
  if (!pois.length) return null;
  return (
    <div className="poigrid">
      {pois.map((p) => {
        const Icon = POI_ICON[p.category];
        return (
          <div className="poi" key={p.id}>
            <div className="pic">{Icon && <Icon />}</div>
            <div>
              <div className="lab">{p.name}</div>
              <div className="dist">{POI_LABEL[p.category] ?? p.category}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
