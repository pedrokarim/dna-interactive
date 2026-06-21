import { allWeaponBuilds } from "@/data/weapons/builds";
import { getItemsByCategoryId } from "@/lib/items/catalog";
import { resolveBuildItemRef, type ResolvedItemRef } from "@/lib/characters/builds";
import type { ItemRecord } from "@/lib/items/types";

// ---------------------------------------------------------------------------
// Builds de Demon Wedges d'ARME (canoniques, 1 par arme).
// Cf. docs/cadrage-builds-armes.md. Structure = 8 slots + une affinité (élément),
// PAS de centre item (le centre d'arme = sélecteur d'affinité, pas un wedge).
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
  demonWedges: {
    slots: RawWeaponWedgeSlot[];
    /** Affinité du build (clé d'élément : "Fire"|"Water"|… ) — le « centre » de l'arme. */
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
  demonWedges: {
    slots: WeaponBuildSlot[];
    affinity: string | null;
    note: RawLocalizedText;
  };
  note: RawLocalizedText;
}

const rawWeaponBuilds = allWeaponBuilds as unknown as RawWeaponBuild[];

/** Build de Demon Wedges canonique d'une arme (résolu), ou null si absent. */
export function getWeaponBuild(weaponId: string, lang: string = "FR"): WeaponBuild | null {
  const raw = rawWeaponBuilds.find((b) => b.weaponId === weaponId);
  if (!raw) return null;
  return {
    weaponId: raw.weaponId,
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

// ---------------------------------------------------------------------------
// Pool de wedges d'ARME (pour validation + futur builder). Filtré par classe.
// Signal propre = typeCompatibility.textKeys (cf. cadrage §2).
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
