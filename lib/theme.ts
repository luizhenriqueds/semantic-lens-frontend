export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

const KEY = "matricula-theme";

export function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch (err) {
    console.warn("Failed to read theme from localStorage", err);
    return "light";
  }
}

export const showTheme = (theme: Theme): void =>
  document.documentElement.setAttribute("data-theme", theme);

export function applyTheme(theme: Theme): void {
  showTheme(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch (err) {
    console.warn("Failed to persist theme to localStorage", err);
  }
}
