// Spot illustrations for the "notas de uso" cards.
//
// The rule is "instruments, not scenery": every drawing is built from the same
// five primitives the product already uses to show data - the hex cell, the
// score ring, the bar row, the map pin and the distance arc. Nothing is drawn
// in perspective, there are no gradients, and each spot gets at most one
// --warn accent to mark the subject. All of them sit on a 96 grid.

type SpotProps = { className?: string };

const wrap = (children: React.ReactNode, className?: string) => (
  <svg
    className={`lp-spot${className ? ` ${className}` : ""}`}
    viewBox="0 0 96 96"
    aria-hidden="true"
  >
    {children}
  </svg>
);

// Moradia familiar - a pin at the centre with the services ringed around it.
export const SpotFamily = ({ className }: SpotProps) =>
  wrap(
    <>
      <circle className="s-fill" cx="48" cy="52" r="34" />
      <circle className="s-soft" cx="48" cy="52" r="34" />
      <circle className="s-soft" cx="48" cy="52" r="22" />
      <path className="s-line" d="M34 56v-12l14-10 14 10v12" />
      <path className="s-line" d="M43 56v-8h10v8" />
      <circle className="s-solid" cx="48" cy="18" r="3.5" />
      <circle className="s-solid" cx="18" cy="62" r="3.5" />
      <circle className="s-solid" cx="78" cy="62" r="3.5" />
      <circle className="s-mark" cx="48" cy="52" r="6" />
    </>,
    className,
  );

// Temporada - a month strip with the booked nights filled in.
export const SpotSeason = ({ className }: SpotProps) =>
  wrap(
    <>
      <rect className="s-fill" x="12" y="22" width="72" height="58" rx="8" />
      <rect className="s-line" x="12" y="22" width="72" height="58" rx="8" />
      <path className="s-line" d="M12 40h72M32 14v14M64 14v14" />
      <rect className="s-solid" x="24" y="50" width="12" height="10" rx="2" />
      <rect className="s-solid" x="42" y="50" width="12" height="10" rx="2" />
      <rect className="s-solid" x="60" y="50" width="12" height="10" rx="2" />
      <rect className="s-mark" x="24" y="66" width="12" height="10" rx="2" />
      <rect className="s-soft" x="42" y="66" width="12" height="10" rx="2" />
    </>,
    className,
  );

// Estudantil - a mortarboard sitting inside the walking-distance ring.
export const SpotStudent = ({ className }: SpotProps) =>
  wrap(
    <>
      <circle className="s-fill" cx="48" cy="50" r="33" />
      <circle className="s-soft" cx="48" cy="50" r="33" />
      <path className="s-line" d="M18 44 48 30l30 14-30 14z" />
      <path className="s-line" d="M30 51v13c0 4 8 7 18 7s18-3 18-7V51" />
      {/* the tassel doubles as the single accent */}
      <path className="s-mark" d="M72 49v9" />
      <circle className="s-mark" cx="72" cy="62" r="3" />
    </>,
    className,
  );

// Reforma e revenda - a value curve climbing to a marked exit point.
export const SpotFlip = ({ className }: SpotProps) =>
  wrap(
    <>
      <path className="s-fill" d="M14 74h68v8H14z" />
      <rect className="s-soft" x="18" y="54" width="12" height="20" rx="2" />
      <rect className="s-soft" x="36" y="44" width="12" height="30" rx="2" />
      <rect className="s-line" x="54" y="34" width="12" height="40" rx="2" />
      <rect className="s-solid" x="72" y="22" width="12" height="52" rx="2" />
      <path className="s-line" d="M14 74h68" />
      <circle className="s-mark" cx="78" cy="14" r="5" />
    </>,
    className,
  );

// Liquidez - a queue of listings clearing, fastest first.
export const SpotLiquidity = ({ className }: SpotProps) =>
  wrap(
    <>
      <rect className="s-fill" x="12" y="20" width="72" height="56" rx="8" />
      <rect className="s-solid" x="22" y="32" width="52" height="8" rx="4" />
      <rect className="s-line" x="22" y="48" width="38" height="8" rx="4" />
      <rect className="s-soft" x="22" y="64" width="22" height="8" rx="4" />
      <path className="s-mark" d="M64 62l6 6 12-14" />
    </>,
    className,
  );

// Comercial - street-level movement around the unit.
export const SpotCommercial = ({ className }: SpotProps) =>
  wrap(
    <>
      <rect className="s-fill" x="14" y="30" width="68" height="46" rx="6" />
      <rect className="s-line" x="14" y="30" width="68" height="46" rx="6" />
      <path className="s-line" d="M14 44h68" />
      <path className="s-line" d="M10 30l6-10h64l6 10" />
      <rect className="s-solid" x="38" y="54" width="20" height="22" rx="2" />
      <circle className="s-mark" cx="70" cy="60" r="5" />
    </>,
    className,
  );
