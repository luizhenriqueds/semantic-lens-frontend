/** Lowercase ASCII slug, safe in a filename on every OS. */
export function slugify(s: string, maxLength = 60): string {
  const base = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length <= maxLength) return base;
  const cut = base.slice(0, maxLength);
  const boundary = cut.lastIndexOf("-");
  return (boundary > 0 ? cut.slice(0, boundary) : cut).replace(/-+$/, "");
}

/** `lavra-imoveis-casa-em-sao-paulo-2026-07-30.csv`. UTC getters: local ones flip the day on a
 *  UTC-3 machine late in the evening. */
export function exportFilename(
  base: string,
  { label, date, ext }: { label?: string | null; date: Date; ext: "csv" | "pdf" },
): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const slug = label ? slugify(label) : "";
  return ["lavra", base, slug, `${y}-${m}-${d}`].filter(Boolean).join("-") + `.${ext}`;
}
