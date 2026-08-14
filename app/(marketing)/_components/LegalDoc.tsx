import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

export type LegalSection = { heading: string; paragraphs: string[] };

export default function LegalDoc({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="lp-legal">
      <div className="lp-wrap">
        <Link className="lp-legal-back" href="/">
          <span className="lp-mark">
            <BrandLogo size={22} />
          </span>
          Voltar ao Leilão Index
        </Link>

        <h1>{title}</h1>
        <p className="lp-legal-meta">Última atualização: {updatedAt}</p>
        <p className="lp-legal-intro">{intro}</p>

        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </section>
        ))}

        <p className="lp-legal-meta">
          Dúvidas sobre este documento:{" "}
          <a href="mailto:contato@leilaoindex.com.br">contato@leilaoindex.com.br</a>
        </p>
      </div>
    </main>
  );
}
