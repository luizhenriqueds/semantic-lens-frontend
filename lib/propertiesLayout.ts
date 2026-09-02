export const PROPERTIES_LAYOUTS = ["cards", "rows"] as const;

export type PropertiesLayout = (typeof PROPERTIES_LAYOUTS)[number];

export const DEFAULT_PROPERTIES_LAYOUT: PropertiesLayout = "cards";

const KEY = "semantic-lens-properties-layout";

export function readPropertiesLayout(): PropertiesLayout {
  try {
    return localStorage.getItem(KEY) === "rows" ? "rows" : DEFAULT_PROPERTIES_LAYOUT;
  } catch (err) {
    console.warn("Failed to read properties layout from localStorage", err);
    return DEFAULT_PROPERTIES_LAYOUT;
  }
}

export function writePropertiesLayout(layout: PropertiesLayout): void {
  try {
    localStorage.setItem(KEY, layout);
  } catch (err) {
    console.warn("Failed to persist properties layout to localStorage", err);
  }
}
