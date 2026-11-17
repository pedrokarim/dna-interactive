import { allBuilds } from "@/data/characters/builds";
import { getCharacterById } from "@/lib/characters/catalog";
import { resolveBuildCharacterRef } from "@/lib/characters/builds";
import { getCharacterProficiency } from "@/lib/characters/weapon-proficiency";

// Index inverse arme vers personnages.
//
// Tiré des builds curés, rien à la main : ajouter une arme à un build fait
// apparaître le perso sur la fiche de l'arme, la retirer l'enlève. Pas de liste
// parallèle à tenir à jour.
//
// La maîtrise ne dit rien de la qualité d'une arme : elle ne joue que sur les
// Potentiels des armes de calamité. Une arme normale hors maîtrise peut très
// bien convenir (22 builds recommandent une faux, et aucun perso n'a « Scythe »
// en maîtrise). On ne montre donc ce drapeau que sur les fiches d'arme de
// calamité, jamais comme avertissement général.
//
// `Almighty` est une maîtrise joker qui couvre tous les types.

export type WeaponUsageRank = "best" | "alternative";

export interface WeaponUsage {
  characterId: string;
  /** Adresse de la fiche du personnage. */
  href: string;
  /** Nom affiché, déjà résolu dans la langue demandée. */
  name: string;
  /** Avatar du personnage (portrait « head »). */
  portrait: string | null;
  /** Nom du build qui recommande cette arme, dans la langue demandée. */
  buildName: string;
  slot: "melee" | "ranged";
  rank: WeaponUsageRank;
  /**
   * Le type de l'arme est dans les maîtrises du perso. À false, il peut
   * l'équiper mais les Potentiels ne s'appliquent pas.
   */
  hasProficiency: boolean;
  /**
   * Pas de maîtrise d'origine, mais le type est dans les quatre maîtrises
   * supplémentaires du perso : les Potentiels s'appliquent une fois ce type
   * débloqué et actif.
   */
  viaExtraProficiency: boolean;
  /** Ordre d'investissement conseillé dans l'arbre de Potentiel, si curé. */
  potentialOrder: number[] | null;
}

/**
 * Juste ce qu'on lit ici. `allBuilds` est inféré depuis les JSON : `rank` y est
 * un simple `string` et `potentialOrder` n'existe pas tant qu'aucun fichier ne
 * le porte, d'où la redéclaration.
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

/** Type inconnu : on compte la maîtrise comme acquise plutôt que de la nier à tort. */
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
 * « Polearm », « Machinegun »…). L'appelant a déjà l'objet, ça évite de charger
 * tout le catalogue d'armes ici. `null` si le type est inconnu : la maîtrise
 * est alors comptée comme acquise.
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
        // Même résolution que les coéquipiers d'un build, pour que nom, avatar,
        // lien et élément viennent d'une seule source.
        const ref = resolveBuildCharacterRef(build.characterId, lang);
        if (!ref) continue;
        const tags = character.weaponTags ?? [];
        const hasProficiency = hasProficiencyFor(tags, weaponType);
        const extraTags = getCharacterProficiency(character.charId)?.extra.map((type) => type.tag) ?? [];
        usages.push({
          characterId: build.characterId,
          href: ref.href,
          name: ref.name,
          portrait: ref.portrait,
          buildName: localized(build.buildName, lang),
          slot,
          rank: entry.rank === "best" ? "best" : "alternative",
          hasProficiency,
          viaExtraProficiency: !hasProficiency && weaponType !== null && extraTags.includes(weaponType),
          potentialOrder: entry.potentialOrder ?? null,
        });
      }
    }
  }

  // Les « best » d'abord, puis par ordre alphabétique. Un perso peut apparaître
  // deux fois s'il a plusieurs builds.
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
