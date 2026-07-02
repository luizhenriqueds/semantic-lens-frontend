import { profileScore } from "@/lib/format";
import type { ProfileKey, Property } from "@/lib/types";

const PROFILE_HINTS: { profile: ProfileKey; terms: string[] }[] = [
  { profile: "flip", terms: ["reforma", "reformar", "revender", "revenda", "flip"] },
  { profile: "student", terms: ["estudante", "estudantil", "faculdade", "universidade"] },
  { profile: "family", terms: ["familia", "família", "familiar", "morar", "moradia"] },
  { profile: "airbnb", terms: ["airbnb", "temporada", "curta", "hospede", "hóspede"] },
  { profile: "high_liquidity", terms: ["liquidez", "vender", "rapida", "rápida", "revenda"] },
  { profile: "commercial", terms: ["comercial", "loja", "sala", "comercio", "comércio"] },
];

const STOP = new Set([
  "de",
  "para",
  "com",
  "sem",
  "ate",
  "até",
  "em",
  "no",
  "na",
  "um",
  "uma",
  "e",
  "ou",
  "que",
  "por",
  "mil",
  "r$",
  "reais",
  "bom",
  "boa",
]);

export type SearchResult = { profile: ProfileKey | null; items: Property[] };

export function searchProperties(all: Property[], query: string): SearchResult {
  const q = query.toLowerCase();
  const profile = PROFILE_HINTS.find((h) => h.terms.some((t) => q.includes(t)))?.profile ?? null;

  const tokens = q
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t));

  const locTokens = tokens.filter((t) => !PROFILE_HINTS.some((h) => h.terms.includes(t)));

  let items = all;
  if (locTokens.length) {
    const matched = all.filter((p) => {
      const hay = `${p.title} ${p.neighborhood} ${p.city} ${p.uf} ${p.propertyType}`.toLowerCase();
      return locTokens.some((t) => hay.includes(t));
    });
    if (matched.length) items = matched;
  }

  const key = (p: Property) => (profile ? (profileScore(p) ?? 0) : (p.scores.investment ?? 0));
  items = [...items].sort((a, b) => key(b) - key(a));

  return { profile, items };
}
