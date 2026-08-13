// Fill a url in and the footer row and the Organization sameAs both start rendering. Until then
// nothing ships - an empty social link is worse than none.
export const SOCIAL = [
  { key: "instagram", label: "Instagram", url: "" },
  { key: "youtube", label: "YouTube", url: "" },
  { key: "linkedin", label: "LinkedIn", url: "" },
  { key: "x", label: "X", url: "" },
] as const;

export const SOCIAL_LINKS = SOCIAL.filter((s) => s.url);

export const CONTACT_EMAIL = "";
