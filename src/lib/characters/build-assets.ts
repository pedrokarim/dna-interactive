// ---------------------------------------------------------------------------
// Chemins des visuels d'armurerie et de piste, à part de `builds.ts` : ce
// module n'importe aucune donnée du jeu, un composant client peut donc s'en
// servir sans embarquer le catalogue des objets dans le navigateur.
// ---------------------------------------------------------------------------

const ELEMENT_CIRCLE_MAP: Record<string, string> = {
  Thunder: "/assets/ui/armory/T_Armory_Circle_Violet.png",
  Water: "/assets/ui/armory/T_Armory_Circle_Blue.png",
  Wind: "/assets/ui/armory/T_Armory_Circle_Green.png",
  Fire: "/assets/ui/armory/T_Armory_Circle_Yellow.png",
  Light: "/assets/ui/armory/T_Armory_Circle_White.png",
  Dark: "/assets/ui/armory/T_Armory_Circle_White.png",
};

const ELEMENT_LINE_MAP: Record<string, string> = {
  Thunder: "/assets/ui/armory/T_Armory_Line_Violet.png",
  Water: "/assets/ui/armory/T_Armory_Line_Blue.png",
  Wind: "/assets/ui/armory/T_Armory_Line_Green.png",
  Fire: "/assets/ui/armory/T_Armory_Line_Yellow.png",
  Light: "/assets/ui/armory/T_Armory_Line_White.png",
  Dark: "/assets/ui/armory/T_Armory_Line_White.png",
};

const ELEMENT_CORNER_MAP: Record<string, string> = {
  Thunder: "/assets/ui/armory/T_Armory_Corner_Purple.png",
  Water: "/assets/ui/armory/T_Armory_Corner_Blue.png",
  Wind: "/assets/ui/armory/T_Armory_Corner_Green.png",
  Fire: "/assets/ui/armory/T_Armory_Corner_Yellow.png",
  Light: "/assets/ui/armory/T_Armory_Corner_Grey.png",
  Dark: "/assets/ui/armory/T_Armory_Corner_Grey.png",
};

const ELEMENT_ICON_MAP: Record<string, string> = {
  Thunder: "/assets/ui/armory/T_Armory_Thunder.png",
  Water: "/assets/ui/armory/T_Armory_Water.png",
  Wind: "/assets/ui/armory/T_Armory_Wind.png",
  Fire: "/assets/ui/armory/T_Armory_Fire.png",
  Light: "/assets/ui/armory/T_Armory_Light.png",
  Dark: "/assets/ui/armory/T_Armory_Dark.png",
};

export function getArmoryCircle(elementKey: string): string {
  return ELEMENT_CIRCLE_MAP[elementKey] ?? ELEMENT_CIRCLE_MAP.Water;
}

export function getArmoryLine(elementKey: string): string {
  return ELEMENT_LINE_MAP[elementKey] ?? ELEMENT_LINE_MAP.Water;
}

export function getArmoryCorner(elementKey: string): string {
  return ELEMENT_CORNER_MAP[elementKey] ?? ELEMENT_CORNER_MAP.Water;
}

export function getElementIcon(elementKey: string): string {
  return ELEMENT_ICON_MAP[elementKey] ?? ELEMENT_ICON_MAP.Water;
}

export const ARMORY_DEFAULT_ICON = "/assets/ui/armory/T_Armory_Default.png";
export const ARMORY_MOD_GLOW = "/assets/ui/armory/T_Mod_H64_GreenCircle.png";

const TRACK_ICON_MAP: Record<number, string> = {
  1: "/assets/ui/tracks/track-assault.png",
  2: "/assets/ui/tracks/track-healing.png",
  3: "/assets/ui/tracks/track-ability.png",
  4: "/assets/ui/tracks/track-specialisation.png",
};

export function getTrackIcon(polarity: number | null): string | null {
  if (polarity === null || polarity < 1) return null;
  return TRACK_ICON_MAP[polarity] ?? null;
}

/**
 * Marqueur « un Track-Shift Module est posé sur cette case ».
 *
 * Cinquième symbole du même jeu d'icônes que {@link TRACK_ICON_MAP} : même
 * plaque arrondie, même facture, mêmes 220 px. Il ne remplace pas la polarité,
 * il s'y ajoute — la carte porte la polarité de la pièce en haut à droite, et
 * ce marqueur en bas à gauche quand un module est posé.
 *
 * À ne pas confondre avec l'icône d'inventaire de l'objet
 * (`resources-201`) : c'est une illustration isométrique, illisible à 12 px.
 */
export const TRACK_SHIFT_ICON = "/assets/ui/tracks/track-shift.png";
