import type { Region, RegionDna } from "@/lib/types";

export const DNA_ROWS: { key: keyof RegionDna; label: string }[] = [
  { key: "conveniencia", label: "Conveniência" },
  { key: "densidadeComercial", label: "Densidade comercial" },
  { key: "potencialAirbnb", label: "Potencial de aluguel por temporada" },
  { key: "demandaEstudantil", label: "Demanda estudantil" },
  { key: "perfilFamiliar", label: "Perfil familiar" },
  { key: "caminhabilidade", label: "Caminhabilidade" },
];

const TAG_LABEL: Record<keyof RegionDna, string> = {
  conveniencia: "Conveniência",
  densidadeComercial: "Comercial",
  potencialAirbnb: "Temporada",
  demandaEstudantil: "Estudantil",
  perfilFamiliar: "Familiar",
  caminhabilidade: "Caminhável",
};

export function regionTags(region: Pick<Region, "topTags" | "dna">): string[] {
  if (region.topTags?.length) return region.topTags.slice(0, 2);
  if (!region.dna) return [];
  return (Object.entries(region.dna) as [keyof RegionDna, number][])
    .filter(([, v]) => v >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => TAG_LABEL[k]);
}

/* ---------- /regions index: shape shared by the loader and the client ---------- */

// Each added key doubles the rankings the loader precomputes - see buildIndex.
export const REGION_SORTS = [
  { key: "numProps", label: "Mais imóveis" },
  { key: "commercial", label: "Comercial" },
  { key: "convenience", label: "Conveniência" },
  { key: "airbnb", label: "Temporada" },
] as const;

export const REGION_SORT_KEYS = REGION_SORTS.map((s) => s.key);
export type RegionSortKey = (typeof REGION_SORTS)[number]["key"];

export type RegionInsightKey = "airbnb" | "student" | "family" | "convenience" | "commercial";

export type RegionListItem = Pick<
  Region,
  "h3" | "name" | "city" | "subLabel" | "numProps" | "scores"
> & { tags: string[] };

export type RegionsIndex = {
  total: number;
  totalProps: number;
  items: RegionListItem[];
  // combo key -> indices into `items`, best first
  rankings: Record<string, number[]>;
  best: Record<RegionInsightKey, number | null>;
};

export const regionComboKey = (keys: readonly RegionSortKey[]): string =>
  REGION_SORT_KEYS.filter((k) => keys.includes(k)).join("+");
