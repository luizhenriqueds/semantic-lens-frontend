// Sliced from the YYYY-MM-DD prefix, never parsed into a Date: a `getTime()` delta shifts by a
// day between a UTC-3 machine and a UTC CI runner.
function dayNumber(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return Math.floor(Date.UTC(y, mo - 1, d) / 86_400_000);
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Span between two ISO dates, for "nos últimos {…}". Null when either is unparseable. */
export function periodLabel(fromIso: string, toIso: string): string | null {
  const from = dayNumber(fromIso);
  const to = dayNumber(toIso);
  if (from == null || to == null) return null;

  const days = Math.max(0, to - from);
  if (days < 60) return plural(Math.max(1, days), "dia", "dias");

  const months = Math.floor(days / 30);
  if (months < 24) return plural(months, "mês", "meses");

  return plural(Math.floor(days / 365), "ano", "anos");
}
