/**
 * Textes officiels publiés avant que le jeu ne les livre.
 *
 * Parfois une clé de texte manque de toutes les TextMap le jour de la sortie,
 * alors que le studio a déjà publié le texte dans son annonce. On le recopie
 * ici mot pour mot avec sa source ; le texte du jeu le remplace dès qu'une
 * extraction le trouve.
 *
 * Sources officielles seulement, et langues publiées seulement : une langue
 * absente retombe sur l'anglais.
 *
 * Vide pour l'instant (la dernière entrée, Blessed Burden `weapons-20306`, est
 * arrivée dans les patchs 1.7.212 à 1.7.217).
 */

type OfficialText = { EN: string } & Partial<Record<string, string>>;

export const OFFICIAL_DESCRIPTIONS: Record<string, { text: OfficialText; sourceUrl: string }> = {};

export function getOfficialDescription(itemId: string, language: string): string | null {
  const entry = OFFICIAL_DESCRIPTIONS[itemId];
  if (!entry) return null;
  return entry.text[language] ?? entry.text.EN;
}
