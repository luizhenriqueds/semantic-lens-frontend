import type { Property } from "@/lib/types";

/** Kept even when empty: cards are grid siblings, and dropping the row misaligns the rest. */
export default function PayBadges({ p }: { p: Property }) {
  const labels = [
    p.acceptsFinancing ? "Financiamento" : null,
    p.acceptsFgts ? "FGTS" : null,
  ].filter((l): l is string => l != null);

  return (
    <div className="paybadges" aria-hidden={labels.length === 0}>
      {labels.map((l) => (
        <span className="paybadge" key={l}>
          {l}
        </span>
      ))}
    </div>
  );
}
