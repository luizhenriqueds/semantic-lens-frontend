export default function Ring({ value, size = 44 }: { value: number | null; size?: number }) {
  const v = value == null ? 0 : Math.round(value);
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const dash = ((v / 100) * c).toFixed(1);
  return (
    <svg className="score-ring" viewBox="0 0 36 36" width={size} height={size}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--primary-wash)" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c.toFixed(1)}`}
        transform="rotate(-90 18 18)"
      />
      <text
        x="18"
        y="22"
        textAnchor="middle"
        fontFamily="Plus Jakarta Sans"
        fontSize="11"
        fontWeight="700"
        fill="var(--primary)"
      >
        {value == null ? "-" : v}
      </text>
    </svg>
  );
}
