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

const POI_CATEGORY_WORDS = new Set(POI_CATEGORY_KEYWORDS.flatMap(([kws]) => kws));

// True when the POI phrase is only a category word (e.g. a university type) with
// no specific place name — "near any of this kind" vs a named place.
export function isPoiCategoryOnly(name: string): boolean {
  const words = normalize(name).split(" ").filter(Boolean);
  return words.length > 0 && words.every((w) => POI_CATEGORY_WORDS.has(w));
}

const PROXIMITY_RE = /\b(?:perto|proxim[ao]s?|vizinh[ao]s?|junt[ao]|colad[ao]|lado)\s+(.+)$/;

// Words left in the proximity phrase once leading stopwords and the city name
// are removed (city is filtered separately, the neighbourhood semantically).
function proximityWords(
  normalized: string,
  cityList: { raw: string; words: string[] }[],
): string[] {
  const m = normalized.match(PROXIMITY_RE);
  if (!m) return [];
  const words = m[1].split(" ").filter(Boolean);
  while (words.length && POI_STOPWORDS.has(words[0])) words.shift();
  for (const c of cityList) {
    for (let i = 0; i + c.words.length <= words.length; i++) {
      if (c.words.every((w, j) => words[i + j] === w)) {
        words.splice(i, c.words.length);
        break;
      }
    }
  }
  return words.filter((w) => !POI_STOPWORDS.has(w));
}

function findPoi(
  normalized: string,
  cityList: { raw: string; words: string[] }[],
): PoiQuery | null {
  const significant = proximityWords(normalized, cityList).filter((w) => !LOCALITY_WORDS.has(w));
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

// Proximity to the city centre (ranked by center_proximity_m), not a POI match.
function isCenterProximity(
  normalized: string,
  cityList: { raw: string; words: string[] }[],
): boolean {
  const words = proximityWords(normalized, cityList);
  return words.length > 0 && words.every((w) => w === "centro");
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
          // Never let a locality word ("centro"…) fuzzy-match a city (e.g. "Central").
          if (
            used.has(i + j) ||
            LOCALITY_WORDS.has(tokens[i + j]) ||
            !match(tokens[i + j], c.words[j], exact)
          ) {
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
    center: isCenterProximity(normalized, cityList),
  };
}
