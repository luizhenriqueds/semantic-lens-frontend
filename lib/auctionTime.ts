import type { Property } from "@/lib/types";

/** `auction_date` stores the auction's Brazilian wall clock but labels it `+00:00`, so parsing it
 *  straight lands three hours early. Brazil dropped DST in 2019, so the offset is a constant.
 *  Anchoring here turns the field into an instant, which then compares the same in any timezone. */
export const BRT_OFFSET_MS = 3 * 3_600_000;

/** Null for the open-ended listings, which never expire and must never be filtered out. */
export function auctionInstant(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return isNaN(t) ? null : t + BRT_OFFSET_MS;
}

export function auctionPassed(p: Property, now: Date): boolean {
  const at = auctionInstant(p.auctionDate);
  return at != null && at <= now.getTime();
}

/** Soft and client-side: the base keeps run auctions listable because Caixa re-offers a good share
 *  of them, so a stale row should cost a dashboard card, not a catalogue row. */
export const stillOpen = (pool: readonly Property[], now: Date): Property[] =>
  pool.filter((p) => !auctionPassed(p, now));
