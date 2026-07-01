import Link from "next/link";

export default function NotFound() {
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Página não encontrada</h1>
        <p>O conteúdo que você procura não existe ou foi removido.</p>
      </div>
      <Link className="btn solid" href="/" style={{ display: "inline-flex" }}>
        Voltar ao início
      </Link>
    </section>
  );
}
