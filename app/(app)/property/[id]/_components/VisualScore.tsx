import type { Property } from "@/lib/types";
import { IconInfo } from "@/lib/icons";

const ASPECTS: { key: keyof NonNullable<Property["visualDetails"]>; label: string }[] = [
  { key: "facade", label: "Fachada" },
  { key: "standard", label: "Padrão de acabamento" },
  { key: "condition", label: "Conservação" },
  { key: "surroundings", label: "Entorno" },
];

export default function VisualScore({ p }: { p: Property }) {
  if (p.visualScore == null) return null;
  const d = p.visualDetails;
  const aspects = ASPECTS.map((a) => ({ ...a, value: d?.[a.key] as number | null })).filter(
    (a) => a.value != null,
  );

  return (
    <details className="visualscore">
      <summary>
        <span className="vs-grade">{Math.round(p.visualScore)}</span>
        <span className="vs-label">Avaliação visual da imagem/fachada</span>
        <IconInfo className="vs-info" width={16} height={16} strokeWidth={1.8} aria-hidden />
      </summary>

      <div className="vs-panel">
        <p className="vs-intro">
          Nota de 0 a 100 atribuída à foto do anúncio a partir de aspectos visuais como fachada,
          acabamento e conservação.
        </p>

        {aspects.length > 0 && (
          <div className="sb-factors">
            {aspects.map((a) => {
              const pct = Math.min(100, Math.max(0, a.value! * 10));
              return (
                <div className="sb-factor" key={a.key}>
                  <div className="sb-f-top">
                    <span className="sb-f-label">{a.label}</span>
                    <span className="sb-f-val">{a.value!.toLocaleString("pt-BR")}/10</span>
                  </div>
                  <div className="sb-f-track">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {d?.note && <p className="vs-note">{d.note}</p>}

        {(d?.needsRenovation || d?.isPropertyPhoto === false) && (
          <div className="vs-flags">
            {d?.needsRenovation && (
              <span className="vs-flag warn">Aparenta precisar de reforma</span>
            )}
            {d?.isPropertyPhoto === false && (
              <span className="vs-flag">A imagem pode não ser do imóvel</span>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
