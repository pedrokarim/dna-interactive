/**
 * Markdown Discord pour les aperçus de lien.
 *
 * Tout texte qui vient d'un joueur ou de la base passe par `escapeMarkdown`
 * avant d'entrer dans un Text Display : un pseudo comme
 * « [gratuit](https://piege.example) » ne doit pas devenir un lien masqué, ni
 * « # Officiel » un titre.
 */

/** Caractères qui ouvrent une mise en forme Discord. */
const MARKDOWN_CHARS = /[\\*_~`|>#[\]()<]/g;

/** Retours à la ligne, y compris les séparateurs Unicode U+2028 et U+2029. */
const LINE_BREAKS = /\r\n|[\r\n\u2028\u2029]/g;

/**
 * Échappe un texte libre : chaque caractère de mise en forme est précédé d'une
 * barre oblique inverse, et les retours à la ligne deviennent des espaces, pour
 * qu'aucune ligne ne commence par « # », « > » ou « -# ».
 */
export function escapeMarkdown(value: string): string {
  return (
    value
      .replace(LINE_BREAKS, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(MARKDOWN_CHARS, (char) => `\\${char}`)
      // En tête de ligne, « - » ouvre une liste et « -# » une note.
      .replace(/^([-+])/, "\\$1")
  );
}

/**
 * Adresse prête pour un lien masqué `[texte](url)` : les parenthèses sont
 * encodées, sinon la première `)` fermerait le lien.
 */
export function markdownLinkUrl(url: string): string {
  return url.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/ /g, "%20");
}

/** `[texte](url)` avec un texte échappé. */
export function maskedLink(label: string, url: string): string {
  return `[${escapeMarkdown(label)}](${markdownLinkUrl(url)})`;
}

/** « **Libellé** valeur » : une ligne de chiffre clé, les deux parties échappées. */
export function field(label: string, value: string | number): string {
  return `**${escapeMarkdown(label)}** ${escapeMarkdown(String(value))}`;
}
