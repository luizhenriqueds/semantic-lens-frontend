import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import { POI_ICON } from "@/lib/icons";

const CAT_COLOR: Record<string, string> = {
  supermarket: "#c56a1a",
  school: "#3f7cc0",
  university: "#2f6fb0",
  hospital: "#c04a4a",
  pharmacy: "#d05a7a",
  park: "#3f8f52",
  restaurant: "#b07a2a",
  shopping_center: "#7a5ec0",
  bank: "#4a8a8a",
  hotel: "#8a6a5a",
  fuel: "#c0623a",
  fast_food: "#d08a2a",
  clinic: "#c85a6a",
  police: "#3a5aa0",
  kindergarten: "#c07aa0",
  bar: "#9a5ec0",
  bus_station: "#4a7aa0",
  cafe: "#8a5a3a",
  market_place: "#a8742a",
  dentist: "#5a9a9a",
  doctors: "#c04a5a",
  atm: "#4a8a7a",
  veterinary: "#6a9a4a",
  fire_station: "#c04030",
  driving_school: "#5a6a8a",
  language_school: "#3f8fb0",
  cinema: "#8a5ec0",
  car_rental: "#5a7a9a",
  food_court: "#b07a2a",
};

export const catColor = (cat: string) => CAT_COLOR[cat] ?? "#6b7770";

// The teardrop pin with the little house glyph, shared by the plain and counted markers.
const PinBody = () => (
  <>
    <path
      d="M16 41s14-15.2 14-25A14 14 0 1 0 2 16c0 9.8 14 25 14 25Z"
      fill="var(--primary)"
      stroke="var(--surface)"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="15.5" r="8.6" fill="var(--surface)" />
    <g stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.4 16.4 16 12.2l4.6 4.2" />
      <path d="M12.6 15.6v4.2h6.8v-4.2" />
    </g>
  </>
);

const HomePin = () => (
  <svg viewBox="0 0 32 42" width="32" height="42" fill="none">
    <PinBody />
  </svg>
);

function poiIconHtml(cat: string): string {
  const Icon = POI_ICON[cat];
  const inner = Icon
    ? renderToStaticMarkup(
        <Icon width={13} height={13} strokeWidth={2} stroke="#fff" style={{ display: "block" }} />,
      )
    : "";
  return `<span class="poimk" style="background:${catColor(cat)}">${inner}</span>`;
}

const HomePinCount = ({ n }: { n: number }) => (
  <svg viewBox="0 0 40 42" width="40" height="42" fill="none">
    <PinBody />
    <circle cx="30" cy="9" r="8.5" fill="var(--warn)" stroke="var(--surface)" strokeWidth="2" />
    <text x="30" y="12.7" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
      {n > 9 ? "9+" : n}
    </text>
  </svg>
);

export const homeIcon = () =>
  L.divIcon({
    className: "lmk-pin",
    html: renderToStaticMarkup(<HomePin />),
    iconSize: [32, 42],
    iconAnchor: [16, 41],
    popupAnchor: [0, -38],
  });

export const homeIconCount = (n: number) =>
  L.divIcon({
    className: "lmk-pin",
    html: renderToStaticMarkup(<HomePinCount n={n} />),
    iconSize: [40, 42],
    iconAnchor: [16, 41],
    popupAnchor: [2, -38],
  });

export const poiIcon = (cat: string) =>
  L.divIcon({
    className: "poimk-wrap",
    html: poiIconHtml(cat),
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
