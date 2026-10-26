import type { CharacterRecord } from "@/lib/characters/types";

// Noms d'affichage des personnages, à part de `catalog.ts` : ce module
// n'importe aucune donnée du jeu, un composant client peut donc s'en servir
// sans embarquer le catalogue dans le navigateur.

// Certains personnages (notamment les formes alternatives du Phoxhunter)
// utilisent un nom-template "{nickname}" dans les data du jeu, parce que le
// jeu y substitue le pseudo du joueur à l'exécution. Hors-jeu, on veut un
// nom marketing stable à afficher dans la liste, la build card, les modales,
// etc. Ce mapping fournit ce fallback par charId.
const DISPLAY_NAME_OVERRIDES: Record<number, Record<string, string> & { default: string }> = {
  1201: { default: "Phoxhunter (Umbro) ♀" },
  120101: { default: "Phoxhunter (Umbro) ♂" },
};

function isNicknameTemplate(name: string | null | undefined): boolean {
  if (!name) return true;
  return /^\{[^}]+\}$/.test(name.trim());
}

/**
 * Retourne un nom d'affichage propre pour un personnage, en remplaçant les
 * templates `{nickname}` du jeu par un nom marketing (ou `internalName` /
 * `id` en dernier recours). Doit être utilisé dans l'UI partout où on
 * affiche `translations?.X?.name` brut.
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
 * Variante qui prend juste le nom brut + un fallback. Utile dans les
 * composants qui n'ont pas accès à l'objet `character` complet (ex. la
 * build card qui itère sur `team[i].characterId`).
 */
export function resolveDisplayName(
  rawName: string | null | undefined,
  fallback: string,
): string {
  if (isNicknameTemplate(rawName)) return fallback;
  return rawName as string;
}
