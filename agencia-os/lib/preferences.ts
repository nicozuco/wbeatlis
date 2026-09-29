import { navigationHrefs, parseNavPreferences, type NavPreferences } from "./navigation";

// Ajustes de cada usuario (tabla UserPreference). La apariencia se aplica con
// atributos data-* en <html> (estilos en app/globals.css) y se copia en una
// cookie para que el primer render ya salga con el tema correcto, también en /login.

export const themes = ["dark", "light", "system"] as const;
export type ThemePreference = (typeof themes)[number];
export const themeLabels: Record<ThemePreference, string> = { dark: "Oscuro", light: "Claro", system: "Según el sistema" };

export const accents = ["teal", "blue", "violet", "green", "amber", "rose"] as const;
export type AccentPreference = (typeof accents)[number];
export const accentLabels: Record<AccentPreference, string> = { teal: "Turquesa", blue: "Azul", violet: "Violeta", green: "Verde", amber: "Ámbar", rose: "Rosa" };

export const textSizes = ["small", "normal", "large"] as const;
export type TextSizePreference = (typeof textSizes)[number];
export const textSizeLabels: Record<TextSizePreference, string> = { small: "Pequeño", normal: "Normal", large: "Grande" };

export type Appearance = { theme: ThemePreference; accent: AccentPreference; textSize: TextSizePreference; reduceMotion: boolean };
export const defaultAppearance: Appearance = { theme: "dark", accent: "teal", textSize: "normal", reduceMotion: false };

export const DEFAULT_START_PAGE = "/hoy";

export type UserSettings = {
  displayName: string | null;
  startPage: string;
  appearance: Appearance;
  navigation: NavPreferences;
};

const pick = <T extends string>(options: readonly T[], value: unknown, fallback: T): T => ((options as readonly unknown[]).includes(value) ? (value as T) : fallback);

export function parseAppearance(value: { theme?: unknown; accent?: unknown; textSize?: unknown; reduceMotion?: unknown } | null | undefined): Appearance {
  return {
    theme: pick(themes, value?.theme, defaultAppearance.theme),
    accent: pick(accents, value?.accent, defaultAppearance.accent),
    textSize: pick(textSizes, value?.textSize, defaultAppearance.textSize),
    reduceMotion: value?.reduceMotion === true,
  };
}

type PreferenceRow = {
  displayName?: string | null;
  startPage?: string | null;
  theme?: string;
  accent?: string;
  textSize?: string;
  reduceMotion?: boolean;
  navOrder: unknown;
  hiddenNav: unknown;
};

export function parseUserSettings(row: PreferenceRow | null): UserSettings {
  const startPage = row?.startPage && navigationHrefs.includes(row.startPage) ? row.startPage : DEFAULT_START_PAGE;
  return { displayName: row?.displayName?.trim() || null, startPage, appearance: parseAppearance(row), navigation: parseNavPreferences(row) };
}

export const APPEARANCE_COOKIE = "atlis-appearance";
export const APPEARANCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const serializeAppearance = (appearance: Appearance) => [appearance.theme, appearance.accent, appearance.textSize, appearance.reduceMotion ? "1" : "0"].join(".");

export function parseAppearanceCookie(value: string | undefined): Appearance {
  const [theme, accent, textSize, reduceMotion] = (value ?? "").split(".");
  return parseAppearance({ theme, accent, textSize, reduceMotion: reduceMotion === "1" });
}

export function appearanceAttributes(appearance: Appearance) {
  return {
    "data-theme": appearance.theme,
    "data-accent": appearance.accent,
    "data-text-size": appearance.textSize,
    "data-reduce-motion": appearance.reduceMotion ? "true" : "false",
  };
}

// Solo en el navegador: aplica la apariencia al momento y la recuerda en este dispositivo.
export function applyAppearance(appearance: Appearance) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(appearanceAttributes(appearance))) root.setAttribute(name, value);
  root.classList.toggle("dark", appearance.theme !== "light");
  document.cookie = `${APPEARANCE_COOKIE}=${serializeAppearance(appearance)}; path=/; max-age=${APPEARANCE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function initialsOf(name: string | null, email: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2);
  return letters.toLocaleUpperCase("es") || "?";
}
