/**
 * Rounded frame with the top-right corner open, the tallest bar leaving through the gap. Both tones
 * fall back to currentColor: on a solid background the mark has to read as a single colour.
 */
export default function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <path
        d="M25 9H15a9 9 0 0 0-9 9v14a9 9 0 0 0 9 9h18a9 9 0 0 0 9-9v-14"
        fill="none"
        stroke="var(--brand-tone-b, currentColor)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="var(--brand-tone-b, currentColor)">
        <rect x="12.5" y="27" width="5" height="7" rx="2.5" />
        <rect x="21.75" y="22" width="5" height="12" rx="2.5" />
      </g>
      <rect x="31" y="5" width="5" height="29" rx="2.5" fill="var(--brand-tone-a, currentColor)" />
    </svg>
  );
}
