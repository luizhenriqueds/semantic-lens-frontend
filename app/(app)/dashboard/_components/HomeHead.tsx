export default function HomeHead({
  greeting,
  hasFavorites,
}: {
  greeting: string;
  hasFavorites: boolean;
}) {
  return (
    <div className="pagehead">
      <h1>{greeting} Separamos alguns imóveis para você hoje.</h1>
      <p>
        Recomendações montadas a partir dos leilões que fecham agora, dos deságios da base e do que
        você salvou. A seleção muda a cada dia — procurando algo específico? Use a busca.
        {!hasFavorites && " Salve um imóvel e esta página passa a recomendar parecidos."}
      </p>
    </div>
  );
}
