import type { ProfileKey, Property, Scores, VisualAge } from "@/lib/types";

export const VISUAL_AGE_LABEL: Record<VisualAge, string> = {
  novo: "Novo",
  intermediario: "Intermediário",
  antigo: "Antigo",
};

export const PROFILE_LABEL: Record<ProfileKey, string> = {
  airbnb: "Aluguel por temporada",
  flip: "Reforma e revenda",
  student: "Aluguel estudantil",
  family: "Moradia familiar",
  high_liquidity: "Venda rápida",
  commercial: "Comercial",
};

export const PROFILE_SHORT: Record<ProfileKey, string> = {
  airbnb: "Temporada",
  flip: "Flip",
  student: "Estudantil",
  family: "Familiar",
  high_liquidity: "Liquidez",
  commercial: "Comercial",
};

export const PROFILE_EXPLAIN: Record<ProfileKey, string> = {
  airbnb:
    "Avalia a procura por aluguel de curta temporada, a localização e o giro de hóspedes na região.",
  flip: "Avalia o desconto, o custo de reforma estimado e o preço de revenda no bairro.",
  student: "Avalia a proximidade de universidades e a estabilidade do aluguel para estudantes.",
  family: "Avalia tamanho, número de quartos, escolas e serviços próximos para moradia familiar.",
  high_liquidity: "Avalia a facilidade e a rapidez para revender o imóvel no mercado local.",
  commercial:
    "Avalia o potencial comercial, o fluxo de pessoas e a densidade de serviços no entorno.",
};

export const SCORE_LABEL: Record<keyof Scores, string> = {
  flip: "Flip",
  liquidity: "Liquidez",
  airbnb: "Aluguel por temporada",
  student: "Estudantil",
  family: "Familiar",
  commercial: "Comercial",
  convenience: "Conveniência",
  investment: "Investimento",
};

export const SCORE_DIMS: (keyof Scores)[] = [
  "airbnb",
  "flip",
  "student",
  "family",
  "liquidity",
  "commercial",
  "convenience",
  "investment",
];

const SCORE_FIELD: Record<ProfileKey, keyof Scores> = {
  airbnb: "airbnb",
  flip: "flip",
  student: "student",
  family: "family",
  high_liquidity: "liquidity",
  commercial: "commercial",
};

export function profileScore(p: Property): number | null {
  if (!p.profile) return null;
  return p.scores[SCORE_FIELD[p.profile]];
}

// Overall investment score — a weighted index computed from all the other
// feature scores. Present for every scored property, so it doubles as the
// property's headline "nota".
export function investmentScore(p: Property): number | null {
  return p.scores.investment;
}

export function scoreForProfile(p: Property, profile: ProfileKey): number | null {
  return p.scores[SCORE_FIELD[profile]];
}

export function isFirstAuction(modalidade: string | null | undefined): boolean {
  if (!modalidade) return false;
  return /\b1\s*[ºoª]?\s*(leil|pra[cç])/i.test(modalidade);
}

export function showDiscount(p: Property): boolean {
  return p.discount != null && p.discount > 0 && !isFirstAuction(p.modality);
}

export function discountPercentile(all: Property[], p: Property): number | null {
  if (p.discount == null) return null;
  const others = all.filter((x) => x.id !== p.id && x.discount != null);
  if (others.length < 5) return null;
  const below = others.filter((x) => x.discount! < p.discount!).length;
  return Math.round((below / others.length) * 100);
}

export function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

export function moneyShort(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000)
    return "R$ " + (n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mi";
  return "R$ " + Math.round(n / 1000) + " mil";
}

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function fmtDist(meters: number | null | undefined): string {
  if (meters == null) return "—";
  if (meters < 1000) return Math.round(meters) + " m";
  return (meters / 1000).toFixed(1).replace(".", ",") + " km";
}

export function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function fmtDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function deriveTitle(tipo: string, quartos: number | null, bairro: string): string {
  const t = tipo || "Imóvel";
  if (quartos && quartos > 0) {
    return `${t} ${quartos} dormitório${quartos > 1 ? "s" : ""}`;
  }
  if (bairro) return `${t} em ${bairro}`;
  return t;
}
