/**
 * Slugs d'URL des régions de la carte.
 *
 * Module volontairement sans dépendance : il est importé aussi bien par la
 * page client `/map` que par les helpers serveur de `regions.ts`. Y faire
 * entrer `mapLoaders` embarquerait le chargeur de cartes dans le bundle
 * client pour rien.
 *
 * Les identifiants du jeu sont irréguliers (`youlai_alley`, `arcanorift`,
 * `mountarcano`) et ne sont pas présentables dans une URL. La table est écrite
 * à la main plutôt que dérivée : un slug est un contrat public, il ne doit pas
 * bouger le jour où un identifiant du jeu change.
 */

export const REGION_SLUGS: Record<string, string> = {
  arcanorift: "arcano-rift",
  arcanoruins: "arcano-ruins",
  "bloomfield-station": "bloomfield-station",
  "galea-theater": "galea-theater",
  "glevum-pit": "glevum-pit",
  haojing: "haojing",
  huaxu: "huaxu",
  "icelake-sewer": "icelake-sewer",
  icelake: "icelake",
  ironworks: "ironworks",
  "lonza-fortress": "lonza-fortress",
  mountarcano: "mount-arcano",
  "outer-peaks": "outer-peaks",
  "purgatorio-island": "purgatorio-island",
  "taixu-mausoleum": "taixu-mausoleum",
  youlai_alley: "youlai-alley",
};

export const REGION_ID_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(REGION_SLUGS).map(([id, slug]) => [slug, id]),
);

/** Slug public d'une région, ou son identifiant si aucun slug n'est déclaré. */
export function getRegionSlug(id: string): string {
  return REGION_SLUGS[id] ?? id;
}
