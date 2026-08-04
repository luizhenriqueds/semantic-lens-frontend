import { headers } from "next/headers";
import { getEntitlements } from "@/lib/entitlements/server";
import { getUser } from "@/lib/supabase/server";
import { identify } from "./identify";
import { checkLimit } from "./limiter";
import type { Bucket } from "./policy";

export class RateLimitError extends Error {
  constructor(readonly bucket: Bucket) {
    super(`rate limited: ${bucket}`);
    this.name = "RateLimitError";
  }
}

/** By name, not `instanceof`: the class can be duplicated across server and edge bundles. */
export const isRateLimitError = (err: unknown): err is RateLimitError =>
  err instanceof Error && err.name === "RateLimitError";

/** Admins bypass, and so does any context without a request scope, so a future cron or a
 *  build-time call is never blocked. */
export async function withinQuota(bucket: Bucket): Promise<boolean> {
  let requestHeaders: Headers;
  try {
    requestHeaders = await headers();
  } catch {
    return true;
  }

  const [{ user }, entitlements] = await Promise.all([getUser(), getEntitlements()]);
  if (entitlements.isAdmin) return true;

  const { success } = await checkLimit(
    bucket,
    identify(requestHeaders, user?.id),
    entitlements.role,
  );
  return success;
}

export async function requireQuota(bucket: Bucket): Promise<void> {
  if (!(await withinQuota(bucket))) throw new RateLimitError(bucket);
}
