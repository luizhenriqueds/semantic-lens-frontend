export const TYPE_KEYWORDS: [string[], string][] = [
  [["terreno", "lote"], "Terreno"],
  [["casa", "sobrado"], "Casa"],
  [["apartamento", "apto", "kitnet", "kitinete", "quitinete"], "Apartamento"],
  [["sala"], "Sala"],
];

// Investment goal -> property_scores column. Keywords match as stems.
export type GoalKey = "airbnb" | "student" | "family" | "flip" | "commercial" | "liquidity";

export const GOAL_KEYWORDS: [string[], GoalKey][] = [
  [["temporada", "airbnb", "veraneio"], "airbnb"],
  [["estudan", "universitari"], "student"],
  [["familia"], "family"],
  [["reform", "revend", "flip"], "flip"],
  [["comercial"], "commercial"],
  [["liquidez"], "liquidity"],
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
  "the",
  "e",
]);

// Generic place words that describe an area rather than a mappable POI - handled
// by the city filter + semantic ranking, not by proximity to a point.
export const LOCALITY_WORDS = new Set(["centro", "bairro", "bairros", "regiao", "zona", "cidade"]);

export type PoiQuery = { name: string; category: string | null };

export type Facets = {
  normalized: string;
  type: string | null;
  city: string | null;
  bedroomsMin: number | null;
  priceMax: number | null;
  goal: GoalKey | null;
  poi: PoiQuery | null;
};
