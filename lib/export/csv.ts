// A CSV that Excel pt-BR opens by double-click: `;` delimiter, comma decimals, CRLF and a BOM.

const CSV_DELIMITER = ";";
const CSV_EOL = "\r\n";
export const CSV_BOM = "\uFEFF";

export type CsvColumn<T> = { header: string; value: (row: T) => string };

const NEEDS_QUOTE = /[;"\n\r]|^\s|\s$/;
// Excel and Sheets evaluate a cell that opens with any of these.
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/** Missing stays blank, not `EMPTY` - a spreadsheet needs blanks for MÉDIA() to skip them. */
export function csvCell(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "";
  // Numbers never pass through here, so a legitimate -15 is not mangled.
  const escaped = FORMULA_LEAD.test(raw) ? `'${raw}` : raw;
  if (!NEEDS_QUOTE.test(escaped) && escaped === raw) return escaped;
  return `"${escaped.replace(/"/g, '""')}"`;
}

/** Comma decimal, no groupers: toLocaleString("pt-BR") adds `.` that Excel reads back as text. */
export function csvNumber(n: number | null | undefined, decimals = 2): string {
  if (n == null || !Number.isFinite(n)) return "";
  return n.toFixed(decimals).replace(".", ",");
}

export function csvInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return String(Math.round(n));
}

/** `2026-07-30T00:00:00+00:00` -> `30/07/2026`. Sliced, not parsed, so the day cannot shift. */
export function csvDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

export function csvBool(v: boolean | null | undefined): string {
  if (v == null) return "";
  return v ? "Sim" : "Não";
}

/** The BOM is part of the string - the Blob must not add a second. Row 1 is the header, so
 *  there are no preamble rows; provenance rides in the filename. */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const head = columns.map((c) => csvCell(c.header)).join(CSV_DELIMITER);
  const body = rows.map((row) => columns.map((c) => c.value(row)).join(CSV_DELIMITER));
  return CSV_BOM + [head, ...body].join(CSV_EOL) + CSV_EOL;
}
