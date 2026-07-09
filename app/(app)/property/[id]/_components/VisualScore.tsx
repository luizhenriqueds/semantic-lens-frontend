import type { Property } from "@/lib/types";
import { VISUAL_AGE_LABEL } from "@/lib/format";
import { IconInfo } from "@/lib/icons";

export default function VisualScore({ p }: { p: Property }) {
  if (p.visualScore == null && !p.visualNote && !p.visualAge) return null;
  const age = p.visualAge ? VISUAL_AGE_LABEL[p.visualAge] : null;

  return (
    <details className="visualscore">
      <summary>
        {p.visualScore != null && <span className="vs-grade">{Math.round(p.visualScore)}</span>}
        <span className="vs-label">Avaliação visual da imagem/fachada</span>
        <IconInfo className="vs-info" width={16} height={16} strokeWidth={1.8} aria-hidden />
      </summary>

      <div className="vs-panel">
        <p className="vs-intro">
          Nota de 0 a 100 atribuída à foto do anúncio a partir de aspectos visuais como fachada,
          acabamento e conservação.
        </p>

        {p.visualNote && <p className="vs-note">{p.visualNote}</p>}

        {age && (
          <div className="vs-flags">
            <span className="vs-flag">Idade aparente: {age}</span>
          </div>
        )}
      </div>
    </details>
  );
}
