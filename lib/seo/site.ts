// The old fallback was localhost, which does not fail loudly: a deploy missing the env var
// silently publishes localhost canonicals and de-indexes the site.
const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

export const SITE_URL = (
  fromEnv ||
  (fromVercel ? `https://${fromVercel}` : "") ||
  "https://semantic-lens-frontend.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Leilão Index";

/** The home <title>, and the fallback for any route that does not set its own. */
export const SITE_TITLE = "Leilão Index | A Plataforma Definitiva para Leilão de Imóveis";

export const SITE_TAGLINE = "Leilões inteligentes";

export const SITE_DESCRIPTION =
  "Encontre imóveis de leilão e venda direta da Caixa com desconto sobre a avaliação. " +
  "O Leilão Index dá a cada imóvel uma Nota de Investimento de 0 a 100 - preço, região e revenda - " +
  "sempre com o porquê.";

export const abs = (path: string): string => new URL(path, SITE_URL).toString();
