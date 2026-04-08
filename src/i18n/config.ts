export const locales = ['fr', 'en', 'de', 'es', 'jp', 'kr', 'tc'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export const LANGUAGE_LABELS: Record<string, string> = {
  DE: "Deutsch",
  EN: "English",
  ES: "Español",
  FR: "Français",
  JP: "日本語",
  KR: "한국어",
  TC: "繁體中文",
};

/** Convert i18n locale code to game data language code (uppercase) */
export function toGameDataLangCode(locale: Locale): string {
  return locale.toUpperCase();
}

/** Convert game data language code to i18n locale */
export function toLocale(langCode: string): Locale {
  const lower = langCode.toLowerCase() as Locale;
  return locales.includes(lower) ? lower : defaultLocale;
}
