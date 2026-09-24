import { allBuilds } from "@/data/characters/builds";
import {
  getCharacterById,
  getCharacterSlug,
  resolveCharacterDisplayName,
} from "@/lib/characters/catalog";

// ---------------------------------------------------------------------------
// Index inverse ARME → PERSONNAGES.
//
// Déduit des builds curés, jamais saisi à la main : ajouter une arme dans un
// build suffit à faire apparaître le personnage sur la fiche de cette arme, et
// il en disparaît quand on l'en retire. Aucune liste parallèle à maintenir,
// donc aucune désynchronisation possible.
//
// La **maîtrise** ne dit pas qu'une arme est bonne : elle conditionne le seul
// effet des **Potentiels d'arme de calamité**. Une arme normale hors maîtrise
// reste un excellent choix — 22 builds recommandent une faux alors qu'aucun
// personnage ne porte « Scythe » en maîtrise. Ce drapeau ne doit donc être
// montré que sur les fiches d'arme de calamité, jamais comme un avertissement
// général.
//
// `Almighty` est une maîtrise **joker** : elle couvre tous les types.
// ---------------------------------------------------------------------------

export type WeaponUsageRank = "best" | "alternative";

export interface WeaponUsage {
  characterId: string;
  /** Adresse de la fiche du personnage. */
  slug: string;
  /** Nom affiché, déjà résolu dans la langue demandée. */
  name: string;
  /** Nom du build qui recommande cette arme, dans la langue demandée. */
  buildName: string;
  slot: "melee" | "ranged";
  rank: WeaponUsageRank;
  /**
   * Le type de l'arme figure-t-il dans les maîtrises du personnage ? Faux =
   * il peut l'équiper, mais les Potentiels ne s'appliqueront pas.
   */
  hasProficiency: boolean;
  /** Ordre d'investissement conseillé dans l'arbre de Potentiel, si curé. */
  potentialOrder: number[] | null;
}

/**
 * Forme minimale lue ici. `allBuilds` est typé par inférence depuis les JSON,
 * donc `rank` y est un `string` large et `potentialOrder` n'existe pas tant
 * qu'aucun fichier ne le porte : on redéclare ce qu'on consomme.
 */
interface RawUsageEntry {
  itemId: string;
  rank: string;
  potentialOrder?: number[];
}

interface RawBuild {
  characterId: string;
  buildName?: Record<string, string>;
  weapons?: { melee?: RawUsageEntry[]; ranged?: RawUsageEntry[] };
}

/** Maîtrise joker du jeu : couvre tous les types d'arme. */
const WILDCARD_PROFICIENCY = "Almighty";

/** Type inconnu → on n'affirme pas l'absence de maîtrise. */
function hasProficiencyFor(tags: string[], weaponType: string | null): boolean {
  if (weaponType === null) return true;
  return tags.includes(WILDCARD_PROFICIENCY) || tags.includes(weaponType);
}

function localized(text: Record<string, string> | undefined, lang: string): string {
  if (!text) return "";
  const upper = lang.toUpperCase();
  return text[upper] ?? text.EN ?? Object.values(text)[0] ?? "";
}

/**
 * Personnages dont un build recommande `weaponItemId`.
 *
 * `weaponType` est le type d'arme du jeu (`fields.GUIPathVariableType` :
 * « Polearm », « Machinegun »…). Il vient de l'appelant, qui tient déjà
 * l'objet : ça évite de charger tout le catalogue d'armes ici. Passer `null`
 * si le type est inconnu — la maîtrise est alors rendue indéterminée plutôt
 * que faussement négative.
 */
export function getWeaponUsage(
  weaponItemId: string,
  weaponType: string | null,
  lang: string = "EN",
): WeaponUsage[] {
  const usages: WeaponUsage[] = [];

  for (const build of allBuilds as unknown as RawBuild[]) {
    for (const slot of ["melee", "ranged"] as const) {
      const entries = build.weapons?.[slot] ?? [];
      for (const entry of entries) {
        if (entry.itemId !== weaponItemId) continue;
        const character = getCharacterById(build.characterId);
        if (!character) continue;
        const tags = character.weaponTags ?? [];
        usages.push({
          characterId: build.characterId,
          slug: getCharacterSlug(character),
          name: resolveCharacterDisplayName(character, lang),
          buildName: localized(build.buildName, lang),
          slot,
          rank: entry.rank === "best" ? "best" : "alternative",
          hasProficiency: hasProficiencyFor(tags, weaponType),
          potentialOrder: entry.potentialOrder ?? null,
        });
      }
    }
  }

  // Les recommandations d'abord, puis l'ordre alphabétique — un même
  // personnage peut apparaître deux fois s'il a plusieurs builds.
  return usages.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank === "best" ? -1 : 1;
    return a.name.localeCompare(b.name) || a.buildName.localeCompare(b.buildName);
  });
}

/** Y a-t-il au moins un personnage qui recommande cette arme ? */
export function hasWeaponUsage(weaponItemId: string): boolean {
  return (allBuilds as unknown as RawBuild[]).some((build) =>
    (["melee", "ranged"] as const).some((slot) =>
      (build.weapons?.[slot] ?? []).some((entry) => entry.itemId === weaponItemId),
    ),
  );
}
