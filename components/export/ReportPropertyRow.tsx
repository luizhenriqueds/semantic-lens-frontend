import { fmtDay, money } from "@/lib/format";
import type { Property } from "@/lib/types";

/** Flat listing row for the reports. PropertyRow is not reused: its FavoriteButton would fire an
 *  authenticated request and draw a heart into the PDF. */
export default function ReportPropertyRow({ p }: { p: Property }) {
  return (
    <div className="report-row">
      <div>
        <b>{p.title}</b>
        <span className="where">
          {[p.neighborhood, `${p.city}/${p.uf}`].filter(Boolean).join(" · ")}
          {p.area != null && ` · ${p.area} m²`}
          {p.bedrooms != null && ` · ${p.bedrooms} dorm.`}
          {p.auctionDate && ` · leilão em ${fmtDay(p.auctionDate)}`}
        </span>
      </div>
      <div className="val">
        {money(p.saleValue)}
        {p.discount != null && <small>{Math.round(p.discount)}% de deságio</small>}
      </div>
    </div>
  );
}
