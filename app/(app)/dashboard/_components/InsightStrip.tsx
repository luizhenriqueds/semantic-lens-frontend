import Link from "next/link";
import type { MarketDashboard } from "@/lib/data";
import { countShort } from "@/lib/format";

export default function InsightStrip({ d }: { d: MarketDashboard }) {
  const pctOfBase = d.kpi.available
    ? Math.round((d.insights.discount_50plus / d.kpi.available) * 100)
    : 0;

  return (
    <div className="insights">
      <div className="ins">
        <div className="lab">Agora</div>
        <div className="big">{countShort(d.timeline.next7)} leilões nos próximos dias</div>
        <p>
          A agenda está concentrada nesta janela — quase tudo com data marcada fecha em poucos dias.
          A triagem é agora.
        </p>
        <Link href="/properties?prazo=7&sort=leilao">Ver o que fecha primeiro →</Link>
      </div>
      <div className="ins">
        <div className="lab">Oportunidade</div>
        <div className="big">
          {countShort(d.insights.discount_50plus)} imóveis com 50%+ de deságio
        </div>
        <p>
          São <b>{pctOfBase}%</b> da base ativa. É onde mora a margem — e onde mais vale conferir a
          matrícula.
        </p>
        <Link href="/properties?desconto=50&sort=desconto">Ver deságios agressivos →</Link>
      </div>
      <div className="ins">
        <div className="lab">Atenção</div>
        <div className="big">{d.insights.occupied_pct}% da base está ocupada</div>
        <p>
          Só <b>{countShort(d.occ.vacant)}</b> imóveis estão desocupados. E apenas{" "}
          <b>{d.insights.financing_pct}%</b> aceitam financiamento — planeje o caixa.
        </p>
        <Link href="/properties?fin=1&sort=score">Ver com financiamento →</Link>
      </div>
    </div>
  );
}
