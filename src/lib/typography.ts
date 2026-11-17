/**
 * Tiret d'incise selon la langue du texte.
 *
 * L'anglais met un tiret cadratin (repris en espagnol et en CJK), le français et
 * l'allemand un demi-cadratin entouré d'espaces. Pour les gabarits communs à
 * toutes les langues (« Chapitre – Guide », « Événement – dates »).
 */
export function parentheticalDash(locale: string): string {
  return locale === "fr" || locale === "de" ? " – " : " — ";
}
