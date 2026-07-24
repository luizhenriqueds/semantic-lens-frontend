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
