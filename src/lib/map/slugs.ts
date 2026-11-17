/**
 * Slugs d'URL des régions de la carte.
 *
 * Sans dépendance exprès : importé par la page client `/map` et par
 * `regions.ts` côté serveur. Importer `mapLoaders` ici mettrait le chargeur de
 * cartes dans le bundle client.
 *
 * Les ids du jeu (`youlai_alley`, `arcanorift`, `mountarcano`) ne font pas de
 * bonnes URL. Table écrite à la main : un slug est public, il ne doit pas
 * bouger si un id du jeu change.
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
