import { withoutParam } from "@/lib/entitlements/trialFlag";

/** The URL flag AbacatePay's hosted checkout sends us back with. A plain module, so the dialog
 *  and the server actions can both read it. */
export const CHECKOUT_PARAM = "checkout";

/** The settings tab the round trip lands on, so the action and the tab list cannot drift. */
export const PLAN_TAB = "plano";

export type CheckoutFlag = "success" | "cancel";

export const readCheckoutFlag = (raw: string | null): CheckoutFlag | null =>
  raw === "success" || raw === "cancel" ? raw : null;

export const withoutCheckoutParam = (pathname: string, search: string): string =>
  withoutParam(pathname, search, CHECKOUT_PARAM);
