import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Emplacements d'illustrations du guide des armes de calamité.
 *
 * Le principe : la page réserve la place, l'image arrive plus tard. Tant que le
 * fichier n'existe pas, un cadre nommé indique exactement quoi déposer et où ;
 * dès qu'il est là, il remplace le cadre sans toucher au code.
 *
 * Déposer le fichier dans `public/assets/guides/calamity/<id>.<ext>` — les
 * extensions acceptées sont testées dans l'ordre ci-dessous.
 */
export const GUIDE_IMAGE_DIR = "/assets/guides/calamity";
const EXTENSIONS = ["webp", "png", "jpg", "jpeg"] as const;

/** Identifiants des emplacements réservés dans le guide. */
export const CALAMITY_GUIDE_SLOTS = [
  /** Ecran de Fusion de calamite, vue d'ensemble. */
  "overview",
  /** Arbre + panneau de detail d'un Potentiel. */
  "potential",
  /** Materiaux requis d'un noeud, et la regle du premier choix gratuit. */
  "potentialCost",
  /** Le Fourneau de calamite et ses missions. */
  "furnace",
  /** Les deux Missions abyssales. */
  "missions",
  /** Exploration : recompense ciblee, attribut ennemi, Compas abyssal. */
  "expedition",
  /** Defense : paliers de difficulte et recompenses. */
  "defense",
  /** Infobulle d'un insigne : sa methode d'obtention. */
  "emblemTooltip",
  /** Quete de deblocage ou ecran de forge - pas encore capture. */
  "unlock",
] as const;

export type CalamityGuideSlot = (typeof CALAMITY_GUIDE_SLOTS)[number];

/**
 * Emplacements du guide des **Demon Wedges**.
 *
 * Même principe et même dossier-frère : `public/assets/guides/mods/<id>.<ext>`.
 * Ces six-là couvrent précisément ce qui n'était écrit nulle part et qui nous a
 * fait nous tromper — les pistes, le centre et l'empilement.
 */
export const MODS_GUIDE_SLOTS = [
  /** L'écran d'armurerie complet : huit cases, le centre, la jauge de tolérance. */
  "board",
  /** Zoom sur un badge de case : coût, glyphe de piste, couronne du module. */
  "trackBadge",
  /** Le bandeau « Module de transfert d'affinité → Appliquer ». */
  "trackShiftApply",
  /** Le centre, slot 09, et son badge. */
  "center",
  /** Infobulle d'une pièce empilable : la mention « +5 ». */
  "stacking",
  /** La jauge de tolérance et son plafond. */
  "tolerance",
] as const;

export type ModsGuideSlot = (typeof MODS_GUIDE_SLOTS)[number];

/**
 * Emplacements du guide des **Géniemons** : `public/assets/guides/genimons/`.
 * Ils couvrent les deux moitiés du sujet — élever la créature, puis greffer et
 * fusionner ses Traits.
 */
export const GENIMONS_GUIDE_SLOTS = [
  /** La fiche d'un Géniemon : niveau, rareté, passif. */
  "overview",
  /** L'écran de montée de niveau, et ce qu'on lui donne. */
  "levelUp",
  /** L'ascension, et le palier qu'elle ouvre. */
  "ascension",
  /** Les emplacements de Trait, ouverts par l'ascension. */
  "traitSlots",
  /** La fusion de trois Traits identiques en un de rareté supérieure. */
  "fusion",
  /** L'Entraînement de Géniemon : transmettre un Trait d'un inactif à un actif. */
  "training",
  /** Où trouver l'échange, depuis les Missions à prime. */
  "shopPath",
  /** Les quatre coffrets de la boutique et leurs deux monnaies. */
  "shopChests",
  /** Le coffret de sélection, et ce qu'il laisse choisir. */
  "shopSelection",
] as const;

export type GenimonsGuideSlot = (typeof GENIMONS_GUIDE_SLOTS)[number];

/** Famille de guide : chaque famille a son dossier d'illustrations. */
export type GuideFamily = "calamity" | "mods" | "genimons";

export type GuideSlot = CalamityGuideSlot | ModsGuideSlot | GenimonsGuideSlot;

export const MODS_GUIDE_IMAGE_DIR = "/assets/guides/mods";
export const GENIMONS_GUIDE_IMAGE_DIR = "/assets/guides/genimons";

/**
 * ⚠️ **Un seul préfixe littéral par fonction, et surtout pas de ternaire.**
 *
 * Le traceur de fichiers de Next doit pouvoir résoudre le dossier à la
 * compilation. Dès qu'il ne le peut plus — une table `FAMILY_DIRS[family]`,
 * ou même un ternaire entre deux littéraux — il élargit au préfixe commun et
 * embarque tout `public/assets/**` : 3 501 fichiers, 373 Mo, et la fonction
 * dépasse la limite de 250 Mo au déploiement. D'où ces deux fonctions
 * presque identiques, dont la duplication est volontaire.
 */
function resolveCalamityImage(slot: string): string | null {
  for (const extension of EXTENSIONS) {
    const relative = `/assets/guides/calamity/${slot}.${extension}`;
    if (existsSync(join(process.cwd(), "public", relative))) return relative;
  }
  return null;
}

function resolveModsImage(slot: string): string | null {
  for (const extension of EXTENSIONS) {
    const relative = `/assets/guides/mods/${slot}.${extension}`;
    if (existsSync(join(process.cwd(), "public", relative))) return relative;
  }
  return null;
}

function resolveGenimonsImage(slot: string): string | null {
  for (const extension of EXTENSIONS) {
    const relative = `/assets/guides/genimons/${slot}.${extension}`;
    if (existsSync(join(process.cwd(), "public", relative))) return relative;
  }
  return null;
}

/**
 * Chemin public de l'illustration si elle a été déposée, `null` sinon.
 * Lecture disque : réservé aux composants serveur.
 */
export function resolveGuideImage(slot: GuideSlot, family: GuideFamily = "calamity"): string | null {
  if (family === "mods") return resolveModsImage(slot);
  if (family === "genimons") return resolveGenimonsImage(slot);
  return resolveCalamityImage(slot);
}

/** Nom de fichier attendu, affiché dans le cadre vide pour lever toute ambiguïté. */
export function expectedGuideFileName(slot: GuideSlot, family: GuideFamily = "calamity"): string {
  if (family === "mods") return `public${MODS_GUIDE_IMAGE_DIR}/${slot}.webp`;
  if (family === "genimons") return `public${GENIMONS_GUIDE_IMAGE_DIR}/${slot}.webp`;
  return `public${GUIDE_IMAGE_DIR}/${slot}.webp`;
}
