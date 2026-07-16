export type RegionDna = {
  conveniencia: number;
  perfilFamiliar: number;
  caminhabilidade: number;
  potencialAirbnb: number;
  demandaEstudantil: number;
  densidadeComercial: number;
};

export type Region = {
  h3: string;
  name: string;
  city: string;
  // Set only when another cell shares this city + name, to tell them apart in listings.
  subLabel: string | null;
  numProps: number;
  scores: {
    convenience: number | null;
    walkability: number | null;
    commercial: number | null;
    airbnb: number | null;
    student: number | null;
    family: number | null;
  };
  dna: RegionDna | null;
  topTags: string[];
  summary: string | null;
  counts: Record<string, number>;
  nearest: Record<string, number>;
  neighbors: { h3: string; similarity: number; name: string; city: string }[];
};
