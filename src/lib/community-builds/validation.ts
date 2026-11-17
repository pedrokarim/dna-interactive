import { z } from "zod";
import { getCharacterById, getCharacterElements } from "@/lib/characters/catalog";
import {
  MAX_GENIMON_TRAITS,
  genimonTraitSlots,
  isKnownTraitKey,
} from "@/lib/genimons/build-traits";
import { getItemByCategoryAndId } from "@/lib/items/catalog";
import { isWeaponWedge, type WeaponWedgeClass } from "@/lib/items/weapon-builds";
import { isCenterDemonWedgeItemId } from "./center-wedges";
import { checkCharacterWedges, checkWeaponWedgeDuplicates, describeWedge } from "./wedge-rules";

const itemIdSchema = z.string().trim().min(1).max(96);
const rankSchema = z.enum(["best", "alternative"]);

// --- Sets fermés : un build communautaire ne référence que nos entités. ---
const ELEMENT_VALUES = ["Fire", "Water", "Thunder", "Wind", "Light", "Dark"] as const;
export const elementKeySchema = z.enum(ELEMENT_VALUES);

// Clés de stats autorisées, pas de texte libre (ATK/élément, crit, compétence,
// morale, pénétration…).
export const STAT_KEYS = [
  "ATK", "ATK_Fire", "ATK_Water", "ATK_Thunder", "ATK_Wind", "ATK_Light", "ATK_Dark",
  "DEF", "HP", "MaxHp", "MaxES", "MaxSp",
  "SkillIntensity", "SkillRange", "SkillEfficiency", "SkillSustain", "SkillDmg", "ElementDmg",
  "Morale", "CritRate", "CritDmg", "PEN", "TriggerProbability",
] as const;

// Rôles d'équipe autorisés, les mêmes que dans le picker du builder.
export const TEAM_ROLES = ["DPS", "Sub-DPS", "Support", "Heal", "Tank"] as const;

// Un perso n'expose que 3 slots de compétence référençables (skill1/2/3).
const MAX_SKILL_INDEX = 3;

// Catégories de build (tags) : liste fermée, libellés traduits à l'affichage.
export const BUILD_TAGS = ["solo", "team", "boss", "f2p", "endgame", "beginner"] as const;
export type BuildTag = (typeof BUILD_TAGS)[number];

export const buildTitleSchema = z.string().trim().min(3).max(60);
export const buildNoteSchema = z.string().trim().max(200).nullable().optional();

// Demon Wedges d'une arme à l'intérieur d'un build, éditables et indépendants du
// build canonique de la fiche arme. 8 cases et une affinité (élément), pas de
// pièce au centre. Voir docs/cadrage-builds-armes.md.
const weaponDemonWedgesSchema = z.object({
  slots: z
    .array(
      z.object({
        position: z.number().int().min(1).max(8),
        itemId: itemIdSchema,
        track: z.number().int().min(1).max(4).nullable().optional(),
      }),
    )
    .max(8)
    .default([]),
  affinity: elementKeySchema.nullable().optional(),
});

// `withWedges` (legacy) conservé en optionnel pour ne pas casser les builds déjà
// publiés ; le builder n'écrit plus que `demonWedges`.
const weaponEntrySchema = z.object({
  itemId: itemIdSchema,
  rank: rankSchema,
  withWedges: z.boolean().optional(),
  demonWedges: weaponDemonWedgesSchema.optional(),
});

export const buildPayloadSchema = z.object({
  weapons: z
    .object({
      melee: z.array(weaponEntrySchema).max(3).default([]),
      ranged: z.array(weaponEntrySchema).max(3).default([]),
    })
    .default({ melee: [], ranged: [] }),
  demonWedges: z
    .object({
      slots: z
        .array(
          z.object({
            position: z.number().int().min(1).max(8),
            itemId: itemIdSchema,
            track: z.number().int().min(1).max(4).nullable().optional(),
          }),
        )
        .max(8)
        .default([]),
      centerItemId: itemIdSchema.nullable().optional(),
      affinity: elementKeySchema.nullable().optional(),
    })
    .default({ slots: [] }),
  genimon: z
    .array(
      z.object({
        itemId: itemIdSchema,
        rank: rankSchema,
        // Borne haute ici ; le nombre réel dépend de la créature et se vérifie
        // au contrôle référentiel, qui seul sait si elle est scintillante.
        traits: z.array(z.string().min(1).max(64)).max(MAX_GENIMON_TRAITS).default([]),
      }),
    )
    .max(3)
    .default([]),
  consonanceWeapon: z
    .object({
      slots: z.array(itemIdSchema).max(4).default([]),
    })
    .nullable()
    .default(null),
  statsPriority: z.array(z.enum(STAT_KEYS)).max(12).default([]),
  skillPriority: z
    .array(
      z.object({
        // Indicatif seulement : l'appli retrouve le nom depuis skillIndex à l'affichage.
        skillName: z.string().trim().max(80).optional(),
        // La vraie référence : index du slot de compétence (1-3) du perso, requis et borné.
        skillIndex: z.number().int().min(1).max(MAX_SKILL_INDEX),
        priority: z.number().int().min(1).max(5),
      }),
    )
    .max(MAX_SKILL_INDEX)
    .default([]),
  team: z
    .array(
      z.object({
        characterId: z.string().trim().min(1).max(80),
        role: z.enum(TEAM_ROLES),
      }),
    )
    .max(3)
    .default([]),
  tags: z.array(z.enum(BUILD_TAGS)).max(5).default([]),
});

export const createBuildSchema = z.object({
  characterId: z.string().trim().min(1).max(80),
  element: elementKeySchema.nullable().optional(),
  title: buildTitleSchema,
  note: buildNoteSchema,
  payload: buildPayloadSchema,
});

export const updateBuildSchema = z.object({
  title: buildTitleSchema.optional(),
  note: buildNoteSchema,
  payload: buildPayloadSchema.optional(),
});

export const draftSchema = z.object({
  characterId: z.string().trim().min(1).max(80),
  element: elementKeySchema.nullable().optional(),
  title: z.string().trim().max(60).nullable().optional(),
  note: buildNoteSchema,
  payload: buildPayloadSchema,
});

export const reportSchema = z.object({
  reason: z.string().trim().min(3).max(160),
});

export type CommunityBuildPayload = z.infer<typeof buildPayloadSchema>;
export type CreateBuildInput = z.infer<typeof createBuildSchema>;
export type UpdateBuildInput = z.infer<typeof updateBuildSchema>;
export type DraftInput = z.infer<typeof draftSchema>;

export function draftElementKey(element?: string | null): string {
  return element?.trim() || "default";
}

export function publicElementValue(element: string | null): string | null {
  return element && element !== "default" ? element : null;
}

// L'index de compétence (1-3) doit correspondre à un vrai slot du perso
// (skill1/2/3 avec une icône) : on ne fait pas confiance au nombre envoyé.
function characterHasSkillIndex(
  character: NonNullable<ReturnType<typeof getCharacterById>>,
  index: number,
): boolean {
  const icons = character.skillIcons;
  const path =
    index === 1 ? icons.skill1?.publicPath : index === 2 ? icons.skill2?.publicPath : index === 3 ? icons.skill3?.publicPath : null;
  return Boolean(path);
}

// Classe mêlée ou distance d'une arme, pour vérifier que ses Demon Wedges sont
// du bon pool (pas de wedge distance sur une arme de mêlée).
function weaponClassOf(itemId: string): WeaponWedgeClass | null {
  const item = getItemByCategoryAndId("weapons", itemId);
  const keys = item?.typeCompatibility?.textKeys ?? [];
  if (keys.includes("UI_Armory_Meleeweapon")) return "melee";
  if (keys.includes("UI_Armory_Longrange")) return "ranged";
  return null;
}

function modName(itemId: string): string {
  const mod = getItemByCategoryAndId("mods", itemId);
  return mod?.translations?.FR?.modName ?? mod?.translations?.EN?.modName ?? itemId;
}

export function validateBuildReferences(input: CreateBuildInput | DraftInput): string[] {
  const errors: string[] = [];
  const character = getCharacterById(input.characterId);
  if (!character) {
    errors.push("Personnage introuvable.");
  } else if (input.element) {
    const allowed = new Set(getCharacterElements(character).map((el) => el.key));
    if (!allowed.has(input.element)) {
      errors.push("Élément invalide pour ce personnage.");
    }
  }

  if (character) {
    for (const skill of input.payload.skillPriority) {
      if (!characterHasSkillIndex(character, skill.skillIndex)) {
        errors.push(`Competence invalide pour ce personnage : #${skill.skillIndex}.`);
      }
    }

    // Pas de restriction des armes aux types du perso : le builder propose toutes
    // les armes (le filtre par perso est une option d'interface, désactivée par
    // défaut). Elles doivent seulement exister dans le catalogue (plus bas).
  }

  const checkItem = (categoryId: "weapons" | "mods" | "genimons", itemId: string, label: string) => {
    if (!getItemByCategoryAndId(categoryId, itemId)) {
      errors.push(`${label} introuvable : ${itemId}.`);
    }
  };

  for (const weapon of input.payload.weapons.melee) checkItem("weapons", weapon.itemId, "Arme melee");
  for (const weapon of input.payload.weapons.ranged) checkItem("weapons", weapon.itemId, "Arme ranged");

  // Demon Wedges de chaque arme : ils doivent exister, venir du pool de la bonne
  // classe (mêlée/distance) et ne pas occuper deux fois la même position.
  for (const weapon of [...input.payload.weapons.melee, ...input.payload.weapons.ranged]) {
    if (!weapon.demonWedges) continue;
    const weaponClass = weaponClassOf(weapon.itemId);
    const wedgePositions = new Set<number>();
    for (const slot of weapon.demonWedges.slots) {
      const mod = getItemByCategoryAndId("mods", slot.itemId);
      if (!mod) {
        errors.push(`Demon Wedge d'arme introuvable : ${slot.itemId}.`);
      } else if (weaponClass && !isWeaponWedge(mod, weaponClass)) {
        errors.push(`Demon Wedge incompatible avec l'arme (${weaponClass}) : ${slot.itemId}.`);
      }
      if (wedgePositions.has(slot.position)) {
        errors.push(`Position de Demon Wedge d'arme dupliquée (${weapon.itemId}) : ${slot.position}.`);
      }
      wedgePositions.add(slot.position);
    }
    errors.push(...checkWeaponWedgeDuplicates(weapon.itemId, weapon.demonWedges.slots, modName));
  }
  for (const genimon of input.payload.genimon) {
    const item = getItemByCategoryAndId("genimons", genimon.itemId);
    if (!item) {
      errors.push(`Génimon introuvable : ${genimon.itemId}.`);
    } else if (item.stats.maxLevel !== 60) {
      // maxLevel 1 = pet d'événement (Monster Rush/Wishen) ou drone non équipable.
      errors.push(`Génimon non équipable : ${genimon.itemId}.`);
    } else {
      // Le nombre d'emplacements vient de la créature (trois pour une variante
      // ordinaire, quatre pour une scintillante), pas du client.
      const slots = genimonTraitSlots(genimon.itemId);
      if (genimon.traits.length > slots) {
        errors.push(`Trop de Traits pour ${genimon.itemId} : ${genimon.traits.length} pour ${slots} emplacements.`);
      }
      const seen = new Set<string>();
      for (const key of genimon.traits) {
        if (!isKnownTraitKey(key)) {
          errors.push(`Trait inconnu : ${key}.`);
        } else if (seen.has(key)) {
          errors.push(`Trait en double sur ${genimon.itemId} : ${key}.`);
        }
        seen.add(key);
      }
    }
  }
  for (const slot of input.payload.demonWedges.slots) checkItem("mods", slot.itemId, "Demon Wedge");
  if (input.payload.demonWedges.centerItemId) {
    checkItem("mods", input.payload.demonWedges.centerItemId, "Demon Wedge central");
    if (!isCenterDemonWedgeItemId(input.payload.demonWedges.centerItemId)) {
      errors.push("Ce Demon Wedge ne peut pas etre place au centre du build.");
    }
  }
  if (character) {
    // Un perso mono-élément enregistre ses builds sans élément : on prend le sien.
    const fallback = elementKeySchema.safeParse(getCharacterElements(character)[0]?.key);
    const buildElement = input.element ?? (fallback.success ? fallback.data : null);
    errors.push(
      ...checkCharacterWedges(
        { element: buildElement, slots: input.payload.demonWedges.slots, centerItemId: input.payload.demonWedges.centerItemId },
        (itemId) => {
          const mod = getItemByCategoryAndId("mods", itemId);
          return mod ? describeWedge(mod) : null;
        },
        modName,
      ),
    );
  }
  const consonanceSlots = input.payload.consonanceWeapon?.slots ?? [];
  for (const slot of consonanceSlots) {
    checkItem("mods", slot, "MOD de consonance");
  }
  if (consonanceSlots.length > 0 && character) {
    const consonances = (character as { consonanceWeapons?: unknown[] }).consonanceWeapons;
    if (!Array.isArray(consonances) || consonances.length === 0) {
      errors.push("Ce personnage n'a pas d'arme de consonance.");
    }
  }
  for (const teammate of input.payload.team) {
    if (!getCharacterById(teammate.characterId)) {
      errors.push(`Personnage d'équipe introuvable : ${teammate.characterId}.`);
    }
  }

  const positions = new Set<number>();
  for (const slot of input.payload.demonWedges.slots) {
    if (positions.has(slot.position)) {
      errors.push(`Position Demon Wedge dupliquée : ${slot.position}.`);
    }
    positions.add(slot.position);
  }

  return errors;
}
