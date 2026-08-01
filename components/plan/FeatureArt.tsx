import type { Feature } from "@/lib/entitlements";

// Teaser art for the upsell dialog: a stylised shot of the surface the plan unlocks. Plain SVG
// on the palette variables, so both themes work without a second asset.
const Frame = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 260 180" className="fart" aria-hidden="true">
    {children}
  </svg>
);

const Row = ({ y }: { y: number }) => (
  <>
    <rect className="fart-tile" x="18" y={y} width="34" height="26" rx="6" />
    <rect className="fart-line" x="60" y={y + 5} width="128" height="6" rx="3" />
    <rect className="fart-dim" x="60" y={y + 15} width="77" height="5" rx="2.5" />
  </>
);

const Col = ({ x, h }: { x: number; h: number }) => (
  <rect className="fart-fill" x={x} y={140 - h} width="22" height={h} rx="4" />
);

const Hex = ({ x, y, o }: { x: number; y: number; o: number }) => (
  <polygon
    className="fart-fill"
    opacity={o}
    points={`${x},${y - 18} ${x + 16},${y - 9} ${x + 16},${y + 9} ${x},${y + 18} ${x - 16},${y + 9} ${x - 16},${y - 9}`}
  />
);

const ART: Record<Feature, React.ReactNode> = {
  favorites: (
    <Frame>
      <rect className="fart-card" x="16" y="16" width="228" height="148" rx="12" />
      <Row y={40} />
      <Row y={82} />
      <Row y={124} />
      <path
        className="fart-mark"
        d="M214 44l4.4 9 9.9 1.4-7.1 7 1.7 9.8-8.9-4.6-8.9 4.6 1.7-9.8-7.1-7 9.9-1.4z"
      />
    </Frame>
  ),
  savedSearches: (
    <Frame>
      <rect className="fart-card" x="16" y="24" width="228" height="34" rx="17" />
      <circle className="fart-stroke" cx="42" cy="41" r="7" />
      <path className="fart-stroke" d="M47 46l6 6" />
      <rect className="fart-dim" x="66" y="38" width="120" height="6" rx="3" />
      <rect className="fart-card" x="16" y="76" width="228" height="88" rx="12" />
      <path
        className="fart-mark"
        d="M56 122a14 14 0 0 1 28 0c0 12 5 15 5 15H51s5-3 5-15z"
        fillOpacity="0.18"
      />
      <rect className="fart-line" x="104" y="104" width="112" height="6" rx="3" />
      <rect className="fart-dim" x="104" y="120" width="88" height="6" rx="3" />
      <rect className="fart-fill" x="104" y="136" width="56" height="6" rx="3" />
    </Frame>
  ),
  curatedAlerts: (
    <Frame>
      <rect className="fart-card" x="24" y="30" width="212" height="120" rx="12" />
      <path className="fart-stroke" d="M24 42l106 62 106-62" />
      <rect className="fart-chip" x="44" y="116" width="72" height="20" rx="10" />
      <rect className="fart-line" x="128" y="120" width="88" height="6" rx="3" />
      <circle className="fart-fill" cx="216" cy="34" r="12" />
    </Frame>
  ),
  groups: (
    <Frame>
      {[
        [40, 34],
        [110, 34],
        [40, 100],
        [110, 100],
      ].map(([x, y], i) => (
        <rect key={i} className="fart-tile" x={x} y={y} width="60" height="52" rx="8" />
      ))}
      <path className="fart-stroke" d="M176 60h34M176 90h34M176 120h34" strokeDasharray="4 5" />
      <circle className="fart-knob" cx="222" cy="90" r="14" />
    </Frame>
  ),
  recommendations: (
    <Frame>
      <rect className="fart-card fart-anchor" x="16" y="46" width="72" height="88" rx="10" />
      <rect className="fart-fill" x="30" y="62" width="44" height="30" rx="6" />
      <rect className="fart-dim" x="30" y="102" width="44" height="6" rx="3" />
      <path className="fart-stroke" d="M96 90h24m0 0-7-6m7 6-7 6" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect
            className="fart-card"
            x={132 + i * 60}
            y="46"
            width="52"
            height="88"
            rx="10"
            opacity={1 - i * 0.35}
          />
          <rect
            className="fart-tile"
            x={142 + i * 60}
            y="62"
            width="32"
            height="30"
            rx="6"
            opacity={1 - i * 0.35}
          />
        </g>
      ))}
    </Frame>
  ),
  advancedFilters: (
    <Frame>
      <rect className="fart-card" x="16" y="16" width="228" height="148" rx="12" />
      {[46, 76, 106].map((y, i) => (
        <g key={y}>
          <rect className="fart-dim" x="34" y={y - 12} width={70 - i * 12} height="6" rx="3" />
          <rect className="fart-line" x="34" y={y} width="192" height="6" rx="3" />
          <rect className="fart-fill" x="34" y={y} width={120 - i * 34} height="6" rx="3" />
          <circle className="fart-knob" cx={154 - i * 34} cy={y + 3} r="7" />
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          className="fart-chip"
          x={34 + i * 62}
          y="128"
          width="54"
          height="20"
          rx="10"
        />
      ))}
    </Frame>
  ),
  analysisView: (
    <Frame>
      <path className="fart-axis" d="M22 140h216" />
      {[38, 62, 96, 120, 84, 50, 30].map((h, i) => (
        <Col key={i} x={30 + i * 30} h={h} />
      ))}
      <rect className="fart-dim" x="30" y="26" width="90" height="6" rx="3" />
    </Frame>
  ),
  marketCompare: (
    <Frame>
      <rect className="fart-card" x="16" y="24" width="228" height="132" rx="12" />
      <path className="fart-axis" d="M130 40v100" strokeDasharray="5 5" />
      {[
        [52, 62],
        [78, 104],
        [96, 52],
        [148, 86],
        [170, 60],
        [196, 112],
        [214, 78],
      ].map(([x, y], i) => (
        <circle key={i} className="fart-dot" cx={x} cy={y} r="5" />
      ))}
      <circle className="fart-knob" cx="62" cy="126" r="8" />
      <rect className="fart-dim" x="34" y="40" width="70" height="6" rx="3" />
    </Frame>
  ),
  calendarView: (
    <Frame>
      <rect className="fart-card" x="20" y="26" width="220" height="130" rx="12" />
      <path className="fart-stroke" d="M20 58h220M70 26v-8M190 26v-8" />
      {Array.from({ length: 21 }, (_, i) => {
        const on = [4, 9, 15, 18].includes(i);
        return (
          <rect
            key={i}
            className={on ? "fart-fill" : "fart-dim"}
            x={38 + (i % 7) * 28}
            y={72 + Math.floor(i / 7) * 28}
            width="18"
            height="14"
            rx="4"
          />
        );
      })}
    </Frame>
  ),
  market: (
    <Frame>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect className="fart-card" x={16 + i * 78} y="20" width="66" height="52" rx="10" />
          <rect className="fart-fill" x={28 + i * 78} y="36" width="34" height="10" rx="4" />
          <rect className="fart-dim" x={28 + i * 78} y="54" width="42" height="5" rx="2.5" />
        </g>
      ))}
      <path className="fart-axis" d="M22 148h216" />
      {[26, 54, 42, 78, 66, 100].map((h, i) => (
        <Col key={i} x={30 + i * 36} h={h} />
      ))}
    </Frame>
  ),
  regions: (
    <Frame>
      <Hex x={82} y={62} o={0.2} />
      <Hex x={114} y={44} o={0.35} />
      <Hex x={146} y={62} o={0.6} />
      {/* Lighter than its neighbours on purpose: the pin sits on it and both use --primary. */}
      <Hex x={114} y={80} o={0.4} />
      <Hex x={82} y={98} o={0.45} />
      <Hex x={146} y={98} o={0.3} />
      <Hex x={114} y={116} o={0.15} />
      <path
        className="fart-mark"
        transform="translate(114 80)"
        d="M0-16a12 12 0 0 0-12 12c0 8 12 20 12 20s12-12 12-20a12 12 0 0 0-12-12z"
      />
      <rect className="fart-dim" x="184" y="60" width="52" height="6" rx="3" />
      <rect className="fart-line" x="184" y="76" width="40" height="6" rx="3" />
      <rect className="fart-dim" x="184" y="92" width="46" height="6" rx="3" />
    </Frame>
  ),
  nearbyPois: (
    <Frame>
      <rect className="fart-card" x="16" y="20" width="150" height="140" rx="12" />
      {[26, 46, 66].map((r) => (
        <circle
          key={r}
          className="fart-axis"
          cx="91"
          cy="90"
          r={r}
          fill="none"
          strokeDasharray="4 5"
        />
      ))}
      {[
        [64, 62],
        [122, 74],
        [58, 118],
        [126, 122],
        [91, 38],
      ].map(([x, y], i) => (
        <circle key={i} className="fart-dot" cx={x} cy={y} r="5" />
      ))}
      {/* Drawn around its own centre, then moved onto the rings' centre, so the two cannot drift. */}
      <path
        className="fart-mark"
        transform="translate(91 90)"
        d="M0-16a12 12 0 0 0-12 12c0 8 12 20 12 20s12-12 12-20a12 12 0 0 0-12-12z"
      />
      {[52, 78, 104].map((y, i) => (
        <g key={y}>
          <rect className="fart-line" x="182" y={y} width={54 - i * 8} height="6" rx="3" />
          <rect className="fart-dim" x="182" y={y + 12} width={30 - i * 6} height="5" rx="2.5" />
        </g>
      ))}
    </Frame>
  ),
  export: (
    <Frame>
      <rect className="fart-card" x="52" y="18" width="120" height="144" rx="10" />
      <path className="fart-stroke" d="M138 18v30h34" />
      {[62, 80, 98, 116].map((y, i) => (
        <rect
          key={y}
          className={i === 0 ? "fart-line" : "fart-dim"}
          x="70"
          y={y}
          width={84 - i * 12}
          height="6"
          rx="3"
        />
      ))}
      <rect className="fart-chip" x="150" y="112" width="62" height="24" rx="8" />
      <rect className="fart-chip" x="150" y="142" width="62" height="24" rx="8" />
    </Frame>
  ),
};

export default function FeatureArt({ feature }: { feature: Feature }) {
  return <div className="upsell-art">{ART[feature]}</div>;
}
