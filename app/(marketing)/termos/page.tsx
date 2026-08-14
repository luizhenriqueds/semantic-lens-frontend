import type { Metadata } from "next";
import LegalDoc from "../_components/LegalDoc";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de uso do Leilão Index: o que o serviço faz, o que não faz e as regras de utilização.",
  alternates: { canonical: "/termos" },
};

const UPDATED_AT = "13 de agosto de 2026";

export default function TermsPage() {
  return (
    <LegalDoc
      title="Termos de Uso"
      updatedAt={UPDATED_AT}
      intro="Ao usar o Leilão Index você concorda com os termos abaixo. Eles são curtos de propósito — o resumo é que damos informação para ajudar na sua análise, mas a decisão de dar lance é sempre sua."
      sections={[
        {
          heading: "1. Quem somos",
          paragraphs: [
            "O Leilão Index é um serviço independente que coleta, organiza e analisa a base pública de leilões e venda direta de imóveis da Caixa Econômica Federal.",
            "Não somos afiliados, patrocinados nem endossados pela Caixa Econômica Federal. Não intermediamos lances, não participamos de leilões e não recebemos comissão sobre arremates. O lance é sempre dado no canal oficial da Caixa.",
          ],
        },
        {
          heading: "2. O que o serviço oferece",
          paragraphs: [
            "Oferecemos busca, comparação, notas de 0 a 100, análises de região e alertas sobre imóveis anunciados publicamente. As notas são estimativas comparativas geradas por algoritmo a partir de dados públicos: servem para ranquear e priorizar, não são recomendação de investimento nem garantia de bom negócio.",
            "Nossa análise não lê o edital, não avalia a situação jurídica do imóvel e não tem conhecimento de dívidas de condomínio, ações judiciais, ônus ou custos de desocupação. Antes de dar lance, leia o edital completo no canal oficial e, se possível, consulte um advogado.",
          ],
        },
        {
          heading: "3. Precisão dos dados",
          paragraphs: [
            "Os dados vêm de fontes públicas e são atualizados periodicamente. Podem conter erros, estar desatualizados ou divergir do que consta no edital oficial. Em caso de divergência, o edital da Caixa sempre prevalece.",
            "Não garantimos disponibilidade ininterrupta do serviço nem que um imóvel exibido ainda esteja disponível no momento da consulta.",
          ],
        },
        {
          heading: "4. Sua conta",
          paragraphs: [
            "Você é responsável por manter a confidencialidade das suas credenciais e por toda atividade realizada na sua conta. Informe-nos imediatamente se suspeitar de uso não autorizado.",
            "Você concorda em não tentar burlar limites de uso, extrair dados em massa de forma automatizada, revender o acesso ou usar o serviço para qualquer finalidade ilegal.",
          ],
        },
        {
          heading: "5. Planos e pagamentos",
          paragraphs: [
            "Alguns recursos exigem plano pago. O período de teste, quando oferecido, é gratuito e não gera cobrança automática ao terminar. Os limites de cada plano são os descritos na página de planos no momento da contratação.",
            "Você pode cancelar quando quiser; o acesso permanece até o fim do período já pago.",
          ],
        },
        {
          heading: "6. Limitação de responsabilidade",
          paragraphs: [
            "O serviço é fornecido no estado em que se encontra. Na máxima extensão permitida pela lei, não nos responsabilizamos por perdas ou prejuízos decorrentes de decisões de compra, lance ou investimento tomadas com base nas informações e notas apresentadas aqui.",
          ],
        },
        {
          heading: "7. Alterações",
          paragraphs: [
            "Podemos atualizar estes termos. Mudanças relevantes serão comunicadas na plataforma ou por e-mail. O uso continuado após a atualização significa concordância com a nova versão.",
          ],
        },
      ]}
    />
  );
}
