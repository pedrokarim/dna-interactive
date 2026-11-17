/**
 * Locale du site vers une balise BCP 47 que comprend `Intl`.
 *
 * « jp », « kr » et « tc » sont nos segments d'URL, pas des locales : `Intl` ne
 * les connaît pas et retombe sur la locale de la machine, qui diffère entre
 * serveur et navigateur. Tout formatage de nombre ou de date passe par ici.
 *
 * Sans dépendance, importable côté serveur comme côté client.
 */
const INTL_LOCALES: Record<string, string> = { jp: "ja", kr: "ko", tc: "zh-Hant" };

export function toIntlLocale(locale: string): string {
  return INTL_LOCALES[locale] ?? locale;
}
