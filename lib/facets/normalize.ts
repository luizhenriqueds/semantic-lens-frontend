export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

// Search cache key: folds "Casa 02 Quartos" onto "casa 2 quartos". Only whole tokens are
// unpadded, so "R$ 100.000" is left alone.
export function canonicalQuery(s: string): string {
  return normalize(s).replace(/(^|\s)0+(\d)/g, "$1$2");
}

// Keeps user input from turning into a LIKE wildcard.
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Damerau-Levenshtein distance (edits + adjacent transpositions).
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

// Tolerant token match: exact, prefix (>=5 chars), or within a length-scaled edit budget.
export function fuzzy(token: string, keyword: string): boolean {
  if (token === keyword) return true;
  if (keyword.length >= 5 && token.startsWith(keyword)) return true;
  const maxDist = keyword.length <= 4 ? 0 : keyword.length <= 6 ? 1 : 2;
  if (maxDist === 0 || Math.abs(token.length - keyword.length) > maxDist) return false;
  return editDistance(token, keyword) <= maxDist;
}
