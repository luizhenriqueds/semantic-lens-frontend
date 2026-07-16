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
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function deriveTitle(tipo: string, quartos: number | null, bairro: string): string {
  const t = tipo || "Imóvel";
  if (quartos && quartos > 0) {
    return `${t} ${quartos} dormitório${quartos > 1 ? "s" : ""}`;
  }
  if (bairro) return `${t} em ${bairro}`;
  return t;
}
