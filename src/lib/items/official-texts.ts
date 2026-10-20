/**
 * Textes officiels publiés avant que le jeu ne les livre.
 *
 * Il arrive qu'une clé de texte manque de toutes les TextMap le jour de la
 * sortie (`UI_WEAPON_DESC_20306` en 1.7) alors que le studio a déjà publié le
 * texte dans son annonce. Le catalogue le reprend ici, mot pour mot, avec sa
 * source ; il cède la place au texte du jeu dès qu'une extraction le résout.
 *
 * Seulement des sources officielles, et seulement les langues publiées : une
 * langue absente retombe sur l'anglais.
 */

type OfficialText = { EN: string } & Partial<Record<string, string>>;

export const OFFICIAL_DESCRIPTIONS: Record<string, { text: OfficialText; sourceUrl: string }> = {
  // « Ironcast Project | Blessed Burden », compte officiel, 14 octobre 2026.
  "weapons-20306": {
    text: { EN: "To live on is a blessing the living must bear." },
    sourceUrl: "https://x.com/DNAbyss_EN/status/2110203946069291086",
  },
};

export function getOfficialDescription(itemId: string, language: string): string | null {
  const entry = OFFICIAL_DESCRIPTIONS[itemId];
  if (!entry) return null;
  return entry.text[language] ?? entry.text.EN;
}
