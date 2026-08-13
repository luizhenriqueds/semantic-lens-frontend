import { ufName } from "./ufs";

export type LandingGroup = "estados" | "capitais" | "tipos" | "preco" | "modalidade";

export type LandingSpec =
  | { kind: "uf"; uf: string }
  | { kind: "city"; uf: string; citySlug: string }
  | { kind: "type"; typeSlug: string }
  // Matched against the normalized modality value: every token must be present, so the exact
  // catalogue spelling ("1º Leilão" vs "1o Leilao") does not matter.
  | { kind: "modality"; tokens: string[] }
  | { kind: "price"; maxPrice: number }
  | { kind: "discount"; minDiscount: number }
  | { kind: "payment"; financing?: true; fgts?: true };

export type SeoLanding = {
  slug: string;
  spec: LandingSpec;
  group: LandingGroup;
  /** Footer link and breadcrumb. */
  label: string;
  h1: string;
  /** <title>, without the " | SITE_NAME" suffix the root template appends. */
  title: string;
  /** Follows the count: "3.360 imóveis em leilão em São Paulo". */
  countSuffix: string;
  lead: string;
  body: string[];
  faq: { q: string; a: string }[];
};

const FAQ_NOTA = {
  q: "Como a Nota de Investimento é calculada?",
  a: "Cada imóvel recebe uma nota de 0 a 100 a partir de quatro blocos: preço (desconto sobre a avaliação da Caixa e preço por m² frente ao mercado aberto da região), região (distância real até escolas, hospitais, supermercados, parques e transporte), características do imóvel (tipo, área, quartos, vagas e situação de ocupação) e facilidade de revenda daquele tipo naquela cidade. Os pesos mudam por tipo de imóvel e toda nota vem com a explicação fator a fator.",
};

const FAQ_GARANTIA = {
  q: "A nota é garantia de bom negócio?",
  a: "Não. A nota olha preço, região e características do imóvel a partir de dados públicos: ela não lê o edital, não avalia a situação jurídica e não sabe de dívida de condomínio, ação judicial ou custo de desocupação. Antes de dar lance, leia o edital e, se possível, consulte um advogado.",
};

const FAQ_CAIXA = {
  q: "O Leilão Index é ligado à Caixa?",
  a: "Não. O Leilão Index é independente: coletamos, organizamos e analisamos a base pública de leilões e venda direta da Caixa Econômica Federal. Não somos afiliados, patrocinados nem endossados pela Caixa, não intermediamos lances e não recebemos comissão sobre arremates. O lance é sempre dado no canal oficial da Caixa.",
};

const FAQ_ATUALIZACAO = {
  q: "Com que frequência a lista é atualizada?",
  a: "Diariamente. Novos imóveis entram, arrematados saem e as notas são recalculadas para refletir a base ativa do dia. Com uma conta grátis dá para salvar a busca e receber as novidades por e-mail, no ritmo diário ou semanal.",
};

const WHY = "Toda nota vem com o porquê, fator a fator, e a base é atualizada diariamente.";

// Google truncates around 60 chars and the root template appends " | <site name>", so the
// qualifiers are appended only while they fit. "Rio Grande do Sul" eats 17 of them on its own.
const TITLE_BUDGET = 55;

const fitTitle = (base: string, ...extras: string[]): string =>
  extras.reduce((t, e) => (t.length + e.length <= TITLE_BUDGET ? t + e : t), base);

const ufLanding = (uf: string): SeoLanding => {
  const name = ufName(uf);
  return {
    slug: uf.toLowerCase(),
    spec: { kind: "uf", uf },
    group: "estados",
    label: name,
    h1: `Leilão de imóveis em ${name}`,
    title: fitTitle(`Leilão de imóveis em ${name} (${uf})`, " — Caixa", ", com desconto"),
    countSuffix: `imóveis em leilão em ${name}`,
    lead: `Imóveis de leilão e venda direta da Caixa em ${name}, ordenados pelo desconto sobre a avaliação e com a Nota de Investimento.`,
    body: [
      `Acompanhamos todo dia a base pública de leilões e venda direta da Caixa Econômica Federal e damos a cada imóvel de ${name} uma Nota de Investimento de 0 a 100. A nota combina o desconto sobre a avaliação, o preço por m² frente ao mercado aberto da região, a qualidade do entorno e a facilidade de revenda daquele tipo de imóvel na cidade.`,
      `O desconto sobre a avaliação, sozinho, diz pouco: ele compara o lance com o valor que a própria Caixa atribuiu ao imóvel, e não com o que o mercado realmente pratica. Por isso calculamos também o preço mediano por m² de imóveis parecidos anunciados na mesma região — usando portais do mercado aberto e deixando portais de leilão de fora de propósito — e mede a distância real de cada imóvel de ${name} até escolas, hospitais, supermercados, parques, farmácias e transporte.`,
      `Além da nota geral, cada imóvel recebe notas de uso: moradia familiar, aluguel por temporada, aluguel estudantil, reforma e revenda ou comercial. Elas só aparecem quando o imóvel realmente se destaca naquele uso, então servem para separar o que é oportunidade de verdade do que só está barato.`,
      `Use os filtros para recortar por cidade, tipo de imóvel, faixa de preço, modalidade, financiamento e uso do FGTS. ${WHY}`,
    ],
    faq: [
      {
        q: `Como encontrar imóveis de leilão da Caixa em ${name}?`,
        a: `Esta página reúne todos os imóveis de leilão e venda direta da Caixa em ${name} que estão ativos na base hoje, ordenados pelo desconto sobre a avaliação. Dá para filtrar por cidade, tipo de imóvel, faixa de preço, modalidade, financiamento e FGTS sem precisar criar conta.`,
      },
      {
        q: `Dá para financiar um imóvel de leilão em ${name}?`,
        a: "Depende do imóvel. Boa parte dos leilões exige pagamento à vista em poucos dias, mas parte do acervo da Caixa aceita financiamento e uso do FGTS — o edital de cada imóvel diz qual é o caso. Use o filtro de pagamento para ver só os que aceitam.",
      },
      FAQ_NOTA,
      FAQ_GARANTIA,
      FAQ_ATUALIZACAO,
      FAQ_CAIXA,
    ],
  };
};

/** Exported because city landings are also built on the fly for any city in the catalogue, not
 *  just the curated capitals in the footer. City facets are what these SERPs actually rank. */
export const cityLanding = (uf: string, citySlug: string, label: string): SeoLanding => ({
  slug: `${citySlug}-${uf.toLowerCase()}`,
  spec: { kind: "city", uf, citySlug },
  group: "capitais",
  label: `${label} - ${uf}`,
  h1: `Leilão de imóveis em ${label}`,
  title: fitTitle(`Leilão de imóveis em ${label} (${uf})`, " — Caixa", ", com desconto"),
  countSuffix: `imóveis em leilão em ${label}`,
  lead: `Imóveis de leilão e venda direta da Caixa em ${label}, com desconto sobre a avaliação e Nota de Investimento calculada bairro a bairro.`,
  body: [
    `Em ${label}, medimos a distância real de cada imóvel até escolas, hospitais, supermercados, parques, farmácias e transporte, e compara o preço por m² do lance com anúncios reais do mercado aberto na mesma região — portais de leilão ficam de fora de propósito, para a comparação ser sempre com o mercado normal.`,
    `Bairro importa mais do que cidade: dois imóveis com o mesmo desconto em ${label} podem ter notas muito diferentes se um estiver numa região com serviço por perto e o outro não. É isso que a Nota de Investimento tenta capturar, e é por isso que ela vem sempre acompanhada do porquê, fator a fator.`,
    `Além da nota geral, cada imóvel recebe notas de uso: moradia familiar, aluguel por temporada, aluguel estudantil, reforma e revenda ou comercial. Um apartamento compacto perto de uma universidade e um sobrado num bairro com escolas e parques resolvem problemas diferentes, e a lista pode ser reordenada em volta do seu objetivo.`,
    `Filtre por tipo de imóvel, faixa de preço, modalidade, financiamento e FGTS para chegar ao que combina com o seu plano em ${label}. ${WHY}`,
  ],
  faq: [
    {
      q: `Quantos imóveis da Caixa estão em leilão em ${label}?`,
      a: `O número aparece no topo desta página e muda todo dia: novos imóveis entram, arrematados saem. A lista cobre leilão e venda direta da Caixa em ${label}, sempre a partir da base ativa do dia.`,
    },
    {
      q: `Os imóveis de leilão em ${label} estão ocupados?`,
      a: "Parte do acervo da Caixa está ocupada e parte está desocupada — a situação de ocupação consta no edital de cada imóvel e aparece na página do imóvel aqui. Um imóvel ocupado costuma ter desconto maior justamente porque a desocupação é custo e risco do arrematante.",
    },
    FAQ_NOTA,
    FAQ_GARANTIA,
    FAQ_ATUALIZACAO,
    FAQ_CAIXA,
  ],
});

const typeLanding = (
  typeSlug: string,
  label: string,
  plural: string,
  article: string,
): SeoLanding => ({
  slug: typeSlug,
  spec: { kind: "type", typeSlug },
  group: "tipos",
  label,
  h1: `${label} em leilão da Caixa`,
  title: fitTitle(`${label} em leilão da Caixa`, ` — ${plural.toLowerCase()} com desconto`),
  countSuffix: `${plural.toLowerCase()} em leilão no Brasil`,
  lead: `${plural} de leilão e venda direta da Caixa em todo o Brasil, com desconto sobre a avaliação e Nota de Investimento de 0 a 100.`,
  body: [
    `${plural} têm um perfil de liquidez próprio, e ajustamos os pesos da nota por tipo: ${article} ${label.toLowerCase()} não se valoriza pelos mesmos fatores que um terreno ou uma sala comercial. O resultado é uma comparação justa dentro da mesma categoria, em vez de um ranking único que mistura coisas incomparáveis.`,
    `Para cada ${label.toLowerCase()} desta lista, calculamos o desconto sobre a avaliação da Caixa, compara o preço por m² com anúncios reais do mercado aberto na mesma região e mede a distância até escolas, hospitais, supermercados, parques e transporte. Quando há foto, um modelo de visão também dá uma nota à fachada e ao estado de conservação — um sinal a mais para dimensionar a reforma antes de visitar.`,
    `A liquidez pesa: ${plural.toLowerCase()} de determinadas faixas de área e preço saem mais rápido numa cidade do que noutra, e isso entra na nota em vez de ficar por conta da intuição.`,
    `Filtre por estado, cidade, faixa de preço, modalidade, financiamento e FGTS para chegar ${article === "um" ? "ao" : "à"} ${label.toLowerCase()} que combina com o seu objetivo. ${WHY}`,
  ],
  faq: [
    {
      q: `Vale a pena comprar ${article} ${label.toLowerCase()} em leilão da Caixa?`,
      a: `Depende do imóvel, não do tipo. O desconto sobre a avaliação costuma ser alto, mas vem acompanhado de motivos — imóvel ocupado, região de baixa liquidez ou necessidade de reforma. A Nota de Investimento existe justamente para separar o que está barato do que está barato por um motivo.`,
    },
    {
      q: `Dá para financiar ${article} ${label.toLowerCase()} de leilão?`,
      a: "Parte do acervo aceita financiamento e uso do FGTS, parte exige pagamento à vista em poucos dias. Terrenos, em particular, costumam ficar de fora das regras do FGTS. O edital de cada imóvel é o que vale; use o filtro de pagamento para ver só os financiáveis.",
    },
    FAQ_NOTA,
    FAQ_GARANTIA,
    FAQ_ATUALIZACAO,
    FAQ_CAIXA,
  ],
});

const priceLanding = (maxPrice: number, label: string): SeoLanding => ({
  slug: `ate-${label}`,
  spec: { kind: "price", maxPrice },
  group: "preco",
  label: `Até R$ ${label.replace("-", " ")}`,
  h1: `Leilão de imóveis até R$ ${label.replace("-", " ")}`,
  title: `Imóveis em leilão até R$ ${label.replace("-", " ")} — Caixa`,
  countSuffix: `imóveis em leilão até R$ ${label.replace("-", " ")}`,
  lead: `Imóveis da Caixa com lance inicial até R$ ${label.replace("-", " ")}, ordenados pelo desconto sobre a avaliação.`,
  body: [
    `Preço baixo não é o mesmo que bom negócio: um imóvel barato numa região sem serviços e de revenda difícil pode valer menos do que parece. Por isso cruzamos o lance com o preço por m² do mercado aberto na região e com a distância real até escolas, mercados, hospitais, parques e transporte.`,
    `Nesta faixa aparecem principalmente apartamentos compactos e casas em cidades médias, muitas vezes em segunda praça — onde o lance mínimo já caiu por não ter havido arremate na primeira. É a porta de entrada mais comum para quem está comprando o primeiro imóvel de leilão.`,
    `Vale lembrar que o lance não é o custo total: ITBI, escritura, eventuais dívidas de condomínio e IPTU e o custo de desocupação entram na conta e estão descritos no edital de cada imóvel. Não lemos o edital por você — ajudamos a decidir quais valem a leitura.`,
    `Os imóveis abaixo estão ordenados pelo desconto sobre a avaliação da Caixa e trazem a Nota de Investimento ao lado. ${WHY}`,
  ],
  faq: [
    {
      q: `É possível comprar um imóvel de leilão até R$ ${label.replace("-", " ")}?`,
      a: `Sim, e é uma das faixas com mais oferta na base da Caixa. O número de imóveis ativos nessa faixa aparece no topo da página e muda diariamente. O lance inicial, porém, não é o custo total: some ITBI, escritura, dívidas que o edital transfere ao arrematante e o custo de desocupação.`,
    },
    {
      q: "Por que alguns imóveis são tão baratos?",
      a: "Normalmente por três motivos: o imóvel está ocupado e a desocupação é por conta do arrematante, está numa região de baixa liquidez, ou precisa de reforma relevante. Nenhum dos três aparece no preço — mas os dois primeiros entram na Nota de Investimento e o terceiro, quando há foto, na nota de fachada.",
    },
    FAQ_NOTA,
    FAQ_GARANTIA,
    FAQ_ATUALIZACAO,
    FAQ_CAIXA,
  ],
});

const discountLanding = (minDiscount: number): SeoLanding => ({
  slug: `desconto-acima-de-${minDiscount}`,
  spec: { kind: "discount", minDiscount },
  group: "preco",
  label: `Desconto acima de ${minDiscount}%`,
  h1: `Leilão de imóveis com mais de ${minDiscount}% de desconto`,
  title: `Imóveis em leilão com mais de ${minDiscount}% de desconto — Caixa`,
  countSuffix: `imóveis com mais de ${minDiscount}% de desconto`,
  lead: `Imóveis da Caixa cujo lance inicial está mais de ${minDiscount}% abaixo do valor de avaliação.`,
  body: [
    `O desconto sobre a avaliação é metade da história: ele compara o lance com o valor que a própria Caixa atribuiu ao imóvel. A outra metade é o mercado — calculamos o preço mediano por m² de imóveis parecidos anunciados na mesma região, usando portais do mercado aberto e ignorando portais de leilão, e mostra se o desconto se sustenta fora do edital.`,
    `Um desconto alto costuma vir acompanhado de algum motivo: imóvel ocupado, região de baixa liquidez, área atípica ou necessidade de reforma. A Nota de Investimento tenta traduzir isso em número, para que dois imóveis com o mesmo desconto de ${minDiscount}% não pareçam a mesma oportunidade quando não são.`,
    `A maior parte dos descontos grandes está em segunda praça, onde o lance mínimo já caiu por não ter havido arremate na primeira rodada. Vale comparar o mesmo imóvel nas duas modalidades antes de decidir.`,
    `Os imóveis abaixo têm lance inicial mais de ${minDiscount}% abaixo da avaliação da Caixa. ${WHY}`,
  ],
  faq: [
    {
      q: `Existe imóvel de leilão com mais de ${minDiscount}% de desconto?`,
      a: `Sim — o número de imóveis ativos nessa faixa aparece no topo da página. O desconto é calculado sobre o valor de avaliação da Caixa, que consta no edital de cada imóvel, e muda diariamente conforme a base é atualizada.`,
    },
    {
      q: "Desconto alto significa bom negócio?",
      a: "Nem sempre. O desconto compara o lance com a avaliação da Caixa, não com o mercado. Calculamos também o preço por m² frente a anúncios reais da região: quando os dois números concordam, o desconto é real; quando divergem, a avaliação é que estava alta.",
    },
    FAQ_NOTA,
    FAQ_GARANTIA,
    FAQ_ATUALIZACAO,
    FAQ_CAIXA,
  ],
});

export const SEO_LANDINGS: SeoLanding[] = [
  // Volume order: RJ, GO and SP alone are two thirds of the base.
  ...["RJ", "GO", "SP", "PE", "MG", "PB", "RS", "BA", "PI", "RN", "CE", "PR"].map(ufLanding),

  cityLanding("RJ", "rio-de-janeiro", "Rio de Janeiro"),
  cityLanding("SP", "sao-paulo", "São Paulo"),
  cityLanding("GO", "goiania", "Goiânia"),
  cityLanding("DF", "brasilia", "Brasília"),
  cityLanding("PR", "curitiba", "Curitiba"),
  cityLanding("SC", "florianopolis", "Florianópolis"),
  cityLanding("MG", "belo-horizonte", "Belo Horizonte"),
  cityLanding("BA", "salvador", "Salvador"),
  cityLanding("PE", "recife", "Recife"),
  cityLanding("RS", "porto-alegre", "Porto Alegre"),

  typeLanding("apartamento", "Apartamento", "Apartamentos", "um"),
  typeLanding("casa", "Casa", "Casas", "uma"),
  typeLanding("sobrado", "Sobrado", "Sobrados", "um"),
  typeLanding("terreno", "Terreno", "Terrenos", "um"),
  typeLanding("sala-comercial", "Sala comercial", "Salas comerciais", "uma"),

  priceLanding(100_000, "100-mil"),
  priceLanding(200_000, "200-mil"),
  priceLanding(300_000, "300-mil"),
  priceLanding(350_000, "350-mil"),

  discountLanding(30),
  discountLanding(40),
  discountLanding(50),

  {
    slug: "venda-direta",
    spec: { kind: "modality", tokens: ["venda"] },
    group: "modalidade",
    label: "Venda direta",
    h1: "Venda direta da Caixa",
    title: "Venda direta Caixa — imóveis sem leilão, com desconto",
    countSuffix: "imóveis em venda direta da Caixa",
    lead: "Imóveis que a Caixa vende sem disputa de lances: proposta direta, com desconto sobre a avaliação.",
    body: [
      "Na venda direta não há praça nem disputa ao vivo: o comprador envia uma proposta pelo canal oficial da Caixa. Costuma ser a modalidade mais acessível para quem está começando, porque dispensa o rito do leilão — mas o edital continua valendo e as regras de pagamento, dívidas e ocupação seguem sendo do comprador.",
      "A Caixa também chama essa modalidade de compra direta em parte dos materiais. Na prática é o mesmo caminho: imóveis que não foram arrematados nas praças anteriores, ou que a Caixa optou por vender fora do rito de leilão, ficam disponíveis para proposta.",
      "O desconto costuma ser menor que o de uma segunda praça disputada, mas a concorrência também é — e as condições de pagamento tendem a ser mais flexíveis, com mais imóveis aceitando financiamento e FGTS.",
      `Pontuamos os imóveis de venda direta com o mesmo modelo dos leilões, então dá para comparar as duas modalidades lado a lado. ${WHY}`,
    ],
    faq: [
      {
        q: "Qual a diferença entre venda direta e leilão da Caixa?",
        a: "No leilão há praça, data marcada e disputa de lances; na venda direta o comprador envia uma proposta pelo canal oficial da Caixa, sem disputa ao vivo. O edital, as regras de pagamento e a responsabilidade por dívidas e desocupação continuam valendo nas duas.",
      },
      {
        q: "Venda direta e compra direta são a mesma coisa?",
        a: "Sim. A Caixa usa os dois nomes para a modalidade em que o imóvel é vendido por proposta, fora do rito de leilão.",
      },
      FAQ_NOTA,
      FAQ_GARANTIA,
      FAQ_ATUALIZACAO,
      FAQ_CAIXA,
    ],
  },
  {
    slug: "primeiro-leilao",
    spec: { kind: "modality", tokens: ["1", "leilao"] },
    group: "modalidade",
    label: "1º Leilão",
    h1: "Imóveis em 1º Leilão da Caixa",
    title: "1º Leilão de imóveis da Caixa — lances e datas",
    countSuffix: "imóveis em 1º Leilão",
    lead: "Imóveis na primeira praça, onde o lance mínimo costuma partir do valor de avaliação.",
    body: [
      "No 1º Leilão o lance mínimo normalmente parte do valor de avaliação da Caixa, então o desconto tende a ser menor que na segunda praça — em compensação, a concorrência costuma ser menor e o imóvel ainda não passou por uma rodada de disputa.",
      "Vale a pena acompanhar a primeira praça mesmo sem intenção de dar lance nela: os imóveis que não recebem proposta migram para o 2º Leilão com valor mínimo mais baixo, e conhecer o imóvel antes dá vantagem de tempo para ler o edital e visitar a região.",
      `Marcamos a modalidade de cada imóvel e avisa quando ela muda, então dá para acompanhar a transição de primeira para segunda praça. ${WHY}`,
    ],
    faq: [
      {
        q: "O que é o 1º Leilão da Caixa?",
        a: "É a primeira praça: o imóvel é ofertado com lance mínimo geralmente igual ao valor de avaliação. Se ninguém arrematar, ele vai para o 2º Leilão com valor mínimo mais baixo.",
      },
      {
        q: "Compensa dar lance no 1º Leilão?",
        a: "Compensa quando o imóvel é disputado e você não quer arriscar perdê-lo na segunda praça, ou quando a própria avaliação da Caixa já está abaixo do mercado — que é exatamente o que a comparação de preço por m² mostra.",
      },
      FAQ_NOTA,
      FAQ_GARANTIA,
      FAQ_ATUALIZACAO,
      FAQ_CAIXA,
    ],
  },
  {
    slug: "segundo-leilao",
    spec: { kind: "modality", tokens: ["2", "leilao"] },
    group: "modalidade",
    label: "2º Leilão",
    h1: "Imóveis em 2º Leilão da Caixa",
    title: "2º Leilão de imóveis da Caixa — maiores descontos",
    countSuffix: "imóveis em 2º Leilão",
    lead: "Imóveis que não foram arrematados na primeira praça e voltam com lance mínimo mais baixo.",
    body: [
      "O 2º Leilão acontece quando o imóvel não recebe lance na primeira praça. O valor mínimo cai — é onde aparecem os maiores descontos sobre a avaliação — mas o motivo de não ter sido arrematado antes costuma importar tanto quanto o preço.",
      "Os motivos mais comuns são conhecidos: imóvel ocupado, região de baixa liquidez, área atípica ou estado de conservação ruim. Nenhum deles aparece no valor do lance, e todos entram na conta de quem arremata.",
      `A Nota de Investimento ajuda a separar o que está barato do que está barato por um motivo, cruzando o desconto com o preço de mercado da região, a qualidade do entorno e a facilidade de revenda. ${WHY}`,
    ],
    faq: [
      {
        q: "O que é o 2º Leilão da Caixa?",
        a: "É a segunda praça, realizada quando o imóvel não é arrematado na primeira. O lance mínimo cai em relação ao valor de avaliação, o que faz da segunda praça a modalidade com os maiores descontos da base.",
      },
      {
        q: "Por que o imóvel não foi arrematado na primeira praça?",
        a: "Normalmente por estar ocupado, por ficar numa região de baixa liquidez, por ter área ou planta atípica, ou por precisar de reforma relevante. Vale checar a situação de ocupação no edital antes de considerar o desconto uma vantagem.",
      },
      FAQ_NOTA,
      FAQ_GARANTIA,
      FAQ_ATUALIZACAO,
      FAQ_CAIXA,
    ],
  },
  {
    slug: "com-financiamento",
    spec: { kind: "payment", financing: true },
    group: "modalidade",
    label: "Aceita financiamento",
    h1: "Leilão de imóveis com financiamento da Caixa",
    title: "Leilão de imóveis com financiamento da Caixa",
    countSuffix: "imóveis em leilão que aceitam financiamento",
    lead: "Imóveis de leilão e venda direta da Caixa que aceitam financiamento, sem precisar do valor total à vista.",
    body: [
      "Nem todo imóvel de leilão aceita financiamento — boa parte exige pagamento à vista em poucos dias. Os imóveis abaixo estão marcados no edital como financiáveis, o que muda completamente quem consegue participar.",
      "É a diferença entre precisar do valor integral em caixa e precisar apenas da entrada mais os custos de arremate. Na prática, o filtro de financiamento é o que separa a lista que você pode disputar da lista que você só pode observar.",
      `O percentual financiado, o prazo e as condições de aprovação estão sempre no edital do imóvel, no canal oficial da Caixa, e dependem da sua análise de crédito. ${WHY}`,
    ],
    faq: [
      {
        q: "Dá para financiar imóvel de leilão da Caixa?",
        a: "Parte do acervo sim. O edital de cada imóvel informa se ele aceita financiamento; quando aceita, valem as regras normais de crédito imobiliário da Caixa, incluindo análise de crédito e avaliação. Os demais exigem pagamento à vista em prazo curto.",
      },
      {
        q: "O financiamento cobre os custos de arremate?",
        a: "Não. ITBI, escritura, registro, comissão do leiloeiro quando houver e eventuais dívidas transferidas pelo edital são pagos à parte, em dinheiro. Vale somar tudo antes de decidir o lance máximo.",
      },
      FAQ_NOTA,
      FAQ_GARANTIA,
      FAQ_ATUALIZACAO,
      FAQ_CAIXA,
    ],
  },
  {
    slug: "com-fgts",
    spec: { kind: "payment", fgts: true },
    group: "modalidade",
    label: "Aceita FGTS",
    h1: "Leilão de imóveis que aceitam FGTS",
    title: "Leilão de imóveis com FGTS — uso do fundo permitido",
    countSuffix: "imóveis em leilão que aceitam FGTS",
    lead: "Imóveis da Caixa em que o edital permite usar o FGTS na composição do pagamento.",
    body: [
      "O uso do FGTS depende do edital do imóvel e das regras do fundo — tipo de imóvel, finalidade e a sua situação como titular da conta. Os imóveis abaixo são os que a Caixa marca como aptos.",
      "As regras do fundo são exigentes: o imóvel precisa ser residencial urbano e destinado a moradia, e há restrições ligadas a já possuir outro imóvel na mesma região e ao tempo de contribuição. Terrenos e imóveis comerciais ficam de fora.",
      `Confirme sempre as condições no edital e junto à Caixa antes de dar lance — a marcação aqui reflete o que consta na base, não uma aprovação do seu caso. ${WHY}`,
    ],
    faq: [
      {
        q: "Posso usar o FGTS para comprar imóvel de leilão?",
        a: "Em parte do acervo, sim. O edital do imóvel indica se o FGTS é aceito, e valem as regras normais do fundo: imóvel residencial urbano destinado a moradia, restrições sobre já possuir imóvel na mesma região e tempo mínimo de contribuição.",
      },
      {
        q: "Dá para usar FGTS em terreno de leilão?",
        a: "Não. As regras do fundo cobrem imóveis residenciais urbanos destinados a moradia, o que deixa terrenos e imóveis comerciais de fora.",
      },
      FAQ_NOTA,
      FAQ_GARANTIA,
      FAQ_ATUALIZACAO,
      FAQ_CAIXA,
    ],
  },
];

export const landingBySlug: ReadonlyMap<string, SeoLanding> = new Map(
  SEO_LANDINGS.map((l) => [l.slug, l]),
);

export const getLanding = (slug: string): SeoLanding | null =>
  landingBySlug.get(slug.toLowerCase()) ?? null;

export const LANDING_GROUPS: { group: LandingGroup; title: string }[] = [
  { group: "estados", title: "Leilões por estado" },
  { group: "capitais", title: "Principais cidades" },
  { group: "tipos", title: "Tipos de imóvel" },
  { group: "preco", title: "Preço e desconto" },
  { group: "modalidade", title: "Modalidade e pagamento" },
];

export const landingsIn = (group: LandingGroup): SeoLanding[] =>
  SEO_LANDINGS.filter((l) => l.group === group);

const SINGULAR: Record<string, string> = {
  imóveis: "imóvel",
  "salas comerciais": "sala comercial",
};

/** "3.360 imóveis em leilão em São Paulo". countSuffix already carries the noun, so the count is
 *  prefixed rather than composed with nImoveis - that duplicated it. */
export function countedLabel(n: number, countSuffix: string): string {
  if (n !== 1) return `${n.toLocaleString("pt-BR")} ${countSuffix}`;
  const singular = Object.entries(SINGULAR).find(([plural]) => countSuffix.startsWith(plural));
  const head = singular
    ? countSuffix.replace(singular[0], singular[1])
    : countSuffix.replace(/^(\S+?)s\b/, "$1");
  return `1 ${head}`;
}
