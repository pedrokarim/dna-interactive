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
  "overview",
  "unlock",
  "forge",
  "furnace",
  "potential",
  "materials",
] as const;

export type CalamityGuideSlot = (typeof CALAMITY_GUIDE_SLOTS)[number];

/**
 * Chemin public de l'illustration si elle a été déposée, `null` sinon.
 * Lecture disque : réservé aux composants serveur.
 */
export function resolveGuideImage(slot: CalamityGuideSlot): string | null {
  for (const extension of EXTENSIONS) {
    const relative = `${GUIDE_IMAGE_DIR}/${slot}.${extension}`;
    if (existsSync(join(process.cwd(), "public", relative))) return relative;
  }
  return null;
}

/** Nom de fichier attendu, affiché dans le cadre vide pour lever toute ambiguïté. */
export function expectedGuideFileName(slot: CalamityGuideSlot): string {
  return `public${GUIDE_IMAGE_DIR}/${slot}.webp`;
}
