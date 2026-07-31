import Link from "next/link";
import { getEntitlements } from "@/lib/entitlements/server";
import { unlockedHref } from "@/lib/filters/gate";
import type { Entitlements } from "@/lib/entitlements";
import type { MarketDashboard } from "@/lib/data";
import { countShort } from "@/lib/format";

// The insight itself is free; only its link out is dropped, since every one lands on a
// filtered `/properties` view.
function MoreLink({ href, ent, children }: { href: string; ent: Entitlements; children: string }) {
  return unlockedHref(href, ent) ? <Link href={href}>{children} →</Link> : null;
}

export default async function InsightStrip({ d }: { d: MarketDashboard }) {
  const ent = await getEntitlements();
  const pctOfBase = d.kpi.available
    ? Math.round((d.insights.discount_50plus / d.kpi.available) * 100)
    : 0;

  return (
    <div className="insights">
      <div className="ins">
        <div className="lab">Agora</div>
        <div className="big">{countShort(d.timeline.next7)} leilões nos próximos dias</div>
        <p>
          A agenda está concentrada nesta janela - quase tudo com data marcada fecha em poucos dias.
          A triagem é agora.
        </p>
        <MoreLink href="/properties?auction_within_days=7&sort=auction" ent={ent}>
          Ver o que fecha primeiro
        </MoreLink>
      </div>
      <div className="ins">
        <div className="lab">Oportunidade</div>
        <div className="big">
          {countShort(d.insights.discount_50plus)} imóveis com 50%+ de deságio
        </div>
        <p>
          São <b>{pctOfBase}%</b> da base ativa. É onde mora a margem - e onde mais vale conferir a
          matrícula.
        </p>
        <MoreLink href="/properties?min_discount=50&sort=discount" ent={ent}>
          Ver deságios agressivos
        </MoreLink>
      </div>
      <div className="ins">
        <div className="lab">Atenção</div>
        <div className="big">{d.insights.occupied_pct}% da base está ocupada</div>
        <p>
          Só <b>{countShort(d.occ.vacant)}</b> imóveis estão desocupados. E apenas{" "}
          <b>{d.insights.financing_pct}%</b> aceitam financiamento - planeje o caixa.
        </p>
        <MoreLink href="/properties?financing=1&sort=score" ent={ent}>
          Ver com financiamento
        </MoreLink>
      </div>
    </div>
  );
}
