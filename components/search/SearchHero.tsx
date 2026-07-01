import { IconSearch } from "@/lib/icons";

const EXAMPLES = [
  "Casa para família",
  "Comprar, reformar e revender",
  "Aluguel para estudantes",
  "Imóvel com boa liquidez",
];

export default function SearchHero({
  label = "O que você está procurando?",
  sub = "Escreva com suas palavras, como se estivesse falando com um corretor.",
  showExamples = true,
}: {
  label?: string;
  sub?: string;
  initial?: string;
  showExamples?: boolean;
}) {
  return (
    <div className="searchhero">
      <div className="lblrow">
        {label && <div className="lbl">{label}</div>}
        <span className="soon">Em breve</span>
      </div>
      <div className="sub">
        {sub} A busca inteligente por objetivo está sendo preparada e chega em breve.
      </div>
      <div className="bigsearch">
        <div className="field is-soon">
          <IconSearch strokeWidth={1.7} />
          <input disabled aria-disabled placeholder="Busca inteligente chegando em breve" />
        </div>
        <button className="btn solid big" type="button" disabled aria-disabled>
          Buscar
        </button>
      </div>
      {showExamples && (
        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="ex" type="button" disabled aria-disabled>
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
