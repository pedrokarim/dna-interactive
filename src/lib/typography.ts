/**
 * Tiret d'incise selon la langue du texte.
 *
 * Le tiret cadratin (—) est une convention anglaise (reprise en espagnol et en
 * CJK). En français et en allemand, l'incise prend le demi-cadratin entouré
 * d'espaces (–). À utiliser dans les gabarits partagés par toutes les langues
 * (« Chapitre – Guide », « Événement – dates »).
 */
export function inciseDash(locale: string): string {
  return locale === "fr" || locale === "de" ? " – " : " — ";
}
