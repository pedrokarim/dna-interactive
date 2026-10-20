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
 * nom d'une arme de départ en métal (« Metallschwert », « Espada Metálica ») et
 * DE/ES ne reçoivent pas leur vrai nom, même quand l'anglais l'avait déjà dans
 * le même pak. Un nom « métal » en DE/ES face à un nom anglais qui ne l'est pas
 * trahit ce cas ; la description qui l'accompagne est celle de l'arme en métal.
 */
const WORKING_LABEL_PATTERN = /metall|met[aá]lic/i;

export function isWorkingLabel(name: string | null | undefined, englishName: string | null | undefined): boolean {
  return name != null && englishName != null && WORKING_LABEL_PATTERN.test(name) && !/metal/i.test(englishName);
}
