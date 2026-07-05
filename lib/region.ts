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

export function regionTags(region: Region): string[] {
  if (region.topTags?.length) return region.topTags.slice(0, 2);
  if (!region.dna) return [];
  return (Object.entries(region.dna) as [keyof RegionDna, number][])
    .filter(([, v]) => v >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => TAG_LABEL[k]);
}
