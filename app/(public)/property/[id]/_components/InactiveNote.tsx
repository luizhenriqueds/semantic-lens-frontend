"use client";

import { useInactive } from "./useFreshness";

/** The MV lags a day and the page is cached 6h, so a relisted property would keep this banner
 *  long after the offer came back. The base table settles it. */
export default function InactiveNote({ id, initial }: { id: string; initial: boolean }) {
  if (!useInactive(id, initial)) return null;
  return (
    <div className="inactive-note">
      Anúncio inativo - este imóvel não aparece mais na oferta atual da Caixa.
    </div>
  );
}
