/**
 * Textes officiels publiés avant que le jeu ne les livre.
 *
 * Il arrive qu'une clé de texte manque de toutes les TextMap le jour de la
 * sortie alors que le studio a déjà publié le texte dans son annonce. Le
 * catalogue le reprend ici, mot pour mot, avec sa source ; il cède la place au
 * texte du jeu dès qu'une extraction le résout.
 *
 * Seulement des sources officielles, et seulement les langues publiées : une
 * langue absente retombe sur l'anglais.
 *
 * Vide pour l'instant : la description de Blessed Burden (`weapons-20306`),
 * reprise ici le jour de la 1.7 depuis le compte officiel, est arrivée avec les
 * patchs 1.7.212 à 1.7.217, mot pour mot.
 */

type OfficialText = { EN: string } & Partial<Record<string, string>>;

export const OFFICIAL_DESCRIPTIONS: Record<string, { text: OfficialText; sourceUrl: string }> = {};

export function getOfficialDescription(itemId: string, language: string): string | null {
  const entry = OFFICIAL_DESCRIPTIONS[itemId];
  if (!entry) return null;
  return entry.text[language] ?? entry.text.EN;
}
