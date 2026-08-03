"use server";

import { getPropertyImage } from "@/lib/data";

/** Lazy photo for a map popup: the map payload itself stays slim. */
export async function fetchPropertyImage(propertyId: string): Promise<string | null> {
  return getPropertyImage(propertyId);
}
