import { IconPin, POI_ICON } from "@/lib/icons";
import type { Region } from "@/lib/types";

const SPOTS: { cat: string; x: number; y: number }[] = [
  { cat: "hospital", x: 22, y: 30 },
  { cat: "university", x: 40, y: 20 },
  { cat: "shopping_center", x: 63, y: 24 },
  { cat: "restaurant", x: 82, y: 33 },
  { cat: "supermarket", x: 16, y: 58 },
  { cat: "park", x: 35, y: 76 },
  { cat: "hotel", x: 68, y: 70 },
  { cat: "school", x: 85, y: 62 },
  { cat: "bank", x: 58, y: 50 },
];

const LEGEND: { cat: string; label: string }[] = [
  { cat: "university", label: "Universidade" },
  { cat: "hospital", label: "Hospital" },
  { cat: "supermarket", label: "Mercado" },
  { cat: "restaurant", label: "Restaurante" },
  { cat: "park", label: "Parque" },
  { cat: "shopping_center", label: "Shopping" },
];

function Streets() {
  return (
    <svg
      className="streets"
      preserveAspectRatio="none"
      viewBox="0 0 400 300"
      fill="none"
      stroke="var(--line)"
      strokeWidth="2"
    >
      <path d="M0 95H400M0 190H400M120 0V300M255 0V300" />
      <path d="M0 45L400 80M0 255L400 215" strokeWidth="1.4" />
    </svg>
  );
}

export default function RegionMap({ region }: { region: Region }) {
  const marks = SPOTS.filter((s) => (region.counts[s.cat] ?? 0) > 0);
  return (
    <>
      <div className="rmap">
        <Streets />
        <div className="mring" style={{ left: "50%", top: "50%", width: 150, height: 150 }} />
        <div className="mring" style={{ left: "50%", top: "50%", width: 240, height: 240 }} />
        {marks.map((m) => {
          const Icon = POI_ICON[m.cat];
          return (
            <div className="mk" key={m.cat} style={{ left: `${m.x}%`, top: `${m.y}%` }}>
              {Icon && <Icon />}
            </div>
          );
        })}
        <div className="mk center" style={{ left: "50%", top: "50%" }}>
          <IconPin />
        </div>
      </div>
      <div className="maplegend">
        {LEGEND.map((l) => {
          const Icon = POI_ICON[l.cat];
          return (
            <span key={l.cat}>
              <i>{Icon && <Icon />}</i>
              {l.label}
            </span>
          );
        })}
      </div>
    </>
  );
}
