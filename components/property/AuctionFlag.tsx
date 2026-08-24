import { auctionPassed } from "@/lib/auctionTime";
import type { Property } from "@/lib/types";

/** Caixa leaves run auctions listed for days, so a past date is stale metadata, not a delisting:
 *  the row is flagged, not hidden. Silent on an inactive row - `Inativo` already says more. */
export default function AuctionFlag({ p }: { p: Property }) {
  if (p.inactive || !auctionPassed(p, new Date())) return null;
  return <span className="pastflag">Leilão já ocorreu</span>;
}
