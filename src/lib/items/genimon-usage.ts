import { allBuilds } from "@/data/characters/builds";
import { resolveBuildCharacterRef } from "@/lib/characters/builds";
import { resolveBuildTrait, sanitizeTraitKeys, type BuildGenimonTrait } from "@/lib/genimons/build-traits";

// ---------------------------------------------------------------------------
// Index inverse GÉNIEMON → PERSONNAGES.
//
// Pendant exact de `weapon-usage.ts` : déduit des builds curés, jamais saisi à
// la main. Ajouter une créature dans un build la fait apparaître sur sa fiche,
// l'en retirer l'en fait disparaître. Aucune liste parallèle à maintenir.
//
// Une différence avec les armes : on remonte aussi les **Traits** que le build
// vise sur cette créature. C'est souvent l'information qu'on cherche en
// arrivant ici – savoir qui l'emploie sert surtout à savoir quoi y greffer.
// ---------------------------------------------------------------------------

export interface GenimonUsage {
  characterId: string;
  /** Adresse de la fiche du personnage. */
  href: string;
  /** Nom affiché, déjà résolu dans la langue demandée. */
  name: string;
  /** Avatar du personnage, pour que la liste se lise d'un coup d'œil. */
  portrait: string | null;
  /** Nom du build qui recommande cette créature, dans la langue demandée. */
  buildName: string;
  rank: "best" | "alternative";
  /** Traits visés par ce build sur cette créature. Vide si le build n'en cure aucun. */
  traits: BuildGenimonTrait[];
}

/**
 * Forme minimale lue ici. `allBuilds` est typé par inférence depuis les JSON :
 * `rank` y est un `string` large, et `traits` n'existe pas tant qu'aucun
 * fichier ne le porte.
 */
interface RawGenimonUsageEntry {
  itemId: string;
  rank: string;
  traits?: string[];
}

interface RawBuild {
  characterId: string;
  buildName?: Record<string, string>;
  genimon?: RawGenimonUsageEntry[];
}

function localized(text: Record<string, string> | undefined, lang: string): string {
  if (!text) return "";
  const upper = lang.toUpperCase();
  return text[upper] ?? text.EN ?? Object.values(text)[0] ?? "";
}

/** Personnages dont un build curé recommande `genimonItemId`. */
export function getGenimonUsage(genimonItemId: string, lang: string = "EN"): GenimonUsage[] {
  const usages: GenimonUsage[] = [];

  for (const build of allBuilds as unknown as RawBuild[]) {
    for (const entry of build.genimon ?? []) {
      if (entry.itemId !== genimonItemId) continue;
      // Même résolution que les coéquipiers d'un build : nom, avatar et lien
      // viennent d'une seule source.
      const ref = resolveBuildCharacterRef(build.characterId, lang);
      if (!ref) continue;
      usages.push({
        characterId: build.characterId,
        href: ref.href,
        name: ref.name,
        portrait: ref.portrait,
        buildName: localized(build.buildName, lang),
        rank: entry.rank === "best" ? "best" : "alternative",
        traits: sanitizeTraitKeys(entry.itemId, entry.traits)
          .map((key) => resolveBuildTrait(key, lang))
          .filter((t): t is BuildGenimonTrait => t !== null),
      });
    }
  }

  // Les recommandations d'abord, puis l'ordre alphabétique — un même
  // personnage peut apparaître deux fois s'il a plusieurs builds.
  return usages.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank === "best" ? -1 : 1;
    return a.name.localeCompare(b.name) || a.buildName.localeCompare(b.buildName);
  });
}
