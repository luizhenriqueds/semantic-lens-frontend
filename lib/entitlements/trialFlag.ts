/** The URL flag that carries "a trial just started" across the refresh that swaps entitlements.
 *  Plain module, not the dialog: the marketing bundle imports the setter through PlanCta. */
export const TRIAL_PARAM = "trial";

const rebuild = (pathname: string, sp: URLSearchParams): string => {
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
};

/** Shared with the checkout flag: both are "a layout dialog read this, now strip it". */
export function withoutParam(pathname: string, search: string, key: string): string {
  const sp = new URLSearchParams(search);
  sp.delete(key);
  return rebuild(pathname, sp);
}

export function withTrialParam(pathname: string, search: string): string {
  const sp = new URLSearchParams(search);
  sp.set(TRIAL_PARAM, "1");
  return rebuild(pathname, sp);
}

export const withoutTrialParam = (pathname: string, search: string): string =>
  withoutParam(pathname, search, TRIAL_PARAM);
