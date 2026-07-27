import type { Reason } from "@/lib/discovery";

export default function ReasonChips({ reasons }: { reasons: Reason[] }) {
  if (!reasons.length) return null;
  return (
    <div className="why-row">
      {reasons.map((r) => (
        <span key={r.key} className={`chip${r.tone === "plain" ? "" : ` ${r.tone}`}`}>
          <i className="dot" />
          {r.text}
        </span>
      ))}
    </div>
  );
}
