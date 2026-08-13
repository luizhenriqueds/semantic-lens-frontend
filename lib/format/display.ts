import { BRL, EMPTY } from "./constants";

export function money(n: number | null | undefined): string {
  if (n == null) return EMPTY;
  return BRL + Math.round(n).toLocaleString("pt-BR");
}

export function moneyShort(n: number | null | undefined): string {
  if (n == null) return EMPTY;
  if (n >= 1_000_000)
    return BRL + (n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mi";
  return BRL + Math.round(n / 1000) + " mil";
}

// Compact counts for headline figures: 33.347 -> "33,3 mil". Stays exact below
// 10 mil so counts like 1.517 keep their thousands separator instead of
// collapsing into a vague "1,5 mil".
export function countShort(n: number | null | undefined): string {
  if (n == null) return EMPTY;
  if (n >= 1_000_000)
    return (n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mi";
  if (n >= 10_000)
    return (n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil";
  return n.toLocaleString("pt-BR");
}

/** "3.360 imóveis". Shared so the server-rendered SEO heading and the client list agree. */
export const nImoveis = (n: number) =>
  `${n.toLocaleString("pt-BR")} ${n === 1 ? "imóvel" : "imóveis"}`;

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function fmtDist(meters: number | null | undefined): string {
  if (meters == null) return EMPTY;
  if (meters < 1000) return Math.round(meters) + " m";
  return (meters / 1000).toFixed(1).replace(".", ",") + " km";
}

export function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function fmtDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  // A bare `YYYY-MM-DD` parses as UTC midnight, a day early west of Greenwich.
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Digits only, capped at a BR mobile number with DDD. */
export const phoneDigits = (v: string) => v.replace(/\D/g, "").slice(0, 11);

/** Progressive BR mask: 11 9 8765-4321 -> (11) 98765-4321, landlines -> (11) 8765-4321. */
export function fmtPhone(v: string): string {
  const d = phoneDigits(v);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const tail = d.length <= 10 ? 6 : 7;
  return `(${d.slice(0, 2)}) ${d.slice(2, tail)}-${d.slice(tail)}`;
}

export function deriveTitle(tipo: string, quartos: number | null, bairro: string): string {
  const t = tipo || "Imóvel";
  if (quartos && quartos > 0) {
    return `${t} ${quartos} dormitório${quartos > 1 ? "s" : ""}`;
  }
  if (bairro) return `${t} em ${bairro}`;
  return t;
}
