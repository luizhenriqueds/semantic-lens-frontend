import type { Property } from "@/lib/types";

function tier(v: number, labels: [string, string, string, string]): string {
  if (v < 25) return labels[0];
  if (v < 50) return labels[1];
  if (v < 75) return labels[2];
  return labels[3];
}

type Rank = { key: string; label: string; value: number; tag: string; hint: string };

export default function PropertyRanks({ p }: { p: Property }) {
  const ranks: Rank[] = [];
  if (p.sizeRank != null) {
    ranks.push({
      key: "size",
      label: "Porte",
      value: p.sizeRank,
      tag: tier(p.sizeRank, ["Compacto", "Médio", "Amplo", "Muito amplo"]),
      hint: `Maior que ${Math.round(p.sizeRank)}% dos imóveis avaliados`,
    });
  }
  if (p.priceRank != null) {
    ranks.push({
      key: "price",
      label: "Faixa de preço",
      value: p.priceRank,
      tag: tier(p.priceRank, ["Econômico", "Abaixo da média", "Acima da média", "Premium"]),
      hint: `Mais caro que ${Math.round(p.priceRank)}% dos imóveis avaliados`,
    });
  }
  if (!ranks.length) return null;

  return (
    <div className="infoblock rankblock">
      <h3>Porte e preço</h3>
      <p className="ansub">Posição deste imóvel entre os demais acompanhados.</p>
      <div className="sb-factors">
        {ranks.map((r) => (
          <div className="sb-factor" key={r.key}>
            <div className="sb-f-top">
              <span className="sb-f-label">{r.label}</span>
              <span className="sb-f-val">{r.tag}</span>
            </div>
            <div className="sb-f-track">
              <i style={{ width: `${Math.min(100, Math.max(0, r.value))}%` }} />
            </div>
            <div className="sb-f-hint">{r.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
