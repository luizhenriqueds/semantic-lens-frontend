// Real properties from the production base, captured on the date below.
// Photos are committed under /public/showcase so the section never depends on
// the Caixa CDN - a listing that is arrematado takes its photo down with it.
// The page presents these as a dated snapshot rather than as live offers.
export const SHOWCASE_CAPTURED = "2026-07-24";

export type ShowcaseUse = { k: string; v: number };

export type ShowcaseProperty = {
  slug: string;
  photo: string;
  type: string;
  title: string;
  location: string;
  areaM2: number;
  bedrooms: number | null;
  parking: number | null;
  occupancy: string;
  modality: string;
  saleValue: number;
  appraisedValue: number;
  discount: number;
  investment: number;
  visualScore: number;
  uses: ShowcaseUse[];
  why: string;
};

export const SHOWCASE: ShowcaseProperty[] = [
  {
    slug: "apto-ribeirao-preto",
    photo: "/showcase/apto-ribeirao-preto.jpg",
    type: "Apartamento",
    title: "Apartamento 3 dormitórios - Jardim Palma Travassos",
    location: "Ribeirão Preto/SP",
    areaM2: 64.3,
    bedrooms: 3,
    parking: 2,
    occupancy: "Desocupado",
    modality: "2º Leilão",
    saleValue: 137390,
    appraisedValue: 228983,
    discount: 40,
    investment: 89,
    visualScore: 81,
    uses: [
      { k: "Moradia familiar", v: 97 },
      { k: "Aluguel por temporada", v: 99 },
      { k: "Comercial", v: 97 },
      { k: "Liquidez na revenda", v: 89 },
    ],
    why: "fica a 153 m de parque e 199 m de restaurante, com farmácia a menos de 600 m - região completa que sustenta tanto moradia quanto renda.",
  },
  {
    slug: "apto-santa-cruz-rj",
    photo: "/showcase/apto-santa-cruz-rj.jpg",
    type: "Apartamento",
    title: "Apartamento 2 dormitórios - Santa Cruz",
    location: "Rio de Janeiro/RJ",
    areaM2: 44.22,
    bedrooms: 2,
    parking: null,
    occupancy: "Ocupado",
    modality: "Venda Direta Online",
    saleValue: 50846,
    appraisedValue: 140000,
    discount: 64,
    investment: 88,
    visualScore: 81,
    uses: [
      { k: "Aluguel por temporada", v: 100 },
      { k: "Comercial", v: 92 },
      { k: "Liquidez na revenda", v: 81 },
      { k: "Moradia familiar", v: 72 },
    ],
    why: "64% abaixo da avaliação, com escola a 271 m, shopping a 273 m e universidade a 275 m.",
  },
  {
    slug: "apto-rio-preto",
    photo: "/showcase/apto-rio-preto.jpg",
    type: "Apartamento",
    title: "Apartamento 2 dormitórios - Parque Residencial da Fraternidade",
    location: "São José do Rio Preto/SP",
    areaM2: 44.77,
    bedrooms: 2,
    parking: 1,
    occupancy: "Ocupado",
    modality: "Venda Direta Online",
    saleValue: 117861,
    appraisedValue: 195000,
    discount: 40,
    investment: 86,
    visualScore: 79,
    uses: [
      { k: "Aluguel por temporada", v: 100 },
      { k: "Comercial", v: 99 },
      { k: "Moradia familiar", v: 77 },
      { k: "Aluguel estudantil", v: 73 },
    ],
    why: "hotel a 51 m, parque a 139 m e restaurante a 178 m - entorno movimentado, que puxa a vocação de temporada.",
  },
  {
    slug: "apto-porto-alegre",
    photo: "/showcase/apto-porto-alegre.jpg",
    type: "Apartamento",
    title: "Apartamento 2 dormitórios - Morro Santana",
    location: "Porto Alegre/RS",
    areaM2: 41.19,
    bedrooms: 2,
    parking: null,
    occupancy: "Desocupado",
    modality: "Licitação Aberta",
    saleValue: 89576,
    appraisedValue: 153000,
    discount: 41,
    investment: 86,
    visualScore: 80,
    uses: [
      { k: "Aluguel por temporada", v: 100 },
      { k: "Comercial", v: 96 },
      { k: "Aluguel estudantil", v: 73 },
      { k: "Moradia familiar", v: 74 },
    ],
    why: "farmácia a 31 m, restaurante a 34 m e supermercado a 50 m - tudo a pé, o que sustenta a nota de conveniência.",
  },
  {
    slug: "casa-guaratiba",
    photo: "/showcase/casa-guaratiba.jpg",
    type: "Casa",
    title: "Casa 2 dormitórios - Guaratiba",
    location: "Rio de Janeiro/RJ",
    areaM2: 48,
    bedrooms: 2,
    parking: 1,
    occupancy: "Ocupado",
    modality: "Licitação Aberta",
    saleValue: 78396,
    appraisedValue: 135335,
    discount: 42,
    investment: 82,
    visualScore: 77,
    uses: [
      { k: "Aluguel por temporada", v: 100 },
      { k: "Comercial", v: 92 },
      { k: "Moradia familiar", v: 75 },
      { k: "Liquidez na revenda", v: 74 },
    ],
    why: "escola a 271 m, shopping a 273 m e universidade a 275 m, com 42% de desconto sobre a avaliação.",
  },
  {
    slug: "sobrado-mesquita",
    photo: "/showcase/sobrado-mesquita.jpg",
    type: "Sobrado",
    title: "Sobrado 2 dormitórios - Edson Passos",
    location: "Mesquita/RJ",
    areaM2: 69.26,
    bedrooms: 2,
    parking: null,
    occupancy: "Ocupado",
    modality: "Venda Direta Online",
    saleValue: 156619,
    appraisedValue: 270000,
    discount: 42,
    investment: 74,
    visualScore: 70,
    uses: [
      { k: "Moradia familiar", v: 76 },
      { k: "Reforma e revenda", v: 71 },
      { k: "Liquidez na revenda", v: 66 },
      { k: "Aluguel por temporada", v: 63 },
    ],
    why: "parque a 488 m e hospital a 835 m; nota menor que a dos vizinhos de lista - útil para ver a escala funcionando.",
  },
];
