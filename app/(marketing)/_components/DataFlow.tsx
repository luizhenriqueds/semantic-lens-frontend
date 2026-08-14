// Three stages - inputs, engine, outputs - with the nodes as real DOM text and the SVG reduced to
// the connectors between them. Same drawing rules as UseSpots: stroke-first, three tones from the
// palette, no perspective, no gradients.

type FlowNode = { key: string; label: string; glyph: React.ReactNode };

/* ---------- input glyphs ---------- */

// Filled so the stack occludes; three stroke-only sheets turn to mud at chip size.
const sheets = (
  <>
    <path className="g-sheet" d="M-1 -9h11v15h-11z" />
    <path className="g-sheet" d="M-4 -7h11v15h-11z" />
    <path className="g-sheet-front" d="M-7 -5h11v15h-11z" />
  </>
);

const pin = (
  <>
    <path className="g-line" d="M0 7c0-4 4-5.5 4-9a4 4 0 0 0-8 0c0 3.5 4 5 4 9z" />
    <circle className="g-solid" cx="0" cy="-2" r="1.8" />
  </>
);

const tag = (
  <>
    <path className="g-line" d="M-7 -1 -1 -7h6v6l-6 6z" />
    <circle className="g-solid" cx="2" cy="-3" r="1.6" />
  </>
);

/* ---------- output glyphs ---------- */

const ring = (
  <>
    <circle className="g-soft" cx="0" cy="0" r="7" />
    <path className="g-line" d="M0 -7a7 7 0 0 1 6 10.5" />
  </>
);

const bars = (
  <>
    <path className="g-line" d="M-6 4v-5M0 4v-9M6 4v-3" />
    <path className="g-mark" d="M-8 -7h16" />
  </>
);

const hex = (
  <>
    <path className="g-soft" d="M0 -7 6 -3.5v7L0 7l-6-3.5v-7z" />
    <circle className="g-solid" cx="0" cy="0" r="2.4" />
  </>
);

const facade = (
  <>
    <path className="g-soft" d="M-6 6v-10l6-3 6 3v10z" />
    <path className="g-line" d="M-3 1h6" />
    <path className="g-mark" d="M-8 -1h16" />
  </>
);

const bell = (
  <>
    <path className="g-line" d="M-5 3c0-6 .8-8 5-8s5 2 5 8z" />
    <path className="g-soft" d="M-7 3h14M-2 6a2 2 0 0 0 4 0" />
  </>
);

const stack = (
  <>
    <path className="g-soft" d="M-7 -4 0-7l7 3-7 3z" />
    <path className="g-line" d="M-7 1 0 4l7-3M-7 5 0 8l7-3" />
  </>
);

const INPUTS: FlowNode[] = [
  { key: "auctions", label: "Anúncios de leilão", glyph: sheets },
  { key: "maps", label: "Mapas e lugares próximos", glyph: pin },
  { key: "market", label: "Preços do mercado aberto", glyph: tag },
];

const OUTPUTS: FlowNode[] = [
  { key: "score", label: "Nota de Investimento", glyph: ring },
  { key: "price", label: "Preço vs. mercado", glyph: bars },
  { key: "region", label: "Análise de região", glyph: hex },
  { key: "facade", label: "Fachada analisada por IA", glyph: facade },
  { key: "alerts", label: "Alertas automatizados", glyph: bell },
  { key: "discovery", label: "Coleções e recomendações", glyph: stack },
];

// Each connector is drawn twice: a dim rail, then a short dash that runs along it. The 180-tall
// viewBox stretches to the grid row, so endpoints are percentages: inputs at 33/50/67%, outputs
// fanning across all six rows at 7/50/93%.
const WIRES_IN = ["M0 59C34 59 30 90 66 90", "M0 90H66", "M0 121C34 121 30 90 66 90"];
const WIRES_OUT = ["M0 90C34 90 30 13 66 13", "M0 90H66", "M0 90C34 90 30 167 66 167"];

function NodeChip({ node }: { node: FlowNode }) {
  return (
    <div className="lp-df-node">
      <i>
        <svg viewBox="-16 -16 32 32" aria-hidden="true">
          {node.glyph}
        </svg>
      </i>
      <span>{node.label}</span>
    </div>
  );
}

/** Wires on wide screens; a plain arrow once the stages stack. */
function Connector({ wires, className }: { wires: string[]; className: string }) {
  return (
    <div className={`lp-df-link ${className}`} aria-hidden="true">
      {/* preserveAspectRatio="none" lets the wire fill whatever height the row settles on;
          non-scaling-stroke keeps the line weight and the dash pattern from stretching with it. */}
      <svg className="lp-df-wire" viewBox="0 0 66 180" preserveAspectRatio="none">
        {wires.map((d) => (
          <path className="f-rail" d={d} key={d} vectorEffect="non-scaling-stroke" />
        ))}
        {wires.map((d, i) => (
          <path
            className="f-live"
            d={d}
            key={`live-${d}`}
            vectorEffect="non-scaling-stroke"
            style={{ animationDelay: `${-0.45 * i}s` }}
          />
        ))}
      </svg>
      <svg className="lp-df-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 5v14m0 0-6-6m6 6 6-6" />
      </svg>
    </div>
  );
}

// Content is placed explicitly on the wide grid so the three cells share a row of equal height.
// Stacked, the DOM order is already correct.
export default function DataFlow() {
  return (
    <div className="lp-dataflow lp-reveal">
      <div className="lp-df-stages">
        <div className="lp-df-in">
          {INPUTS.map((n) => (
            <NodeChip node={n} key={n.key} />
          ))}
        </div>

        <Connector wires={WIRES_IN} className="lp-df-link-in" />

        <div className="lp-df-mid">
          <div className="lp-df-engine">
            <svg viewBox="0 0 120 96" aria-hidden="true">
              <path className="e-plate" d="M60 62 104 79 60 96 16 79z" />
              <path className="e-plate" d="M60 40 104 57 60 74 16 57z" />
              <path className="e-plate-top" d="M60 18 104 35 60 52 16 35z" />
              <path className="e-edge" d="M38 43.5 82 60.5M60 26 60 44" />
              <path className="e-sweep" d="M22 35H98" />
            </svg>
          </div>
        </div>

        <Connector wires={WIRES_OUT} className="lp-df-link-out" />

        <div className="lp-df-out">
          {OUTPUTS.map((n) => (
            <NodeChip node={n} key={n.key} />
          ))}
        </div>
      </div>
    </div>
  );
}
