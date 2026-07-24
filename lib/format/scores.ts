import type { ProfileKey, Property, Scores, VisualAge } from "@/lib/types";
import type { GoalKey } from "@/lib/facets";

// "investment" has no profile badge of its own - cards keep their primary profile.
export const GOAL_PROFILE: Record<GoalKey, ProfileKey | null> = {
  airbnb: "airbnb",
  student: "student",
  family: "family",
  flip: "flip",
  commercial: "commercial",
  liquidity: "high_liquidity",
  investment: null,
};

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

export const SCORE_GENERAL_EXPLAIN =
  "Cada nota vai de 0 a 100 e compara o imóvel com os outros da mesma cidade. 70 significa " +
  "“melhor que a maioria” naquele aspecto - não é uma nota absoluta. Quando falta um dado, ele é " +
  "ignorado no cálculo e não vira ponto negativo.";

export const SCORE_EXPLAIN: Record<keyof Scores, string> = {
  investment:
    "A nota principal: combina preço frente ao mercado, desconto sobre a avaliação, serviços no " +
    "entorno, facilidade de revenda e o melhor uso possível do imóvel. O peso de cada fator muda " +
    "conforme o tipo - imóvel, terreno ou outros. A nota é reduzida quando faltam dados sobre o " +
    "imóvel e quando há muitos imóveis iguais à venda na mesma região.",
  liquidity:
    "Estima a facilidade de revender: tipo do imóvel (apartamento é o mais líquido, terreno o " +
    "menos), área, quartos, preço dentro do próprio segmento e a procura na região.",
  flip:
    "Estima a margem de uma revenda rápida: preço frente ao mercado, área, quartos e desconto " +
    "sobre a avaliação. Aqui um imóvel com aparência ruim pontua mais alto - é o potencial de " +
    "valorização com reforma.",
  airbnb:
    "Mede o quanto a região atrai visitantes: hotéis e restaurantes por perto, proximidade do " +
    "centro e de universidades. Muitos hotéis por perto contam a favor - indicam uma área que já " +
    "recebe turistas.",
  student: "Universidades por perto, somadas a um imóvel compacto e com poucos quartos.",
  family: "Quartos e área do imóvel, mais escolas, parques e supermercados na região.",
  convenience:
    "Mede o dia a dia a pé: supermercados, hospitais, escolas, farmácias e parques por perto.",
  commercial:
    "Mede o movimento comercial do entorno: agências bancárias, shoppings e restaurantes nas " +
    "proximidades.",
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

export const SCORE_FIELD: Record<ProfileKey, keyof Scores> = {
  airbnb: "airbnb",
  flip: "flip",
  student: "student",
  family: "family",
  high_liquidity: "liquidity",
  commercial: "commercial",
};

export function scoreForProfile(p: Property, profile: ProfileKey): number | null {
  return p.scores[SCORE_FIELD[profile]];
}

export function profileScore(p: Property): number | null {
  return p.profile ? scoreForProfile(p, p.profile) : null;
}

// Headline "nota": the weighted investment index, present for every scored property.
export function investmentScore(p: Property): number | null {
  return p.scores.investment;
}

// Ranks the investment goals this property fits best, highest score first.
// Used to surface the top few "melhor para" pills on cards.
export function topGoals(p: Property, n = 2): { key: ProfileKey; score: number }[] {
  return (Object.keys(SCORE_FIELD) as ProfileKey[])
    .map((key) => ({ key, score: p.scores[SCORE_FIELD[key]] }))
    .filter((g): g is { key: ProfileKey; score: number } => g.score != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export function isFirstAuction(modalidade: string | null | undefined): boolean {
  if (!modalidade) return false;
  return /\b1\s*[ºoª]?\s*(leil|pra[cç])/i.test(modalidade);
}

export function showDiscount(p: Property): boolean {
  return p.discount != null && p.discount > 0 && !isFirstAuction(p.modality);
}
