import { showDiscount } from "@/lib/format";
import type { Property, ScoreExplain } from "@/lib/types";

type Factor = { label: string; value: number | null; hint: string };

function fmtPts(n: number): string {
  const s = Math.abs(n).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return `${n < 0 ? "−" : "+"}${s} pts`;
}

function ExplainBreakdown({ explain }: { explain: ScoreExplain }) {
  const { terms } = explain;
  const maxContrib = Math.max(1, ...terms.map((t) => t.contribution ?? 0));
  const lines = explain.summary?.split(/\s+(?=O que pesa contra:)/) ?? [];

  return (
    <details className="scorebreak">
      <summary>Como calculamos a nota de investimento</summary>
      {lines.length > 0 && (
        <div className="sb-explain">
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
      {terms.length > 0 && (
        <div className="sb-factors">
          {terms.map((t) => (
            <div className={`sb-factor imp-${t.impact ?? "neutro"}`} key={t.feature || t.label}>
              <div className="sb-f-top">
                <span className="sb-f-label">{t.label}</span>
                {t.contribution != null && (
                  <span className="sb-f-val">{fmtPts(t.contribution)}</span>
                )}
              </div>
              <div className="sb-f-track">
                <i
                  style={{ width: `${Math.round(((t.contribution ?? 0) / maxContrib) * 100)}%` }}
                />
              </div>
              {t.detail && <div className="sb-f-hint">{t.detail}</div>}
            </div>
          ))}
        </div>
      )}
    </details>
  );
}

export default function ScoreBreakdown({
  p,
  explain,
}: {
  p: Property;
  explain?: ScoreExplain | null;
}) {
  if (explain && (explain.summary || explain.terms.length)) {
    return <ExplainBreakdown explain={explain} />;
  }

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
