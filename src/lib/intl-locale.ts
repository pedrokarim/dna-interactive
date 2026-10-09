/**
 * Locale du site → balise BCP 47 comprise par `Intl`.
 *
 * « jp », « kr » et « tc » sont nos segments d'adresse, pas des locales : `Intl`
 * ne les connaît pas et retombe sur la locale de la machine, qui n'est pas la
 * même sur le serveur et dans le navigateur. Tout formatage de nombre ou de
 * date passe donc par ici.
 *
 * Module sans dépendance, importable d'un composant serveur comme d'un
 * composant client.
 */
const INTL_LOCALES: Record<string, string> = { jp: "ja", kr: "ko", tc: "zh-Hant" };

export function toIntlLocale(locale: string): string {
  return INTL_LOCALES[locale] ?? locale;
}
