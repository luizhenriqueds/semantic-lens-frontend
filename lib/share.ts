import { fmtDate, money, showDiscount, titleCase } from "@/lib/format";
import type { Property } from "@/lib/types";

/** The message body. The URL travels separately so the share target can place it itself. */
export function shareText(p: Property, heading: string): string {
  const where = p.neighborhood
    ? `${titleCase(p.neighborhood)}, ${titleCase(p.city)}/${p.uf}`
    : `${titleCase(p.city)}/${p.uf}`;

  const price = p.saleValue ? money(p.saleValue) : null;
  const off = showDiscount(p) ? `${Math.round(p.discount!)}% abaixo da avaliação` : null;
  const date = fmtDate(p.auctionDate);
  const when = date ? `Leilão da Caixa em ${date}` : "Imóvel da Caixa";
  const note = p.scores.investment != null ? `Nota ${p.scores.investment}/100` : null;

  return [
    `${heading} - ${where}`,
    [price, off].filter(Boolean).join(" · "),
    [when, note].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join("\n");
}

export const whatsappHref = (text: string, url: string): string =>
  `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
