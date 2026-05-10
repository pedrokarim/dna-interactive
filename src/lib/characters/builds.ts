import { allBuilds } from "@/data/characters/builds";
import { getItemByCategoryAndId, getItemTranslation } from "@/lib/items/catalog";
import { getCharacterById, getCharacterSlug, getCharacterTranslation } from "@/lib/characters/catalog";
import type { ItemRecord } from "@/lib/items/types";
import type { CharacterRecord } from "@/lib/characters/types";

// ---------------------------------------------------------------------------
// Raw JSON types (what's in builds.json)
// ---------------------------------------------------------------------------

interface RawLocalizedText {
  [lang: string]: string;
}

interface RawWeaponEntry {
  itemId: string;
  rank: "best" | "alternative";
  note?: RawLocalizedText;
}

interface RawDemonWedgeSlot {
  position: number;
  itemId: string;
  track?: number | null;
}

interface RawDemonWedgesConfig {
  slots: RawDemonWedgeSlot[];
  centerItemId?: string;
  affinity?: RawLocalizedText;
  note?: RawLocalizedText;
}

interface RawTeamEntry {
  characterId: string;
  role: string;
  note?: RawLocalizedText;
}

interface RawGenimonEntry {
  itemId: string;
  rank: "best" | "alternative";
}

interface RawSkillPriority {
  skillName: RawLocalizedText;
  skillIndex?: number;
  priority: number;
  note?: RawLocalizedText;
}

interface RawCharacterBuild {
  characterId: string;
  buildName: RawLocalizedText;
  weapons?: {
    melee?: RawWeaponEntry[];
    ranged?: RawWeaponEntry[];
  };
  demonWedges?: RawDemonWedgesConfig;
  statsPriority?: string[];
  team?: RawTeamEntry[];
  genimon?: RawGenimonEntry[];
  skillPriority?: RawSkillPriority[];
  consonanceWeapon?: {
    name: RawLocalizedText;
    icon?: string;
    slots: string[];
  };
  notes?: RawLocalizedText;
}

// ---------------------------------------------------------------------------
// Resolved types (what components consume)
// ---------------------------------------------------------------------------

export interface ResolvedItemRef {
  itemId: string;
  modId: number;
  name: string;
  description: string | null;
  icon: string;
  href: string;
  rarity: number | null;
  element: string | null;
  polarity: number | null;
}

export interface ResolvedCharacterRef {
  characterId: string;
  name: string;
  portrait: string | null;
  href: string;
  element: { key: string; label: string };
}

export interface BuildWeaponEntry {
  item: ResolvedItemRef | null;
  rank: "best" | "alternative";
  note: RawLocalizedText;
}

export interface BuildDemonWedgeSlot {
  position: number;
  item: ResolvedItemRef | null;
  track: number | null;
}

export interface BuildDemonWedgesConfig {
  slots: BuildDemonWedgeSlot[];
  centerItem: ResolvedItemRef | null;
  affinity: RawLocalizedText;
  note: RawLocalizedText;
}

export interface BuildTeamEntry {
  character: ResolvedCharacterRef | null;
  role: string;
  note: RawLocalizedText;
}

export interface BuildGenimonEntry {
  item: ResolvedItemRef | null;
  rank: "best" | "alternative";
}

export interface BuildSkillPriority {
  skillName: RawLocalizedText;
  skillIndex?: number;
  priority: number;
  note: RawLocalizedText;
}

export interface CharacterBuild {
  characterId: string;
  buildName: RawLocalizedText;
  weapons: {
    melee: BuildWeaponEntry[];
    ranged: BuildWeaponEntry[];
  };
  demonWedges: BuildDemonWedgesConfig;
  statsPriority: string[];
  team: BuildTeamEntry[];
  genimon: BuildGenimonEntry[];
  skillPriority: BuildSkillPriority[];
  consonanceWeapon: {
    name: RawLocalizedText;
    icon: string | null;
    slots: ResolvedItemRef[];
  } | null;
  notes: RawLocalizedText;
}

// ---------------------------------------------------------------------------
// Resolution helpers
// ---------------------------------------------------------------------------

const FALLBACK_LANGS = ["FR", "EN"];

function resolveItemRef(
  categoryId: string,
  itemId: string,
  lang: string = "FR",
): ResolvedItemRef | null {
  const item: ItemRecord | null = getItemByCategoryAndId(categoryId, itemId);
  if (!item) return null;

  const translation = getItemTranslation(item, lang, FALLBACK_LANGS);
  const name = translation.modName
    ? translation.demonWedgeName
      ? `${translation.modName} ${translation.demonWedgeName}`
      : translation.modName
    : `#${item.modId}`;

  return {
    itemId: item.id,
    modId: item.modId,
    name,
    description: translation.passiveEffectsDescription ?? translation.description ?? null,
    icon: item.icon.publicPath ?? item.icon.placeholderPath ?? "/marker-default.svg",
    href: `/items/${categoryId}/${item.id}`,
    rarity: item.stats.rarity,
    element: item.affinity?.char ?? null,
    polarity: item.stats.polarity ?? null,
  };
}

function resolveCharacterRef(
  characterId: string,
  lang: string = "FR",
): ResolvedCharacterRef | null {
  const character: CharacterRecord | null = getCharacterById(characterId);
  if (!character) return null;

  const translation = getCharacterTranslation(character, lang, FALLBACK_LANGS);

  return {
    characterId: character.id,
    name: translation.name ?? character.internalName,
    portrait: character.portraits.head?.publicPath ?? null,
    href: `/characters/${getCharacterSlug(character)}`,
    element: character.element,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const rawBuilds = allBuilds as unknown as RawCharacterBuild[];

export function getCharacterBuilds(characterId: string): CharacterBuild[] {
  return rawBuilds
    .filter((b) => b.characterId === characterId)
    .map((raw) => ({
      characterId: raw.characterId,
      buildName: raw.buildName ?? {},
      weapons: {
        melee: (raw.weapons?.melee ?? []).map((w) => ({
          item: resolveItemRef("weapons", w.itemId),
          rank: w.rank,
          note: w.note ?? {},
        })),
        ranged: (raw.weapons?.ranged ?? []).map((w) => ({
          item: resolveItemRef("weapons", w.itemId),
          rank: w.rank,
          note: w.note ?? {},
        })),
      },
      demonWedges: {
        slots: (raw.demonWedges?.slots ?? []).map((s) => ({
          position: s.position,
          item: resolveItemRef("mods", s.itemId),
          track: s.track ?? null,
        })),
        centerItem: raw.demonWedges?.centerItemId
          ? resolveItemRef("mods", raw.demonWedges.centerItemId)
          : null,
        affinity: raw.demonWedges?.affinity ?? {},
        note: raw.demonWedges?.note ?? {},
      },
      statsPriority: raw.statsPriority ?? [],
      team: (raw.team ?? []).map((t) => ({
        character: resolveCharacterRef(t.characterId),
        role: t.role,
        note: t.note ?? {},
      })),
      genimon: (raw.genimon ?? []).map((g) => ({
        item: resolveItemRef("genimons", g.itemId),
        rank: g.rank,
      })),
      skillPriority: (raw.skillPriority ?? []).map((s) => ({
        skillName: s.skillName ?? {},
        skillIndex: s.skillIndex,
        priority: s.priority,
        note: s.note ?? {},
      })),
      consonanceWeapon: raw.consonanceWeapon
        ? {
            name: raw.consonanceWeapon.name ?? {},
            icon: raw.consonanceWeapon.icon ?? null,
            slots: (raw.consonanceWeapon.slots ?? [])
              .map((itemId) => resolveItemRef("mods", itemId))
              .filter((ref): ref is ResolvedItemRef => ref !== null),
          }
        : null,
      notes: raw.notes ?? {},
    }));
}

// ---------------------------------------------------------------------------
// Armory asset helpers
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
