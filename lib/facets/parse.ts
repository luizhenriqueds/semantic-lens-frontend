import { fuzzy, normalize } from "./normalize";
import {
  GOAL_KEYWORDS,
  LOCALITY_WORDS,
  POI_CATEGORY_KEYWORDS,
  POI_STOPWORDS,
  TYPE_KEYWORDS,
  type Facets,
  type GoalKey,
  type PoiQuery,
} from "./keywords";

function findGoal(tokens: string[]): GoalKey | null {
  for (const [kws, goal] of GOAL_KEYWORDS) {
    for (const kw of kws) {
      if (tokens.some((t) => t === kw || (kw.length >= 5 && t.startsWith(kw)))) return goal;
    }
  }
  return null;
}

export function goalFromQuery(query: string): GoalKey | null {
  return findGoal(normalize(query).split(" ").filter(Boolean));
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
  // a POI) - the city is filtered separately, the neighbourhood semantically.
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

  return {
    normalized,
    type,
    city,
    bedroomsMin,
    priceMax,
    goal: findGoal(tokens),
    poi: findPoi(normalized, cityList),
  };
}
