/**
 * Index bars between brackets, the tallest one breaking past the bracket line. Painted with
 * --brand-tone-a (accent) and --brand-tone-b (neutral), both falling back to currentColor: on a
 * solid background the mark has to read as a single colour, which is how every lockup uses it.
 */
export default function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <g
        fill="none"
        stroke="var(--brand-tone-b, currentColor)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 11H6v26h5" />
        <path d="M37 11h5v26h-5" />
      </g>
      <rect
        x="14.5"
        y="26"
        width="5"
        height="7"
        rx="2.5"
        fill="var(--brand-tone-b, currentColor)"
      />
      <rect
        x="21.5"
        y="21"
        width="5"
        height="12"
        rx="2.5"
        fill="var(--brand-tone-b, currentColor)"
      />
      <rect
        x="28.5"
        y="4"
        width="5"
        height="29"
        rx="2.5"
        fill="var(--brand-tone-a, currentColor)"
      />
    </svg>
  );
}
