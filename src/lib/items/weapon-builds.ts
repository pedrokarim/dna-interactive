import { allWeaponBuilds } from "@/data/weapons/builds";
import { getItemsByCategoryId } from "@/lib/items/catalog";
import { resolveBuildItemRef, type ResolvedItemRef } from "@/lib/characters/builds";
import type { ItemRecord } from "@/lib/items/types";

// ---------------------------------------------------------------------------
// Builds de Demon Wedges d'arme (voir docs/cadrage-builds-armes.md).
// 8 slots et une affinité (élément). Pas d'item au centre : le centre d'une
// arme sert à choisir l'affinité, ce n'est pas un wedge.
//
// Une arme peut avoir plusieurs builds. `allWeaponBuilds` est une liste plate
// résolue par `weaponId` : on ajoute un fichier avec le même `weaponId` et un
// autre `buildName`. Un fichier seul pour son arme reste valide tel quel,
// comme build unique sans nom.
// ---------------------------------------------------------------------------

interface RawLocalizedText {
  [lang: string]: string;
}

interface RawWeaponWedgeSlot {
  position: number;
  itemId: string;
  track?: number | null;
}

export interface RawWeaponBuild {
  weaponId: string;
  /** Nom du build, requis seulement quand une arme en porte plusieurs. */
  buildName?: RawLocalizedText;
  demonWedges: {
    slots: RawWeaponWedgeSlot[];
    /** Affinité du build (clé d'élément : "Fire", "Water"…), le « centre » de l'arme. */
    affinity?: string | null;
    note?: RawLocalizedText;
  };
  note?: RawLocalizedText;
}

export interface WeaponBuildSlot {
  position: number;
  item: ResolvedItemRef | null;
  track: number | null;
}

export interface WeaponBuild {
  weaponId: string;
  buildName: RawLocalizedText;
  demonWedges: {
    slots: WeaponBuildSlot[];
    affinity: string | null;
    note: RawLocalizedText;
  };
  note: RawLocalizedText;
}

const rawWeaponBuilds = allWeaponBuilds as unknown as RawWeaponBuild[];

function resolveWeaponBuild(raw: RawWeaponBuild, lang: string): WeaponBuild {
  return {
    weaponId: raw.weaponId,
    buildName: raw.buildName ?? {},
    demonWedges: {
      slots: (raw.demonWedges?.slots ?? []).map((s) => ({
        position: s.position,
        item: resolveBuildItemRef("mods", s.itemId, lang),
        track: s.track ?? null,
      })),
      affinity: raw.demonWedges?.affinity ?? null,
      note: raw.demonWedges?.note ?? {},
    },
    note: raw.note ?? {},
  };
}

/** Tous les builds de Demon Wedges d'une arme, dans l'ordre du catalogue. */
export function getWeaponBuilds(weaponId: string, lang: string = "FR"): WeaponBuild[] {
  return rawWeaponBuilds.filter((b) => b.weaponId === weaponId).map((raw) => resolveWeaponBuild(raw, lang));
}

/** Premier build d'une arme, ou null. Pour les vues qui n'en montrent qu'un. */
export function getWeaponBuild(weaponId: string, lang: string = "FR"): WeaponBuild | null {
  const raw = rawWeaponBuilds.find((b) => b.weaponId === weaponId);
  return raw ? resolveWeaponBuild(raw, lang) : null;
}

// ---------------------------------------------------------------------------
// Pool de wedges d'arme, filtré par classe (pour la validation et le builder).
// Le signal fiable est typeCompatibility.textKeys (voir le cadrage, §2).
// ---------------------------------------------------------------------------

export type WeaponWedgeClass = "melee" | "ranged";

function wedgeClassOf(mod: ItemRecord): WeaponWedgeClass | "char" | null {
  const keys = mod.typeCompatibility?.textKeys ?? [];
  if (keys.includes("UI_Armory_Meleeweapon") || keys.includes("UI_Armory_MeleeweaponUltra")) return "melee";
  if (keys.includes("UI_Armory_Longrange") || keys.includes("UI_Armory_LongrangeUltra")) return "ranged";
  if (keys.includes("UI_Armory_Char")) return "char";
  return null;
}

/** True si le mod est un Demon Wedge équipable sur une arme de cette classe. */
export function isWeaponWedge(mod: ItemRecord, weaponClass: WeaponWedgeClass): boolean {
  return wedgeClassOf(mod) === weaponClass;
}

/** Pool des Demon Wedges d'arme pour une classe (mêlée/distance). */
export function getWeaponWedgePool(weaponClass: WeaponWedgeClass): ItemRecord[] {
  return getItemsByCategoryId("mods").filter((mod) => isWeaponWedge(mod, weaponClass));
}
