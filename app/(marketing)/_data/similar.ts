// Real listings from production, frozen here with their photos.
//
// The visual matches happen to sit in one condominium in Santa Cruz, which is
// why their facades are near identical - but the page describes them the way
// the product does, as visually similar, never by address.
//
// It is the clearest demonstration the base offers: near identical facades,
// notas from 85 to 47. What separates them is the price, not the property.
export type SimilarProperty = {
  slug: string;
  photo: string;
  kind: "visual" | "equivalente";
  unit: string;
  title: string;
  location: string;
  areaM2: number;
  bedrooms: number | null;
  saleValue: number;
  discount: number;
  investment: number;
};

export const SIMILAR_SEED = {
  photo: "/showcase/similar/aporuna-409.jpg",
  unit: "apto. 409",
  title: "Apartamento 2 dormitórios - Santa Cruz",
  location: "Santa Cruz · Rio de Janeiro/RJ",
  areaM2: 41.19,
  bedrooms: 2,
  saleValue: 56361,
  appraisedValue: 136000,
  discount: 59,
  investment: 85,
};

export const SIMILAR: SimilarProperty[] = [
  {
    slug: "aporuna-401",
    photo: "/showcase/similar/aporuna-401.jpg",
    kind: "visual",
    unit: "apto. 401",
    title: "Apartamento 2 dormitórios",
    location: "Santa Cruz · Rio de Janeiro/RJ",
    areaM2: 41.27,
    bedrooms: 2,
    saleValue: 67066,
    discount: 58,
    investment: 84,
  },
  {
    slug: "aporuna-412",
    photo: "/showcase/similar/aporuna-412.jpg",
    kind: "visual",
    unit: "apto. 412",
    title: "Apartamento 2 dormitórios",
    location: "Santa Cruz · Rio de Janeiro/RJ",
    areaM2: 41.27,
    bedrooms: 2,
    saleValue: 68866,
    discount: 53,
    investment: 82,
  },
  {
    slug: "aporuna-206",
    photo: "/showcase/similar/aporuna-206.jpg",
    kind: "visual",
    unit: "apto. 206",
    title: "Apartamento 2 dormitórios",
    location: "Santa Cruz · Rio de Janeiro/RJ",
    areaM2: 41.27,
    bedrooms: 2,
    saleValue: 72902,
    discount: 46,
    investment: 80,
  },
  {
    slug: "aporuna-112",
    photo: "/showcase/similar/aporuna-112.jpg",
    kind: "visual",
    unit: "apto. 112",
    title: "Apartamento 2 dormitórios",
    location: "Santa Cruz · Rio de Janeiro/RJ",
    areaM2: 41.27,
    bedrooms: 2,
    saleValue: 103169,
    discount: 41,
    investment: 52,
  },
  {
    slug: "aporuna-301",
    photo: "/showcase/similar/aporuna-301.jpg",
    kind: "visual",
    unit: "apto. 301",
    title: "Apartamento compacto",
    location: "Santa Cruz · Rio de Janeiro/RJ",
    areaM2: 41.27,
    bedrooms: null,
    saleValue: 96000,
    discount: 41,
    investment: 47,
  },
  {
    slug: "ibirarema-402",
    photo: "/showcase/similar/ibirarema-402.jpg",
    kind: "equivalente",
    unit: "apto. 402",
    title: "Apartamento 2 dormitórios",
    location: "Santa Cruz · Rio de Janeiro/RJ",
    areaM2: 45.04,
    bedrooms: 2,
    saleValue: 49205,
    discount: 64,
    investment: 65,
  },
  {
    slug: "eugenia-501",
    photo: "/showcase/similar/eugenia-501.jpg",
    kind: "equivalente",
    unit: "apto. 505",
    title: "Apartamento 2 dormitórios",
    location: "Santa Cruz · Rio de Janeiro/RJ",
    areaM2: 40.54,
    bedrooms: 2,
    saleValue: 71654,
    discount: 43,
    investment: 55,
  },
];
