import { ELEMENTS, type ElementKey } from "@/components/dna/elements";
import type { ItemRecord } from "@/lib/items/types";
import { isCenterDemonWedgeItemId } from "./center-wedges";

/**
 * Règles de placement des Demon Wedges d'un build, partagées par le picker du
 * builder, l'import JSON/XML/lien et la validation serveur. Avant elles, ces
 * trois chemins ne vérifiaient que l'existence des pièces : un build pouvait
 * porter des pièces d'arme, un centre ou des pièces d'un autre élément.
 *
 * Règles (cf. docs/demon-wedge-build-rules.md) :
 * - une case de personnage n'accepte que le pool personnage (`UI_Armory_Char`) ;
 * - la famille Feathered Serpent's ne se pose qu'au centre ;
 * - une pièce élémentaire ne s'équipe que sur un build du même élément ;
 * - une piste renseignée vaut toujours la polarité de la pièce ;
 * - seule la famille Covenanter's se cumule ; aucune pièce d'arme ne se cumule.
 */

/** Ce qu'il faut savoir d'un Demon Wedge pour juger de sa place dans un build. */
export type WedgeRuleInfo = {
  pool: "character" | "weapon";
  element: ElementKey | null;
  polarity: number | null;
  /** Famille Feathered Serpent's : centre uniquement. */
  core: boolean;
  /** Famille Covenanter's : peut être équipée plusieurs fois une fois montée +5. */
  stackable: boolean;
};

type WedgeSlot = { position: number; itemId: string; track?: number | null };

const ELEMENT_KEYS = new Set<string>(Object.keys(ELEMENTS));
const STACKABLE_CLAUSE = /equipped in multiples/i;

export function describeWedge(item: ItemRecord): WedgeRuleInfo | null {
  if (item.categoryId !== "mods") return null;
  const keys = item.typeCompatibility?.textKeys ?? [];
  const element = keys
    .map((key) => /^UI_Attr_(\w+)_Name$/.exec(key)?.[1])
    .find((key): key is ElementKey => key !== undefined && ELEMENT_KEYS.has(key));
  return {
    pool: keys.includes("UI_Armory_Char") ? "character" : "weapon",
    element: element ?? null,
    polarity: item.stats.polarity ?? null,
    core: isCenterDemonWedgeItemId(item.id),
    stackable: STACKABLE_CLAUSE.test(item.translations?.EN?.passiveEffectsDescription ?? ""),
  };
}

function fitsElement(info: WedgeRuleInfo, element: ElementKey | null): boolean {
  return info.element === null || info.element === element;
}

/** Peut-on poser cette pièce dans une des 8 cases d'un personnage ? */
export function canEquipOnCharacter(info: WedgeRuleInfo, element: ElementKey | null): boolean {
  return info.pool === "character" && !info.core && fitsElement(info, element);
}

/** Peut-on poser cette pièce au centre d'un build ? */
export function canEquipAsCenter(info: WedgeRuleInfo, element: ElementKey | null): boolean {
  return info.core && fitsElement(info, element);
}

function elementLabel(element: ElementKey | null): string {
  return element ? ELEMENTS[element].label : "sans élément";
}

/**
 * Contrôle les Demon Wedges du personnage. Une pièce introuvable est ignorée :
 * son existence est vérifiée par l'appelant, qui a déjà son propre message.
 */
export function checkCharacterWedges(
  build: { element: ElementKey | null; slots: WedgeSlot[]; centerItemId?: string | null },
  resolve: (itemId: string) => WedgeRuleInfo | null,
  nameOf: (itemId: string) => string = (itemId) => itemId,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const slot of build.slots) {
    const info = resolve(slot.itemId);
    if (!info) continue;
    const name = `« ${nameOf(slot.itemId)} » (case ${slot.position})`;

    if (info.pool !== "character") {
      errors.push(`${name} est un Demon Wedge d'arme : il ne se pose pas sur un personnage.`);
    } else if (info.core) {
      errors.push(`${name} est un Demon Wedge de centre : il ne se pose qu'au centre.`);
    } else if (!fitsElement(info, build.element)) {
      errors.push(`${name} est ${elementLabel(info.element)} : il ne s'équipe pas sur un build ${elementLabel(build.element)}.`);
    }

    if (slot.track != null && info.polarity != null && slot.track !== info.polarity) {
      errors.push(`La piste de ${name} ne correspond pas à sa polarité.`);
    }

    if (seen.has(slot.itemId) && !info.stackable) {
      errors.push(`${name} est déjà posé ailleurs et ne se cumule pas.`);
    }
    seen.add(slot.itemId);
  }

  const center = build.centerItemId ? resolve(build.centerItemId) : null;
  if (build.centerItemId && center?.core && !fitsElement(center, build.element)) {
    errors.push(
      `Le centre « ${nameOf(build.centerItemId)} » est ${elementLabel(center.element)} : il ne s'équipe pas sur un build ${elementLabel(build.element)}.`,
    );
  }

  return errors;
}

/** Aucun Demon Wedge d'arme ne se cumule : une même pièce deux fois est refusée. */
export function checkWeaponWedgeDuplicates(
  weaponName: string,
  slots: WedgeSlot[],
  nameOf: (itemId: string) => string = (itemId) => itemId,
): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const slot of slots) {
    if (seen.has(slot.itemId)) {
      errors.push(`« ${nameOf(slot.itemId)} » est posé deux fois sur ${weaponName}.`);
    }
    seen.add(slot.itemId);
  }
  return errors;
}
