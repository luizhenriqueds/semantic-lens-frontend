// `occupancy_status` is scraped free text; match loosely and keep the check in one place.
export function isVacant(status: string | null | undefined): boolean {
  return status != null && /desocupad/i.test(status);
}

// Mirrors DWELLING_TYPES in pipeline/constants.py. The vacant rail sells "move in without a
// fight", which only means something for somewhere you can live.
const DWELLING_TYPES = new Set(["casa", "apartamento", "sobrado", "kitnet", "cobertura", "flat"]);

export function isDwelling(type: string | null | undefined): boolean {
  return type != null && DWELLING_TYPES.has(type.trim().toLowerCase());
}
