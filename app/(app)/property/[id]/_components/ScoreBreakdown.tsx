import { showDiscount } from "@/lib/format";
import type { Property } from "@/lib/types";

type Factor = { label: string; value: number | null; hint: string };

export default function ScoreBreakdown({ p }: { p: Property }) {
  const factors: Factor[] = [
    {
      label: "Liquidez",
      value: p.scores.liquidity,
      hint: "facilidade e rapidez para revender no bairro",
    },
    {
      label: "Reforma e revenda",
      value: p.scores.flip,
      hint: "margem estimada entre o lance e o preço de revenda",
    },
    {
      label: "Conveniência da região",
      value: p.scores.convenience,
      hint: "serviços, comércio e transporte por perto",
    },
    {
      label: "Desconto sobre a avaliação",
      value: showDiscount(p) ? p.discount : null,
      hint: "quanto o lance está abaixo do valor de avaliação",
    },
  ].filter((f) => f.value != null);

  if (!factors.length) return null;

  return (
    <details className="scorebreak">
      <summary>Como calculamos a nota de investimento</summary>
      <div className="sb-explain">
        A nota geral de 0 a 100 é um índice ponderado que combina os sinais abaixo — quanto mais
        fortes, maior a nota final.
      </div>
      <div className="sb-factors">
        {factors.map((f) => {
          const v = Math.round(f.value!);
          return (
            <div className="sb-factor" key={f.label}>
              <div className="sb-f-top">
                <span className="sb-f-label">{f.label}</span>
                <span className="sb-f-val">{v}</span>
              </div>
              <div className="sb-f-track">
                <i style={{ width: `${Math.min(100, v)}%` }} />
              </div>
              <div className="sb-f-hint">{f.hint}</div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
