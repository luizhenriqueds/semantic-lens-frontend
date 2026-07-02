import { POI_ICON } from "@/lib/icons";
import type { Region } from "@/lib/types";

const ITEMS: { cat: string; label: string }[] = [
  { cat: "university", label: "Universidades" },
  { cat: "hospital", label: "Hospitais" },
  { cat: "school", label: "Escolas" },
  { cat: "supermarket", label: "Supermercados" },
  { cat: "restaurant", label: "Restaurantes" },
  { cat: "park", label: "Parques" },
  { cat: "hotel", label: "Hotéis" },
  { cat: "shopping_center", label: "Shoppings" },
];

export default function InfraGrid({ region }: { region: Region }) {
  return (
    <div className="infragrid">
      {ITEMS.map(({ cat, label }) => {
        const Icon = POI_ICON[cat];
        return (
          <div className="infra" key={cat}>
            <div className="pic">{Icon && <Icon />}</div>
            <div>
              <div className="n">{region.counts[cat] ?? 0}</div>
              <div className="l">{label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
