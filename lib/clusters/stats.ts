import { investmentScore, profileScore } from "@/lib/format";
import type { Property } from "@/lib/types";
import { propertyAge } from "./age";

export type ClusterStats = {
  count: number;
  medianPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  medianDiscount: number | null;
  avgScore: number | null;
  avgAge: number | null;
  topCity: string | null;
  cityCount: number;
  sampleImages: string[];
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function clusterStats(properties: Property[], clusterId: number): ClusterStats {
  const items = properties.filter((p) => p.clusterId === clusterId);
  const prices = items.map((p) => p.saleValue).filter((v): v is number => v != null);
  const discounts = items.map((p) => p.discount).filter((v): v is number => v != null && v > 0);
  const scores = items.map((p) => investmentScore(p)).filter((v): v is number => v != null);
  const cityCount = new Map<string, number>();
  for (const p of items) {
    if (p.city) cityCount.set(p.city, (cityCount.get(p.city) ?? 0) + 1);
  }
  const topCity = [...cityCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const ages = items.map((p) => propertyAge(p.yearBuilt)).filter((v): v is number => v != null);

  // Pick up to 4 distinct property photos for the cover mosaic. Prefer the
  // highest-scoring listings so the thumbnail leads with the best options, and
  // spread across neighborhoods to keep the mosaic visually varied.
  const withImage = items.filter((p): p is Property & { image: string } => !!p.image);
  withImage.sort((a, b) => (profileScore(b) ?? 0) - (profileScore(a) ?? 0));
  const sampleImages: string[] = [];
  const seenImg = new Set<string>();
  const seenHood = new Set<string>();
  for (const p of withImage) {
    if (seenImg.has(p.image) || seenHood.has(p.neighborhood)) continue;
    seenImg.add(p.image);
    seenHood.add(p.neighborhood);
    sampleImages.push(p.image);
    if (sampleImages.length === 4) break;
  }
  // Backfill if too few distinct neighborhoods to reach a full mosaic.
  if (sampleImages.length < 4) {
    for (const p of withImage) {
      if (seenImg.has(p.image)) continue;
      seenImg.add(p.image);
      sampleImages.push(p.image);
      if (sampleImages.length === 4) break;
    }
  }

  return {
    count: items.length,
    medianPrice: median(prices),
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    medianDiscount: median(discounts),
    avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    avgAge: ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null,
    topCity,
    cityCount: cityCount.size,
    sampleImages,
  };
}
