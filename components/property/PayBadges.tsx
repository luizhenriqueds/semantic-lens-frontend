import type { Property } from "@/lib/types";

/** How the arrematante can pay. The row is kept even when the edital offers neither: cards sit
 *  side by side in a grid, and dropping it on some of them pulls every line below out of step. */
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
