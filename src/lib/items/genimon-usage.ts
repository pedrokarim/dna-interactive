import { allBuilds } from "@/data/characters/builds";
import { resolveBuildCharacterRef } from "@/lib/characters/builds";
import { genimonTraitSlots, resolveBuildTrait, sanitizeTraitKeys, type BuildGenimonTrait } from "@/lib/genimons/build-traits";
import { getItemByCategoryAndId } from "@/lib/items/catalog";

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

/** Un Trait, et la place qu'il tient dans les builds qui emmènent la créature. */
export interface GenimonTraitTally {
  trait: BuildGenimonTrait;
  /** Nombre de builds qui le visent sur cette créature. */
  builds: number;
  /** Parmi eux, ceux qui le placent en première priorité. */
  first: number;
}

export interface GenimonTraitBuild {
  /** Builds pris en compte : ceux qui emmènent la créature et y curent des Traits. */
  totalBuilds: number;
  /** Combien de Traits cette variante peut porter (3, ou 4 pour une scintillante). */
  slots: number;
  /** Les Traits à viser : autant que d'emplacements, les plus demandés d'abord. */
  recommended: GenimonTraitTally[];
  /** Les autres Traits rencontrés, dans le même ordre. */
  others: GenimonTraitTally[];
}

/**
 * Le « build » d'un Géniemon : les Traits que les builds du site y visent le
 * plus souvent.
 *
 * Le décompte porte sur l'espèce entière. Les builds désignent presque toujours
 * la variante ordinaire : sans cela, la fiche d'une scintillante resterait vide
 * alors qu'elle se monte de la même façon, avec un emplacement de plus.
 */
export function getGenimonTraitBuild(genimonItemId: string, lang: string = "EN", locale: string = "en"): GenimonTraitBuild | null {
  const item = getItemByCategoryAndId("genimons", genimonItemId);
  if (!item) return null;
  const species = new Set(item.variants?.siblingIds?.length ? item.variants.siblingIds : [genimonItemId]);
  const slots = genimonTraitSlots(genimonItemId);

  let totalBuilds = 0;
  const tally = new Map<string, { builds: number; first: number; rankSum: number }>();
  for (const build of allBuilds as unknown as RawBuild[]) {
    // Un build peut citer deux variantes de la même espèce : il ne compte qu'une fois.
    const entry = (build.genimon ?? []).find((candidate) => species.has(candidate.itemId) && (candidate.traits?.length ?? 0) > 0);
    if (!entry) continue;
    totalBuilds++;
    sanitizeTraitKeys(entry.itemId, entry.traits).forEach((key, index) => {
      const row = tally.get(key) ?? { builds: 0, first: 0, rankSum: 0 };
      row.builds++;
      row.rankSum += index;
      if (index === 0) row.first++;
      tally.set(key, row);
    });
  }
  if (totalBuilds === 0) return null;

  const ranked = [...tally.entries()]
    // Le plus demandé d'abord ; à égalité, celui que les builds placent le plus haut.
    .sort(([, a], [, b]) => b.builds - a.builds || a.rankSum / a.builds - b.rankSum / b.builds)
    .map(([key, row]) => {
      const trait = resolveBuildTrait(key, lang, locale);
      return trait ? { trait, builds: row.builds, first: row.first } : null;
    })
    .filter((row): row is GenimonTraitTally => row !== null);

  return { totalBuilds, slots, recommended: ranked.slice(0, slots), others: ranked.slice(slots) };
}
