import { getAllCharacters, getCharacterSlug } from "@/lib/characters/catalog";
import { getCharacterBuilds, type CharacterBuild } from "@/lib/characters/builds";
import type { CharacterRecord } from "@/lib/characters/types";
import releaseVersions from "@/data/characters/release-versions.json";

// ---------------------------------------------------------------------------
// Vitrine des derniers personnages sortis, chacun avec son premier build.
// Calculée côté serveur : les builds se résolvent sur le catalogue complet des
// objets, qui n'a rien à faire dans le JavaScript du navigateur (10 Mo).
// ---------------------------------------------------------------------------

/** Nombre de personnages présentés. */
const SHOWCASE_SIZE = 6;

/**
 * Protagonistes : Vita (`char-protagonist-*`) et Mors (`char-weita*`), chacun
 * en femme et en homme. Ils sortent avec chaque version mais ne sont pas des
 * « nouveaux personnages » : on les écarte de la vitrine.
 */
const PROTAGONISTS = new Set([
  "char-protagonist-female",
  "char-protagonist-male",
  "char-weitaf",
  "char-weitam",
]);

const RELEASES = releaseVersions as Record<string, number>;

export type BuildShowcaseEntry = {
  character: CharacterRecord;
  build: CharacterBuild;
  buildCount: number;
  /** `OpenVersion` du jeu, en dixièmes (16 = 1.6). */
  version: number;
  slug: string;
};

/** Derniers sortis d'abord (version du jeu, puis identifiant le plus récent à version égale). */
export function getBuildShowcase(lang: string): BuildShowcaseEntry[] {
  return getAllCharacters()
    .filter((c) => !PROTAGONISTS.has(c.id) && RELEASES[c.id] !== undefined)
    .sort((a, b) => RELEASES[b.id] - RELEASES[a.id] || b.charId - a.charId)
    .map((character) => {
      const builds = getCharacterBuilds(character.id, lang);
      return builds[0]
        ? {
            character,
            build: builds[0],
            buildCount: builds.length,
            version: RELEASES[character.id],
            slug: getCharacterSlug(character),
          }
        : null;
    })
    .filter((x): x is BuildShowcaseEntry => x !== null)
    .slice(0, SHOWCASE_SIZE);
}
