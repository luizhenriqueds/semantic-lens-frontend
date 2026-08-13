// Plain-text twin of the <details> blocks in page.tsx, used only to build the FAQPage JSON-LD.
// The JSX stays the source of truth for what a reader sees; faq.test.ts asserts the two agree.
export const FAQ: { id: string; q: string; a: string }[] = [
  {
    id: "faq-nota",
    q: "Como a nota é calculada?",
    a: "Cada imóvel recebe notas de 0 a 100 a partir de quatro componentes: preço (desconto sobre a avaliação oficial do banco e preço por m² frente ao mercado aberto na região), região (distância real até escolas, hospitais, supermercados, parques e outras categorias de referência), características do imóvel (tipo, área, quartos, vagas, situação de ocupação) e facilidade de revenda daquele tipo naquela cidade. As notas são comparativas: um ranking, não um selo de aprovação. Toda nota vem com a explicação fator a fator e os pesos mudam por tipo: moradia, terreno e comercial se valorizam de formas diferentes.",
  },
  {
    id: "faq-relativa",
    q: "O que quer dizer uma nota 87?",
    a: "Que o imóvel está à frente da maioria dos concorrentes diretos dele — imóveis do mesmo tipo, na mesma cidade. As notas são relativas: servem para ranquear e comparar rapidamente, não para dizer que um negócio é bom em termos absolutos.",
  },
  {
    id: "faq-garantia",
    q: "A nota é garantia de bom negócio?",
    a: "Não, e nunca vai ser. A nota olha preço, região e características do imóvel a partir de dados públicos — ela não lê o edital, não avalia a situação jurídica e não sabe de dívida de condomínio, ação judicial ou custo de desocupação. Antes de dar lance, leia o edital e, se possível, consulte um advogado: a decisão continua sendo sua.",
  },
  {
    id: "faq-caixa",
    q: "O Leilão Index é ligado à Caixa?",
    a: "Não. O Leilão Index é independente: coletamos, organizamos e analisamos a base pública de leilões e venda direta da Caixa Econômica Federal. Não somos afiliados, patrocinados nem endossados pela Caixa, não intermediamos lances nem recebemos comissão sobre arremates — o lance é sempre dado no canal oficial da Caixa.",
  },
  {
    id: "faq-dados",
    q: "De onde vêm os dados?",
    a: "De três fontes públicas ou licenciadas: imóveis, avaliação, lances e datas vêm da base de leilões e venda direta da Caixa; pontos de referência e distâncias, de bases abertas de mapas; e preço de mercado, de anúncios reais de imóveis parecidos em portais do mercado aberto — portais de leilão ficam de fora de propósito, para a comparação ser sempre com o mercado normal.",
  },
  {
    id: "faq-pois",
    q: "Quais lugares vocês medem em volta do imóvel?",
    a: "São dezenas de categorias de lugar — escolas, hospitais, supermercados, parques, farmácias, universidades, restaurantes, bancos, shoppings e transporte, entre outras — medidas em centenas de milhares de pontos mapeados. Para cada imóvel, calculamos a distância real até o mais próximo de cada categoria, não apenas quantos existem no bairro. É isso que alimenta a nota da região e as notas de uso: uma universidade a 700 m pesa no aluguel estudantil, um parque a 200 m pesa na moradia familiar.",
  },
  {
    id: "faq-mercado",
    q: "Como vocês sabem se o preço está bom?",
    a: "O desconto sobre a avaliação é só metade da história: ele compara o lance com o valor que a Caixa avaliou. A outra metade é o mercado — calculamos o preço mediano por m² de imóveis parecidos anunciados na mesma região e refinamos comparando só área e número de quartos semelhantes. Quando há poucos anúncios, a estimativa se apoia numa área maior e reduzimos a confiança daquele número.",
  },
  {
    id: "faq-atualizacao",
    q: "Com que frequência os dados são atualizados?",
    a: "Diariamente. Novos imóveis entram, arrematados saem e as notas são recalculadas para refletir a base ativa do dia. Com uma conta, você pode salvar buscas e receber por e-mail as novidades, no ritmo que escolher: diário ou semanal.",
  },
  {
    id: "faq-sumiu",
    q: "Por que um imóvel que eu vi sumiu?",
    a: "Porque a oferta da Caixa muda todo dia. Um imóvel pode ser arrematado, ter o leilão suspenso, mudar de modalidade ou simplesmente sair da lista entre uma atualização e outra — quando isso acontece, marcamos o anúncio como inativo em vez de apagá-lo.",
  },
  {
    id: "faq-faltando",
    q: "Por que um imóvel sem foto ou sem área tem nota mais baixa?",
    a: "Nas notas de uso (moradia, temporada, estudantil, reforma, comercial), um dado que falta é simplesmente ignorado — ele não vira ponto negativo. Já na Nota de Investimento, faltar informação reduz a nota: com menos dados, há menos certeza sobre o imóvel.",
  },
  {
    id: "faq-leigo",
    q: "Preciso entender de leilão para usar?",
    a: "Não. Você descreve o que procura em linguagem natural — “apartamento de 2 quartos até R$ 150 mil no Rio, perto de metrô” e traduzimos isso em filtros e notas. Para dar o lance, aí sim vale estudar o edital: é lá que estão as regras de pagamento, as dívidas do imóvel e a situação de ocupação.",
  },
  {
    id: "faq-preco",
    q: "Quanto custa?",
    a: "Explorar a base, buscar por texto ou por proximidade, ver todas as notas e abrir a leitura de região é gratuito e não exige cadastro. Uma conta grátis libera favoritos e alertas por e-mail. Os planos pagos liberam filtros avançados, coleções, recomendações, painel de mercado, calendário de leilões, a análise completa de região e a exportação em CSV/PDF.",
  },
];
