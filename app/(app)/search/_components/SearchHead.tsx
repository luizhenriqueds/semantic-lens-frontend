import SearchHero from "@/components/search/SearchHero";

// Shared by the page and its loading shell, so a navigation into /search lands on the same
// markup it settles on.
export default function SearchHead({
  query = "",
  aside,
}: {
  query?: string;
  aside?: React.ReactNode;
}) {
  return (
    <>
      <div className="pagehead searchhead">
        <div>
          <h1>Explorar imóveis</h1>
          <p>
            Escreva o que procura com suas palavras. A busca semântica entende o objetivo e ordena
            os resultados pelos que mais combinam.
          </p>
        </div>
        {aside}
      </div>

      <SearchHero label="" sub="" initial={query} />
    </>
  );
}
