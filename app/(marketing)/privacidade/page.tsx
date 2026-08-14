import type { Metadata } from "next";
import LegalDoc from "../_components/LegalDoc";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de privacidade do Leilão Index: quais dados coletamos, para que usamos e quais são os seus direitos.",
  alternates: { canonical: "/privacidade" },
};

const UPDATED_AT = "13 de agosto de 2026";

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Política de Privacidade"
      updatedAt={UPDATED_AT}
      intro="Esta política explica quais dados pessoais o Leilão Index coleta, por que os coleta e o que você pode pedir a respeito deles. Coletamos o mínimo necessário para o serviço funcionar."
      sections={[
        {
          heading: "1. Dados que coletamos",
          paragraphs: [
            "Dados de conta: nome e e-mail, informados por você no cadastro, e uma senha armazenada de forma criptografada.",
            "Dados de uso do serviço: imóveis favoritados, buscas salvas, alertas configurados e preferências, para que a plataforma funcione como você espera.",
            "Dados técnicos: informações de navegação e métricas agregadas de audiência, usadas para medir desempenho, prevenir abuso e melhorar o produto.",
            "Não coletamos CPF, dados bancários nem documentos. Pagamentos, quando existem, são processados por um provedor externo que recebe os dados diretamente de você.",
          ],
        },
        {
          heading: "2. Para que usamos",
          paragraphs: [
            "Para autenticar seu acesso, entregar os recursos contratados, enviar alertas e comunicações relacionadas ao serviço, garantir a segurança da plataforma e cumprir obrigações legais.",
            "Não vendemos seus dados pessoais e não os compartilhamos com terceiros para publicidade.",
          ],
        },
        {
          heading: "3. Com quem compartilhamos",
          paragraphs: [
            "Apenas com prestadores necessários à operação — hospedagem, banco de dados, envio de e-mail, processamento de pagamento e análise de audiência — e sempre limitado ao necessário para prestarem o serviço.",
            "Também podemos divulgar dados quando exigido por lei ou por ordem de autoridade competente.",
          ],
        },
        {
          heading: "4. Por quanto tempo guardamos",
          paragraphs: [
            "Enquanto sua conta existir. Ao excluir a conta, apagamos ou anonimizamos seus dados pessoais, salvo o que precisarmos reter por obrigação legal.",
          ],
        },
        {
          heading: "5. Seus direitos",
          paragraphs: [
            "Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização ou exclusão dos seus dados, além de revogar consentimentos.",
            "Para exercer qualquer um desses direitos, escreva para contato@leilaoindex.com.br. Respondemos no prazo previsto em lei.",
          ],
        },
        {
          heading: "6. Cookies",
          paragraphs: [
            "Usamos cookies necessários para manter sua sessão ativa e cookies de medição de audiência. Você pode bloqueá-los no navegador, mas os cookies de sessão são indispensáveis para entrar na sua conta.",
          ],
        },
        {
          heading: "7. Alterações",
          paragraphs: [
            "Podemos atualizar esta política. Mudanças relevantes serão comunicadas na plataforma ou por e-mail, sempre com a data de atualização no topo do documento.",
          ],
        },
      ]}
    />
  );
}
