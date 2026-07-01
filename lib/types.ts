export type ProfileKey = "airbnb" | "flip" | "student" | "family" | "high_liquidity" | "commercial";

export type Scores = {
  flip: number | null;
  liquidity: number | null;
  airbnb: number | null;
  student: number | null;
  family: number | null;
  commercial: number | null;
  convenience: number | null;
  investment: number | null;
};

export type Property = {
  id: string;
  tipo: string;
  uf: string;
  cidade: string;
  bairro: string;
  area: number | null;
  quartos: number | null;
  vagas: number | null;
  situacao: string | null;
  titulo: string;
  descricao: string | null;
  image: string | null;
  aval: number | null;
  lance: number | null;
  desc: number | null;
  modalidade: string | null;
  dataLeilao: string | null;
  link: string | null;
  scores: Scores;
  perfil: ProfileKey | null;
  perfilScore: number | null;
  clusterId: number | null;
  clusterLabel: string | null;
  h3: string | null;
};

export type AlertFilters = {
  profile?: ProfileKey;
  minScore?: number;
  uf?: string;
  cidade?: string;
  tipo?: string;
  minDesconto?: number;
  maxPreco?: number;
};

export type Cluster = {
  clusterId: number;
  label: string;
  description: string | null;
  profile: ProfileKey | null;
  size: number;
  sampleIds: string[];
};

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
  nome: string;
  cidade: string;
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
  resumo: string | null;
  counts: Record<string, number>;
  nearest: Record<string, number>;
  neighbors: { h3: string; similarity: number; nome: string; cidade: string }[];
};
