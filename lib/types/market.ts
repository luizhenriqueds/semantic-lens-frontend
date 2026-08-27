export type MarketStats = {
  addressKey: string;
  uf: string | null;
  city: string | null;
  neighborhood: string | null;
  propertyType: string | null;
  sampleSize: number | null;
  priceMedian: number | null;
  areaMedian: number | null;
  priceM2Median: number | null;
  priceM2P25: number | null;
  priceM2P75: number | null;
  computedAt: string | null;
  sizeMatched?: boolean;
};

export type PriceHistoryPoint = {
  date: string;
  saleValue: number | null;
  appraisedValue: number | null;
  discount: number | null;
  modality: string | null;
};

/** Superset of the `CHANGE_KINDS` filter vocabulary: `relisted` is shown on the detail page only. */
export const PROPERTY_CHANGE_KINDS = ["modality", "payment", "price_drop", "relisted"] as const;

export type PropertyChangeKindLog = (typeof PROPERTY_CHANGE_KINDS)[number];

export type PropertyChange = { kind: PropertyChangeKindLog; date: string };
