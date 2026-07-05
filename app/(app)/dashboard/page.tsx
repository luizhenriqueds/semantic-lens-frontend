import Link from "next/link";
import CollectionCard from "@/components/groups/CollectionCard";
import SearchHero from "@/components/search/SearchHero";
import { clusterStats } from "@/lib/clusterStats";
import { getClusters, getProperties } from "@/lib/data";

export default async function HomePage() {
  const [clusters, properties] = await Promise.all([getClusters(), getProperties()]);
  const activeProperties = properties.filter((p) => !p.inactive);

  return (
    <section className="view">
      <div className="pagehead">
        <h1>Olá, Luiz H. Vamos encontrar uma boa oportunidade?</h1>
        <p>
          Diga o que você procura e nós comparamos milhares de imóveis de leilão para mostrar os que
          mais combinam com o seu objetivo.
        </p>
      </div>

      <SearchHero />

      <div className="steps">
        <div className="step">
          <div className="num">1</div>
          <b>Diga o que procura</b>
          <p>Use a busca ou escolha um objetivo, como reforma ou aluguel.</p>
        </div>
        <div className="step">
          <div className="num">2</div>
          <b>Veja a nota de cada imóvel</b>
          <p>Damos uma nota de 0 a 100 para cada objetivo, com base nos dados.</p>
        </div>
        <div className="step">
          <div className="num">3</div>
          <b>Acompanhe na carteira</b>
          <p>Salve os imóveis que gostou e receba avisos antes do leilão.</p>
        </div>
      </div>

      <div className="sectitle">
        <h2>Coleções recomendadas para você</h2>
        <Link href="/groups">Ver todas →</Link>
      </div>
      <p
        style={{
          margin: "-8px 0 16px",
          color: "var(--ink-soft)",
          fontSize: "14.5px",
          maxWidth: "64ch",
        }}
      >
        Grupos de imóveis parecidos, reunidos para combinar com cada objetivo de investimento. Abra
        uma coleção para ver os imóveis dentro dela.
      </p>
      <div className="plgrid">
        {clusters.slice(0, 3).map((c) => (
          <CollectionCard
            key={c.clusterId}
            c={c}
            stats={clusterStats(activeProperties, c.clusterId)}
          />
        ))}
      </div>
    </section>
  );
}
