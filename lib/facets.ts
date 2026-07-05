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

const DEED_TERMS = [
  "indisponibilidade",
  "penhora",
  "gravame",
  "gravames",
  "onus",
  "hipoteca",
  "usufruto",
  "matricula",
  "matriculas",
  "averbacao",
  "averbado",
  "clausula",
  "escritura",
  "alienacao",
  "fiduciaria",
  "servidao",
  "arresto",
  "sequestro",
  "litigio",
  "judicial",
  "restricao",
  "embargo",
  "inventario",
  "espolio",
  "desapropriacao",
];

export function isDeedQuery(raw: string): boolean {
  const n = normalize(raw);
  return DEED_TERMS.some((t) => n.includes(t));
}

const TYPE_KEYWORDS: [string[], string][] = [
  [["terreno", "lote"], "Terreno"],
  [["casa", "sobrado"], "Casa"],
  [["apartamento", "apto", "kitnet", "kitinete", "quitinete"], "Apartamento"],
  [["sala"], "Sala"],
];

export type Facets = {
  normalized: string;
  type: string | null;
  city: string | null;
  bedroomsMin: number | null;
  priceMax: number | null;
};

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

  return { normalized, type, city, bedroomsMin, priceMax };
}
