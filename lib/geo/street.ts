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
export function streetOf(rawAddress: string | null | undefined): string | null {
  if (!rawAddress) return null;
  const head = rawAddress.split(",")[0].trim();
  if (!head || head.length < 3) return null;
  const cased = titleCase(head);
  const [first, ...rest] = cased.split(" ");
  const abbr = STREET_ABBR[first.toLowerCase()];
  return abbr ? [abbr, ...rest].join(" ") : cased;
}

const CEP = /\bcep:?\s*\d{5}-?\d{3}/i;

/** Every address ends "- CEP: nnnnn-nnn, CIDADE - ESTADO"; the city already has its own line. */
export function addressLine(rawAddress: string | null | undefined): string | null {
  if (!rawAddress) return null;
  const cased = titleCase(rawAddress).replace(/\bCep\b/g, "CEP");
  const cep = CEP.exec(cased);
  return cep ? cased.slice(0, cep.index + cep[0].length) : cased;
}

// Most common street among a cell's properties, to disambiguate same-named regions.
export function dominantStreet(properties: { rawAddress: string | null }[]): string | null {
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
