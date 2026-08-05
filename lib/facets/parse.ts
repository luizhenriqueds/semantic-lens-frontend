import { fuzzy, normalize } from "./normalize";
import {
  GOAL_FILLER,
  GOAL_KEYWORDS,
  LEXICAL_NOISE,
  LOCALITY_WORDS,
  POI_CATEGORY_KEYWORDS,
  POI_PHRASE_END,
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

const isGoalWord = (t: string) =>
  GOAL_KEYWORDS.some(([kws]) => kws.some((k) => t === k || (k.length >= 5 && t.startsWith(k))));

// Every lexical token is either a hard facet (type/city), locality filler, or something the
// caller's `extra` accounts for. `normalized` keeps punctuation, so compare on the word.
function allTokensExplained(f: Facets, extra: (t: string) => boolean): boolean {
  const core = new Set(f.lexicalCore.split(" ").filter(Boolean));
  return f.lexical
    .split(" ")
    .map((t) => t.replace(/^\W+|\W+$/g, ""))
    .filter(Boolean)
    .every((t) => core.has(t) || LOCALITY_WORDS.has(t) || extra(t));
}

// True when the goal words are the whole query ("comprar, reformar e revender"): nothing for
// retrieval to match on, so the goal score alone answers it. Type/city are already hard filters.
export function isPureGoal(f: Facets): boolean {
  if (!f.goal || f.poi || f.center) return false;
  return allTokensExplained(f, (t) => GOAL_FILLER.has(t) || isGoalWord(t));
}

// True when every word already became a predicate ("casa 02 quartos"), leaving nothing to rank.
// Bathrooms are excluded: only the retrieval RPC can filter on them.
export function isStructural(f: Facets): boolean {
  if (f.goal || f.poi || f.center || f.bathroomsMin != null) return false;
  const hasFacet =
    !!f.type || !!f.city || f.bedroomsMin != null || f.parkingMin != null || f.priceMax != null;
  return hasFacet && allTokensExplained(f, (t) => COUNT_WORD.test(t) || /^\d+$/.test(t));
}

const POI_CATEGORY_WORDS = new Set(POI_CATEGORY_KEYWORDS.flatMap(([kws]) => kws));

// True when the POI phrase is only a category word (e.g. a university type) with
// no specific place name - "near any of this kind" vs a named place.
export function isPoiCategoryOnly(name: string): boolean {
  const words = normalize(name).split(" ").filter(Boolean);
  return words.length > 0 && words.every((w) => POI_CATEGORY_WORDS.has(w));
}

const PROXIMITY_RE = /\b(?:perto|proxim[ao]s?|vizinh[ao]s?|junt[ao]|colad[ao]|lado)\s+(.+)$/;

// Edges only - interior stopwords belong to the name ("hospital das clínicas").
function trimEdges(words: string[]): string[] {
  const out = [...words];
  while (out.length && POI_STOPWORDS.has(out[0])) out.shift();
  while (out.length && POI_STOPWORDS.has(out[out.length - 1])) out.pop();
  return out;
}

// Everything after the proximity word, cut where the next facet starts.
function proximityPhrase(normalized: string): string[] {
  const m = normalized.match(PROXIMITY_RE);
  if (!m) return [];
  const words = m[1].split(" ").filter(Boolean);
  const end = words.findIndex((w) => POI_PHRASE_END.has(w));
  return trimEdges(end === -1 ? words : words.slice(0, end));
}

function withoutCity(words: string[], cityList: { raw: string; words: string[] }[]): string[] {
  for (const c of cityList) {
    for (let i = 0; i + c.words.length <= words.length; i++) {
      if (c.words.every((w, j) => words[i + j] === w)) {
        const out = [...words];
        out.splice(i, c.words.length);
        return trimEdges(out);
      }
    }
  }
  return words;
}

function findPoi(
  normalized: string,
  cityList: { raw: string; words: string[] }[],
): PoiQuery | null {
  const phrase = proximityPhrase(normalized).filter((w) => !LOCALITY_WORDS.has(w));
  const significant = withoutCity(phrase, cityList);
  const name = significant.join(" ").trim();
  if (name.length < 2) return null;

  let category: string | null = null;
  for (const [kws, cat] of POI_CATEGORY_KEYWORDS) {
    if (significant.some((w) => kws.includes(w))) {
      category = cat;
      break;
    }
  }
  // The city-qualified spelling is only worth a lookup when it reads as a name
  // ("shopping campo grande"), not as a sentence ("ufms em campo grande").
  const full = phrase.join(" ").trim();
  const isName = full && !phrase.some((w) => POI_STOPWORDS.has(w));
  return { name, fullName: isName ? full : name, category };
}

// Proximity to the city centre (ranked by center_proximity_m), not a POI match.
function isCenterProximity(
  normalized: string,
  cityList: { raw: string; words: string[] }[],
): boolean {
  const words = withoutCity(proximityPhrase(normalized), cityList);
  return words.length > 0 && words.every((w) => w === "centro");
}

/** Bedroom nouns people type. Shared with lib/filters/queryTerms.ts, so /search and the
 *  /properties filter box read the same vocabulary instead of drifting apart. */
export const BEDROOM_NOUNS =
  "quarto|quartos|dormitorio|dormitorios|dorm|dorms|suite|suites|qto|qtos|qt|qts";

/** `\b` so "2 qtde" cannot read as two bedrooms; the alternation still lets "quartos" win
 *  over "quarto". */
export const BEDROOMS_RE = new RegExp(`(\\d+)\\s*\\+?\\s*(?:${BEDROOM_NOUNS})\\b`);

const COUNT_WORD = new RegExp(
  `^(?:${BEDROOM_NOUNS}|vaga|vagas|garagem|garagens|banheiro|banheiros)$`,
);

// Keeps only tokens that can plausibly appear in a listing document - see LEXICAL_NOISE.
function buildLexical(normalized: string, priceMatch: string | null): string {
  const words = (priceMatch ? normalized.replace(priceMatch, " ") : normalized)
    .split(" ")
    .filter(Boolean)
    .filter((w) => !LEXICAL_NOISE.has(w));
  return words
    .filter((w, i) => !/^\d+([.,]\d+)?$/.test(w) || COUNT_WORD.test(words[i + 1] ?? ""))
    .join(" ");
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
      // Fuzzy on a single-word city turns "para"/"dinheiro"/"revender" into
      // Paraí/Pinheiro/Resende. Multi-word names keep typo tolerance.
      if (!exact && c.words.length === 1) continue;
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
  const bm = normalized.match(BEDROOMS_RE);
  if (bm) bedroomsMin = parseInt(bm[1], 10);

  // Neither retrieval arm nor the reranker honours a count reliably, so these are hard filters.
  const gm = normalized.match(/(\d+)\s*\+?\s*(?:vaga|vagas|garagem|garagens)/);
  const parkingMin = gm ? parseInt(gm[1], 10) : null;
  const wm = normalized.match(/(\d+)\s*\+?\s*(?:banheiro|banheiros|wc|lavabo|lavabos)/);
  const bathroomsMin = wm ? parseInt(wm[1], 10) : null;

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

  const lexical = buildLexical(normalized, pm ? pm[0] : null);
  const lexicalCore = [...used]
    .sort((a, b) => a - b)
    .map((i) => tokens[i])
    .join(" ");

  return {
    normalized,
    lexical: lexical || lexicalCore || normalized,
    lexicalCore,
    type,
    city,
    bedroomsMin,
    parkingMin,
    bathroomsMin,
    priceMax,
    goal: findGoal(tokens),
    poi: findPoi(normalized, cityList),
    center: isCenterProximity(normalized, cityList),
  };
}
