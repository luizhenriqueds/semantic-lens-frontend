// `occupancy_status` is scraped free text; match loosely and keep the check in one place.
export function isVacant(status: string | null | undefined): boolean {
  return status != null && /desocupad/i.test(status);
}
