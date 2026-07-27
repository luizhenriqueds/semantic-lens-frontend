export const TYPE_KEYWORDS: [string[], string][] = [
  [["terreno", "lote"], "Terreno"],
  // Sobrado is its own catalogue type; folding it into Casa filtered it out.
  [["sobrado"], "Sobrado"],
  [["casa"], "Casa"],
  [["apartamento", "apto", "ap", "kitnet", "kitinete", "quitinete"], "Apartamento"],
  [["sala"], "Sala"],
];

// Investment goal -> property_scores column. Keywords match as stems.
export type GoalKey =
  "airbnb" | "student" | "family" | "flip" | "commercial" | "liquidity" | "investment";

// Order matters: the first match wins, so the specific goals come before the
// catch-all "investment".
export const GOAL_KEYWORDS: [string[], GoalKey][] = [
  [["temporada", "airbnb", "veraneio"], "airbnb"],
  [["estudan", "universitari"], "student"],
  [["familia"], "family"],
  [["reform", "revend", "flip"], "flip"],
  [["comercial"], "commercial"],
  [["liquidez"], "liquidity"],
  [["investir", "investimento", "rentabilidade"], "investment"],
];

// Category words narrow the POI lookup; they stay part of the name too.
export const POI_CATEGORY_KEYWORDS: [string[], string][] = [
  [["universidade", "faculdade", "campus"], "university"],
  [["hospital", "upa"], "hospital"],
  [["supermercado", "mercado", "atacado", "atacadao"], "supermarket"],
  [["shopping"], "shopping_center"],
  [["parque"], "park"],
  [["restaurante"], "restaurant"],
  [["hotel", "pousada"], "hotel"],
  [["escola", "colegio"], "school"],
  [["banco"], "bank"],
  [["farmacia", "drogaria"], "pharmacy"],
];

// Objective words rather than property attributes - see isPureGoal.
export const GOAL_FILLER = new Set([
  "comprar",
  "compra",
  "vender",
  "venda",
  "revender",
  "revenda",
  "alugar",
  "aluguel",
  "locacao",
  "renda",
  "lucro",
  "retorno",
  "ganho",
  "ganhar",
  "morar",
  "residir",
  "negocio",
  "oportunidade",
  "objetivo",
  "ideal",
  "otimo",
  "otima",
]);

export const POI_STOPWORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "a",
  "o",
  "ao",
  "aos",
  "as",
  "um",
  "uma",
  "no",
  "na",
  "em",
  "the",
  "e",
  "para",
  "pra",
]);

// Generic place words that describe an area rather than a mappable POI - handled
// by the city filter + semantic ranking, not by proximity to a point.
// "central" is here because Central (BA) is a real city: without it "região central" filters
// the whole search down to a small Bahian town.
export const LOCALITY_WORDS = new Set([
  "centro",
  "central",
  "centrais",
  "bairro",
  "bairros",
  "regiao",
  "zona",
  "cidade",
]);

// End the place name - what follows belongs to another facet ("perto da usp ate 200 mil",
// "perto da ufms para estudantes").
export const POI_PHRASE_END = new Set([
  "para",
  "pra",
  // Locative: what follows qualifies where, not which place ("praia em santa catarina").
  "em",
  "ate",
  "abaixo",
  "maximo",
  "menos",
  "max",
  "com",
  "sem",
  "por",
  "que",
  "acima",
  "entre",
]);

// Stripped from `lexical` only: the full-text branch ANDs every token, so one word
// that appears in no listing zeroes recall. The embedding still sees `normalized`.
export const LEXICAL_NOISE = new Set([
  ...POI_STOPWORDS,
  "perto",
  "proximo",
  "proxima",
  "proximos",
  "proximas",
  "vizinho",
  "vizinha",
  "junto",
  "colado",
  "lado",
  "ate",
  "abaixo",
  "maximo",
  "menos",
  "max",
  "mil",
  "mi",
  "milhao",
  "milhoes",
  "k",
  "r$",
  "quero",
  "queria",
  "gostaria",
  "procuro",
  "busco",
  "preciso",
  "meu",
  "minha",
  "muito",
  "sem",
  "com",
  "que",
  "bom",
  "boa",
  "bons",
  "boas",
  "barato",
  "barata",
  "imovel",
  "imoveis",
  "algum",
  "alguma",
  "qualquer",
  "melhor",
  "melhores",
]);

export type PoiQuery = {
  name: string; // city stripped out ("shopping" for "shopping campo grande")
  fullName: string; // city kept - used only to key the cache
  category: string | null;
};

export type Facets = {
  normalized: string;
  // Full-text query: `normalized` minus filler; `lexicalCore` is type/city tokens only.
  lexical: string;
  lexicalCore: string;
  type: string | null;
  city: string | null;
  bedroomsMin: number | null;
  parkingMin: number | null;
  bathroomsMin: number | null;
  priceMax: number | null;
  goal: GoalKey | null;
  poi: PoiQuery | null;
  center: boolean;
};
