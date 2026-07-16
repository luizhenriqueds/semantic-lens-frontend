// Years since a plausible construction year, or null when the value is missing
// or clearly out of range.
export function propertyAge(
  yearBuilt: number | null,
  now = new Date().getFullYear(),
): number | null {
  if (yearBuilt == null || yearBuilt < 1800 || yearBuilt > now) return null;
  return now - yearBuilt;
}
