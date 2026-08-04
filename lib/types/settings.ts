export const CHANNELS = ["email", "whatsapp"] as const;

export type NotificationChannel = (typeof CHANNELS)[number];

/** `alerts.curated_type`, pinned by the `alerts_curated_type_known` constraint (migration 0076). */
export const CURATED_SLUGS = [
  "closing",
  "highlights",
  "discount",
  "modality-change",
  "price-drop",
  "group",
  "region",
  "goal",
  "saved",
] as const;

export type CuratedSlug = (typeof CURATED_SLUGS)[number];

export type CuratedStates = Partial<Record<CuratedSlug, boolean>>;

export type UserSettings = {
  fullName: string;
  email: string;
  phone: string;
  channels: NotificationChannel[];
};

export type UserSettingsPatch = {
  fullName?: string;
  phone?: string;
  channels?: NotificationChannel[];
};
