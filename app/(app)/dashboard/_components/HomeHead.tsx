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
        A seleção muda todo dia. Procurando algo específico? Use a busca.
        {!hasFavorites && " Salve um imóvel e passamos a recomendar parecidos."}
      </p>
    </div>
  );
}
