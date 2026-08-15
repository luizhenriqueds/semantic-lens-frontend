import type { Metadata } from "next";
import PropertiesClient from "@/app/(app)/properties/_components/PropertiesClient";
import JsonLd from "@/components/seo/JsonLd";
import SeoLinks from "@/components/seo/SeoLinks";
import { countProperties } from "@/lib/data";
import { parsePropertySearchParams } from "@/lib/filters/propertiesUrl";
import { nImoveis } from "@/lib/format";
import { loadPropertiesView } from "@/lib/properties/loadPropertiesView";
import { breadcrumbLd, faqLd } from "@/lib/seo/jsonLd";

export const dynamic = "force-dynamic";

// The hub owns the head term. There is deliberately no /leilao-de-imoveis/caixa child: the whole
// base is Caixa, so a second page would be this one's duplicate.
const H1 = "Leilão de imóveis da Caixa";

const LEAD =
  "de leilão e venda direta da Caixa Econômica Federal em todo o Brasil, cada um com uma Nota de Investimento de 0 a 100 calculada a partir do desconto real, do preço por m² frente ao mercado e da qualidade da região.";

const BODY = [
  "A Caixa é hoje a maior vendedora de imóveis retomados do país. Os imóveis chegam à base por retomada de financiamento e são ofertados em três caminhos: 1º Leilão, com lance mínimo em torno do valor de avaliação; 2º Leilão, quando não há arremate na primeira praça e o mínimo cai; e venda direta, por proposta, sem disputa ao vivo.",
  "Lemos essa base todo dia, organizamos e pontuamos. O desconto sobre a avaliação é só metade da história — ele compara o lance com o valor que a própria Caixa atribuiu ao imóvel. A outra metade é o mercado: calculamos o preço mediano por m² de imóveis parecidos anunciados na mesma região, usando portais do mercado aberto e ignorando portais de leilão de propósito, para a comparação ser sempre com o mercado normal.",
  "A região entra com peso próprio. Medimos a distância real de cada imóvel até escolas, hospitais, supermercados, parques, farmácias e transporte — não apenas quantos existem no bairro. Uma universidade a 700 m pesa no aluguel estudantil; um parque a 200 m pesa na moradia familiar. Quando há foto, um modelo de visão também dá uma nota à fachada e ao estado de conservação.",
  "Nada disso substitui o edital. A nota não lê a situação jurídica, não sabe de dívida de condomínio, ação judicial ou custo de desocupação, e não é recomendação de investimento — ela serve para decidir quais imóveis merecem a sua leitura do edital. O lance é sempre dado no canal oficial da Caixa.",
];

const FAQ = [
  {
    q: "Como funciona o leilão de imóveis da Caixa?",
    a: "A Caixa oferta imóveis retomados em três modalidades: 1º Leilão, com lance mínimo próximo ao valor de avaliação; 2º Leilão, quando não há arremate na primeira praça e o valor mínimo cai; e venda direta, em que o comprador envia uma proposta sem disputa ao vivo. Cada imóvel tem um edital com as regras de pagamento, as dívidas transferidas ao arrematante e a situação de ocupação.",
  },
  {
    q: "Vale a pena comprar imóvel em leilão da Caixa?",
    a: "Os descontos são reais, mas raramente gratuitos: um desconto alto costuma vir de imóvel ocupado, região de baixa liquidez ou necessidade de reforma. Existimos para tornar esse trade-off visível, cruzando o desconto com o preço de mercado da região, a qualidade do entorno e a facilidade de revenda.",
  },
  {
    q: "Preciso pagar à vista?",
    a: "Depende do imóvel. Boa parte dos leilões exige pagamento à vista em prazo curto, mas parte do acervo aceita financiamento da própria Caixa e uso do FGTS. O edital de cada imóvel informa qual é o caso, e dá para filtrar só os que aceitam.",
  },
  {
    q: "Preciso entender de leilão para usar o Leilão Index?",
    a: "Não. Você descreve o que procura em linguagem natural e traduzimos isso em filtros e notas. Para dar o lance, aí sim vale estudar o edital: é lá que estão as regras de pagamento, as dívidas do imóvel e a situação de ocupação.",
  },
  {
    q: "O Leilão Index é ligado à Caixa?",
    a: "Não. O Leilão Index é independente: coletamos, organizamos e analisamos a base pública de leilões e venda direta da Caixa Econômica Federal. Não somos afiliados, patrocinados nem endossados pela Caixa, não intermediamos lances e não recebemos comissão sobre arremates.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const total = await countProperties({});
  return {
    title: "Leilão de imóveis da Caixa — imóveis com desconto e nota",
    description: `${nImoveis(total)} ${LEAD}`,
    alternates: { canonical: "/leilao-de-imoveis" },
    openGraph: {
      url: "/leilao-de-imoveis",
      title: "Leilão de imóveis da Caixa — imóveis com desconto e nota",
      description: `${nImoveis(total)} ${LEAD}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function LeilaoHubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const data = await loadPropertiesView(parsePropertySearchParams(sp));
  const total = data.list?.total ?? 0;

  return (
    <section className="view">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Início", path: "/" },
            { name: "Leilão de imóveis", path: "/leilao-de-imoveis" },
          ]),
          faqLd(FAQ),
        ]}
      />

      <PropertiesClient
        {...data}
        heading={{ h1: H1, lead: `${nImoveis(total)} ${LEAD}` }}
        exitTo={{ path: "/properties", query: "" }}
      />

      <section className="seobody">
        <div className="seobody-prose">
          {BODY.map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
        </div>

        <div className="seobody-faq">
          <h2>Perguntas frequentes</h2>
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>

        <SeoLinks className="seolinks-inpage" />
      </section>
    </section>
  );
}
