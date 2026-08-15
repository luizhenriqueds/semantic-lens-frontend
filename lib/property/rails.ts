import "server-only";
import { getPropertiesByIds, getPropertiesPage, getRecommendations, isListable } from "@/lib/data";
import type { RecItem } from "@/components/property/SimilarCarousel";
import type { Property, PropertyFilters } from "@/lib/types";

/** Half-width of the "mesma faixa de preço" band. */
const PRICE_BAND = 0.1;

/** An h3 cell this thin reads as a broken rail, so it falls back to the city instead. */
const MIN_REGION_ITEMS = 3;

// One page of the list RPC as a rail. Pulls one extra: this property matches its own filters.
async function railItems(
  filters: PropertyFilters,
  exceptId: string,
  take: number,
): Promise<RecItem[]> {
  const { items } = await getPropertiesPage({
    filters,
    sort: "investimento",
    pageSize: take + 1,
  });
  return items
    .filter((x) => x.id !== exceptId)
    .slice(0, take)
    .map((p) => ({ p }));
}

// Both rails stay within the property's own type: a terreno next to an apartamento is a
// comparison nobody asked for, whatever the region or the price band says.
async function regionRail(p: Property, take: number) {
  const type = p.propertyType;
  if (p.h3) {
    const items = await railItems({ h3: p.h3, type }, p.id, take);
    if (items.length >= MIN_REGION_ITEMS)
      return { items, subtitle: `Outros imóveis na mesma área de ${p.city}.` };
  }
  const items = await railItems({ uf: p.uf, city: p.city, type }, p.id, take);
  return { items, subtitle: `Outros imóveis em ${p.city}/${p.uf}.` };
}

async function priceRail(p: Property, take: number): Promise<RecItem[]> {
  if (!p.saleValue) return [];
  const from = Math.round(p.saleValue * (1 - PRICE_BAND));
  const to = Math.round(p.saleValue * (1 + PRICE_BAND));
  return railItems({ range: { dim: "price", from, to }, type: p.propertyType }, p.id, take);
}

async function similarRails(id: string, take: number) {
  const recs = await getRecommendations(id);
  // Only surface recommendations that are a strong match (≥ 75%).
  const strong = recs.filter((r) => Math.round((r.similarity ?? 0) * 100) >= 75);
  if (!strong.length) return { visual: [], similar: [] };

  const props = await getPropertiesByIds([...new Set(strong.map((r) => r.recId))]);
  const byId = new Map(props.filter((x) => isListable(x)).map((x) => [x.id, x]));
  const items = (kind: "visual" | "similar"): RecItem[] =>
    strong
      .filter((r) => r.kind === kind)
      .map((r): RecItem | null => {
        const p = byId.get(r.recId);
        return p ? { p, match: Math.min(100, Math.round((r.similarity ?? 0) * 100)) } : null;
      })
      .filter((x): x is RecItem => x !== null)
      .slice(0, take);

  return { visual: items("visual"), similar: items("similar") };
}

export type Rails = {
  visual: RecItem[];
  similar: RecItem[];
  region: { items: RecItem[]; subtitle: string };
  price: RecItem[];
};

/** The four "mais imóveis como este" rails. Entitlement is the caller's job. */
export async function recommendationRails(p: Property, take: number): Promise<Rails> {
  const [similar, region, price] = await Promise.all([
    similarRails(p.id, take),
    regionRail(p, take),
    priceRail(p, take),
  ]);
  return { visual: similar.visual, similar: similar.similar, region, price };
}
