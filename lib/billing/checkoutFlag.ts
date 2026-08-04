/** The URL flag AbacatePay's hosted checkout sends us back with. Mirrors trialFlag.ts: a plain
 *  module, so the dialog and the server actions can both read it. */
export const CHECKOUT_PARAM = "checkout";

export type CheckoutFlag = "success" | "cancel";

export const readCheckoutFlag = (raw: string | null): CheckoutFlag | null =>
  raw === "success" || raw === "cancel" ? raw : null;

export function withoutCheckoutParam(pathname: string, search: string): string {
  const sp = new URLSearchParams(search);
  sp.delete(CHECKOUT_PARAM);
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
