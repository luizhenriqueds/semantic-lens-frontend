import type { Property, Scores } from "@/lib/types";

const ZERO_SCORES: Scores = {
  flip: null,
  liquidity: null,
  airbnb: null,
  student: null,
  family: null,
  commercial: null,
  convenience: null,
  investment: null,
};

type Overrides = Partial<Omit<Property, "scores">> & { scores?: Partial<Scores> };

// Minimal, fully-typed Property for pure-function tests. Override only the
// fields a given test cares about (scores may be a partial too).
export function makeProperty(overrides: Overrides = {}): Property {
  const { scores, ...rest } = overrides;
  return {
    id: "p1",
    propertyType: "Apartamento",
    uf: "SP",
    city: "São Paulo",
    neighborhood: "Centro",
    rawAddress: null,
    area: 60,
    bedrooms: 2,
    parkingSpots: null,
    yearBuilt: null,
    occupancyStatus: null,
    title: "Apartamento",
    description: null,
    image: null,
    appraisedValue: null,
    saleValue: 300000,
    discount: null,
    modality: null,
    auctionDate: null,
    link: null,
    inactive: false,
    acceptsFinancing: false,
    acceptsFgts: false,
    profile: null,
    profileScore: null,
    clusterId: null,
    clusterLabel: null,
    h3: null,
    lat: null,
    lon: null,
    visualScore: null,
    visualNote: null,
    visualAge: null,
    priceRank: null,
    sizeRank: null,
    centerProximity: null,
    nearestPoi: {},
    ...rest,
    scores: { ...ZERO_SCORES, ...scores },
  };
}
