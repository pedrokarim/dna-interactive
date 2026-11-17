import type { CharacterRecord } from "@/lib/characters/types";

// Noms d'affichage des personnages, à part de `catalog.ts` : ce module
// n'importe aucune donnée du jeu, un composant client peut donc s'en servir
// sans embarquer le catalogue dans le navigateur.

// Certains persos (les formes alternatives du Phoxhunter) ont pour nom le
// template "{nickname}" : le jeu y met le pseudo du joueur. Hors du jeu il faut
// un nom fixe pour la liste, la build card, les modales… d'où ce fallback par
// charId.
const DISPLAY_NAME_OVERRIDES: Record<number, Record<string, string> & { default: string }> = {
  1201: { default: "Phoxhunter (Umbro) ♀" },
  120101: { default: "Phoxhunter (Umbro) ♂" },
};

function isNicknameTemplate(name: string | null | undefined): boolean {
  if (!name) return true;
  return /^\{[^}]+\}$/.test(name.trim());
}

/**
 * Nom d'affichage d'un perso : les templates `{nickname}` sont remplacés par un
 * nom fixe, sinon `internalName`, sinon `id`. À utiliser partout où l'UI
 * afficherait `translations?.X?.name` brut.
 */
export function resolveCharacterDisplayName(
  character: CharacterRecord,
  locale: string = "EN",
): string {
  const upperLocale = locale.toUpperCase();
  const raw = character.translations?.[upperLocale]?.name ?? null;
  if (!isNicknameTemplate(raw)) {
    return raw as string;
  }
  const override = DISPLAY_NAME_OVERRIDES[character.charId];
  if (override) {
    return override[upperLocale] ?? override.default;
  }
  return character.internalName ?? character.id;
}

/**
 * Même chose à partir du nom brut et d'un fallback, pour les composants qui
 * n'ont pas l'objet `character` (ex. la build card qui parcourt
 * `team[i].characterId`).
 */
export function resolveDisplayName(
  rawName: string | null | undefined,
  fallback: string,
): string {
  if (isNicknameTemplate(rawName)) return fallback;
  return rawName as string;
}
