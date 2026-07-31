import { T, button, fallbackLink, features, note, p, shell } from "./layout";

type Email = { subject: string; html: string };

const firstName = (name?: string) => (name || "").trim().split(" ")[0];
const hi = (name?: string) => (firstName(name) ? `Olá, ${firstName(name)}!` : "Olá!");

export function signupVerification({ name, url }: { name?: string; url: string }): Email {
  return {
    subject: "Confirme seu e-mail para concluir o cadastro",
    html: shell({
      preheader: "Falta só um passo para ativar sua conta na Lavra.",
      title: "Confirme seu e-mail",
      body: [
        p(`${hi(name)} Sua conta na Lavra está quase pronta.`),
        p("Clique no botão abaixo para validar seu e-mail e concluir o cadastro."),
        button(url, "Confirmar e-mail"),
        note(
          `O link vale por <b>24 horas</b> e pode ser usado uma única vez. Se você não criou uma conta na Lavra, é só ignorar esta mensagem - nada será ativado.`,
        ),
        `<div style="margin:24px 0 0">${fallbackLink(url)}</div>`,
      ].join(""),
    }),
  };
}

export function welcome({ name, url }: { name?: string; url: string }): Email {
  return {
    subject: "Bem-vindo à Lavra 🌿",
    html: shell({
      preheader: "Sua conta está ativa. Veja por onde começar.",
      title: "Sua conta está ativa",
      body: [
        p(`${hi(name)} Tudo certo com seu e-mail - sua conta na Lavra já está liberada.`),
        p(
          "Reunimos milhares de leilões em um painel só, com notas fáceis de comparar. Um bom começo:",
        ),
        features([
          {
            title: "Busque em português, sem dropdowns",
            body: "Descreva o imóvel que você quer - “casa para reformar e revender na zona sul de SP” - e os resultados vêm ordenados por afinidade com o seu objetivo.",
          },
          {
            title: "Alertas na hora certa",
            body: "Salve uma busca e avisamos assim que um imóvel novo bater com os seus critérios, antes da praça abrir.",
          },
          {
            title: "Grupos de oportunidades parecidas",
            body: "Navegue por “famílias” de imóveis equivalentes e compare lado a lado sem abrir dezenas de editais.",
          },
          {
            title: "Regiões e o que há por perto",
            body: "Filtre por proximidade de escolas, metrô, hospitais e mercados, e veja o comportamento de preços da região.",
          },
          {
            title: "Minha carteira",
            body: "Favorite os imóveis que interessam e acompanhe praças, prazos e mudanças de preço em um só lugar.",
          },
        ]),
        button(url, "Abrir meu painel"),
        note(
          "Dica: comece pela busca e salve o primeiro alerta. É o caminho mais rápido para não perder uma oportunidade.",
        ),
      ].join(""),
    }),
  };
}

export function signin({ name, url }: { name?: string; url: string }): Email {
  return {
    subject: "Seu link de acesso à Lavra",
    html: shell({
      preheader: "Entre na sua conta com um clique. O link expira em 1 hora.",
      title: "Entrar na Lavra",
      body: [
        p(`${hi(name)} Use o botão abaixo para acessar sua conta.`),
        button(url, "Entrar na minha conta"),
        note(
          `O link expira em <b>1 hora</b> e só pode ser usado uma vez. Se você não pediu este acesso, ignore este e-mail - sua conta segue protegida.`,
        ),
        `<div style="margin:24px 0 0">${fallbackLink(url)}</div>`,
      ].join(""),
    }),
  };
}

export function passwordReset({ name, url }: { name?: string; url: string }): Email {
  return {
    subject: "Redefinir sua senha da Lavra",
    html: shell({
      preheader: "Crie uma nova senha. O link expira em 1 hora.",
      title: "Redefinir sua senha",
      body: [
        p(`${hi(name)} Recebemos um pedido para redefinir a senha da sua conta na Lavra.`),
        button(url, "Criar nova senha"),
        p("Sua senha atual continua valendo até você concluir esse passo.", `color:${T.inkFaint}`),
        note(
          `O link expira em <b>1 hora</b>. Se não foi você quem pediu, ignore este e-mail e considere trocar sua senha por precaução.`,
        ),
        `<div style="margin:24px 0 0">${fallbackLink(url)}</div>`,
      ].join(""),
    }),
  };
}

export const TEMPLATES = { signupVerification, welcome, signin, passwordReset };
export type TemplateName = keyof typeof TEMPLATES;
