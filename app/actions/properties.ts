"use server";

import { getPropertyImage } from "@/lib/data";
import { withinQuota } from "@/lib/ratelimit/guards";

/** Lazy photo for a map popup: the map payload itself stays slim. */
export async function fetchPropertyImage(propertyId: string): Promise<string | null> {
  // Unauthenticated by design, so the id space is walkable - the quota is what caps enumeration.
  if (!(await withinQuota("image"))) return null;
  return getPropertyImage(propertyId);
}
