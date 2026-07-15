import Link from "next/link";
import type { Cluster } from "@/lib/types";
import type { ClusterStats } from "@/lib/clusters";
import { moneyShort, PROFILE_LABEL } from "@/lib/format";
import ClusterThumb from "./ClusterThumb";

export default function CollectionCard({ c, stats }: { c: Cluster; stats?: ClusterStats }) {
  const count = stats ? stats.count : c.size;
  const hasRange =
    stats && stats.minPrice != null && stats.maxPrice != null && stats.minPrice !== stats.maxPrice;

  const tiles: { v: string; k: string; pos?: boolean }[] = [];
  if (stats) {
    if (stats.medianPrice != null)
      tiles.push({ v: moneyShort(stats.medianPrice), k: "Preço mediano" });
    if (stats.medianDiscount != null)
      tiles.push({ v: `−${Math.round(stats.medianDiscount)}%`, k: "Desconto mediano", pos: true });
    if (stats.avgScore != null) tiles.push({ v: String(stats.avgScore), k: "Nota média" });
    if (stats.avgAge != null)
      tiles.push({ v: `${stats.avgAge} ${stats.avgAge === 1 ? "ano" : "anos"}`, k: "Idade média" });
  }

  return (
    <div className="plcard">
      {/* Stretched link makes the whole card open the group's imóveis list */}
      <Link className="plmain" href={`/properties?cluster=${c.clusterId}`} aria-label={c.label} />
      <div className="plcover">
        <ClusterThumb images={stats?.sampleImages ?? []} label={c.label} />
        <span className="plcount">{count} imóveis</span>
      </div>
      <div className="plbody">
        <h3>{c.label}</h3>
        {c.description && <p>{c.description}</p>}
        {stats && stats.count > 0 && (
          <div className="plmetrics">
            {tiles.length > 0 && (
              <div className="pltiles">
                {tiles.map((t) => (
                  <div className="pltile" key={t.k}>
                    <div className={`v${t.pos ? " pos" : ""}`}>{t.v}</div>
                    <div className="k">{t.k}</div>
                  </div>
                ))}
              </div>
            )}
            {hasRange && (
              <div className="plrange">
                <div className="plrange-l">
                  <span>{moneyShort(stats.minPrice)}</span>
                  <span>faixa de preço</span>
                  <span>{moneyShort(stats.maxPrice)}</span>
                </div>
                <div className="plrange-bar" />
              </div>
            )}
            {stats.topCity && (
              <div className="plcities">
                {stats.cityCount > 1 ? (
                  <>
                    <b>{stats.cityCount}</b> cidades · maioria em <b>{stats.topCity}</b>
                  </>
                ) : (
                  <>
                    em <b>{stats.topCity}</b>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <div className="foot">
          {c.profile && <span className="perfil">{PROFILE_LABEL[c.profile]}</span>}
          <Link className="open" href={`/properties?cluster=${c.clusterId}&view=analysis`}>
            Ver análise ›
          </Link>
        </div>
      </div>
    </div>
  );
}
