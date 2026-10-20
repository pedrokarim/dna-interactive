import staleDeEsKeysJson from "@/data/items/stale-de-es-keys.json";

/**
 * Le jeu ne livre plus l'allemand ni l'espagnol depuis la 1.6 : leurs TextMap
 * sont figées. Ce module repère les textes DE/ES devenus faux, que le site
 * remplace par l'anglais actuel.
 */
export const FROZEN_LANGUAGES = ["DE", "ES"];

/**
 * Clés dont l'anglais a changé depuis les derniers DE/ES livrés (1.5.192) : leur
 * traduction décrit l'ancien texte. Liste produite par
 * `research_data/gen-stale-translations.mjs`.
 */
const STALE_DE_ES_KEYS = new Set<string>(staleDeEsKeysJson.keys);

export function isStaleKey(key: string | null): boolean {
  return key != null && STALE_DE_ES_KEYS.has(key);
}

/**
 * Libellé de travail jamais retraduit : les armes de calamité naissent sous le
 * nom d'une arme de départ en métal (« Metallschwert », « Espada Metálica »,
 * « メタルブレード ») et certaines langues ne reçoivent pas leur vrai nom, même
 * quand l'anglais l'a déjà. Le japonais, pourtant toujours livré, en garde un en
 * 1.7. Un nom « métal » face à un nom anglais qui ne l'est pas trahit ce cas ; la
 * description qui l'accompagne est celle de l'arme en métal.
 */
const WORKING_LABEL_PATTERN = /metall|m[ée]tal|met[aá]lic|メタル|金属|金屬|금속|메탈/i;

export function isWorkingLabel(name: string | null | undefined, englishName: string | null | undefined): boolean {
  return name != null && englishName != null && WORKING_LABEL_PATTERN.test(name) && !/metal/i.test(englishName);
}
