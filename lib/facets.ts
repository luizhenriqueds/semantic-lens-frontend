export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

function fuzzy(token: string, keyword: string): boolean {
  if (token === keyword) return true;
  if (keyword.length >= 5 && token.startsWith(keyword)) return true;
  const maxDist = keyword.length <= 4 ? 0 : keyword.length <= 6 ? 1 : 2;
  if (maxDist === 0 || Math.abs(token.length - keyword.length) > maxDist) return false;
  return editDistance(token, keyword) <= maxDist;
}

const TYPE_KEYWORDS: [string[], string][] = [
  [["terreno", "lote"], "Terreno"],
  [["casa", "sobrado"], "Casa"],
  [["apartamento", "apto", "kitnet", "kitinete", "quitinete"], "Apartamento"],
  [["sala"], "Sala"],
];

// Investment goal → property_scores column. Keywords match as stems.
export type GoalKey = "airbnb" | "student" | "family" | "flip" | "commercial" | "liquidity";

const GOAL_KEYWORDS: [string[], GoalKey][] = [
  [["temporada", "airbnb", "veraneio"], "airbnb"],
  [["estudan", "universitari"], "student"],
  [["familia"], "family"],
  [["reform", "revend", "flip"], "flip"],
  [["comercial"], "commercial"],
  [["liquidez"], "liquidity"],
];

// Category words narrow the POI lookup; they stay part of the name too.
const POI_CATEGORY_KEYWORDS: [string[], string][] = [
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

const POI_STOPWORDS = new Set([
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

// Generic place words that describe an area rather than a mappable POI — handled
// by the city filter + semantic ranking, not by proximity to a point.
const LOCALITY_WORDS = new Set(["centro", "bairro", "bairros", "regiao", "zona", "cidade"]);

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

function findGoal(tokens: string[]): GoalKey | null {
  for (const [kws, goal] of GOAL_KEYWORDS) {
    for (const kw of kws) {
      if (tokens.some((t) => t === kw || (kw.length >= 5 && t.startsWith(kw)))) return goal;
    }
  }
  return null;
}

function findPoi(
  normalized: string,
  cityList: { raw: string; words: string[] }[],
): PoiQuery | null {
  const m = normalized.match(
    /\b(?:perto|proxim[ao]s?|vizinh[ao]s?|junt[ao]|colad[ao]|lado)\s+(.+)$/,
  );
  if (!m) return null;
  const words = m[1].split(" ").filter(Boolean);
  while (words.length && POI_STOPWORDS.has(words[0])) words.shift();

  // Drop a city name from the phrase ("perto do centro corumba" is a place, not
  // a POI) — the city is filtered separately, the neighbourhood semantically.
  for (const c of cityList) {
    for (let i = 0; i + c.words.length <= words.length; i++) {
      if (c.words.every((w, j) => words[i + j] === w)) {
        words.splice(i, c.words.length);
        break;
      }
    }
  }

  const significant = words.filter((w) => !POI_STOPWORDS.has(w) && !LOCALITY_WORDS.has(w));
  const name = significant.join(" ").trim();
  if (name.length < 2) return null;

  let category: string | null = null;
  for (const [kws, cat] of POI_CATEGORY_KEYWORDS) {
    if (significant.some((w) => kws.includes(w))) {
      category = cat;
      break;
    }
  }
  return { name, category };
}

export function parseFacets(raw: string, cities: string[]): Facets {
  const normalized = normalize(raw);
  const tokens = normalized.split(" ").filter(Boolean);
  const used = new Set<number>();
  const cityList = cities
    .map((c) => ({ raw: c, words: normalize(c).split(" ") }))
    .sort((a, b) => b.words.length - a.words.length);

  const match = (t: string, kw: string, exact: boolean) => (exact ? t === kw : fuzzy(t, kw));

  const findType = (exact: boolean): string | null => {
    for (const [kws, canon] of TYPE_KEYWORDS) {
      for (const kw of kws) {
        for (let i = 0; i < tokens.length; i++) {
          if (!used.has(i) && match(tokens[i], kw, exact)) {
            used.add(i);
            return canon;
          }
        }
      }
    }
    return null;
  };

  const findCity = (exact: boolean): string | null => {
    for (const c of cityList) {
      for (let i = 0; i + c.words.length <= tokens.length; i++) {
        let ok = true;
        for (let j = 0; j < c.words.length; j++) {
          if (used.has(i + j) || !match(tokens[i + j], c.words[j], exact)) {
            ok = false;
            break;
          }
        }
        if (ok) {
          for (let j = 0; j < c.words.length; j++) used.add(i + j);
          return c.raw;
        }
      }
    }
    return null;
  };

  let type = findType(true);
  let city = findCity(true);
  if (!type) type = findType(false);
  if (!city) city = findCity(false);

  let bedroomsMin: number | null = null;
  const bm = normalized.match(
    /(\d+)\s*\+?\s*(?:quarto|quartos|dormitorio|dormitorios|dorm|suite|suites)/,
  );
  if (bm) bedroomsMin = parseInt(bm[1], 10);

  let priceMax: number | null = null;
  const pm = normalized.match(
    /(?:ate|abaixo de|no maximo|maximo|menos de|max)\s*(?:r\$)?\s*([\d.,]+)\s*(mil|mi|milhao|milhoes|k)?/,
  );
  if (pm) {
    let n = parseFloat(pm[1].replace(/\./g, "").replace(",", "."));
    const unit = pm[2];
    if (unit === "mil" || unit === "k") n *= 1000;
    else if (unit) n *= 1_000_000;
    if (!isNaN(n) && n > 0) priceMax = Math.round(n);
  }

  const goal = findGoal(tokens);
  const poi = findPoi(normalized, cityList);

  return { normalized, type, city, bedroomsMin, priceMax, goal, poi };
}
