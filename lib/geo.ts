import type { Property } from "@/lib/types";
import { titleCase } from "@/lib/format";

const STREET_ABBR: Record<string, string> = {
  avenida: "Av.",
  rua: "R.",
  travessa: "Tv.",
  praca: "Pç.",
  praça: "Pç.",
  rodovia: "Rod.",
  estrada: "Estr.",
  alameda: "Al.",
};

// Logradouro from a "RUA X, N. 12 ..." address, title-cased and abbreviated.
function streetOf(rawAddress: string | null | undefined): string | null {
  if (!rawAddress) return null;
  const head = rawAddress.split(",")[0].trim();
  if (!head || head.length < 3) return null;
  const cased = titleCase(head);
  const [first, ...rest] = cased.split(" ");
  const abbr = STREET_ABBR[first.toLowerCase()];
  return abbr ? [abbr, ...rest].join(" ") : cased;
}

// Most common street among a cell's properties, to disambiguate same-named regions.
export function dominantStreet(properties: Property[]): string | null {
  const counts = new Map<string, number>();
  for (const p of properties) {
    const s = streetOf(p.rawAddress);
    if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [s, n] of counts) {
    if (n > bestN) {
      best = s;
      bestN = n;
    }
  }
  return best;
}

// Groups properties that sit at the same coordinate (same address/building).
// Rounding to 5 decimals is ~1m, so only genuinely co-located listings merge.
export function groupByAddress(properties: Property[]): Property[][] {
  const groups = new Map<string, Property[]>();
  for (const p of properties) {
    if (p.lat == null || p.lon == null) continue;
    const key = `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
    const g = groups.get(key);
    if (g) g.push(p);
    else groups.set(key, [p]);
  }
  return [...groups.values()];
}
