import { z } from "zod";
import { getCharacterById, getCharacterElements } from "@/lib/characters/catalog";
import { getItemByCategoryAndId } from "@/lib/items/catalog";
import { isCenterDemonWedgeItemId } from "./center-wedges";

const itemIdSchema = z.string().trim().min(1).max(96);
const rankSchema = z.enum(["best", "alternative"]);

// --- Sets fermés : un build communautaire ne référence que NOS entités. ---
const ELEMENT_VALUES = ["Fire", "Water", "Thunder", "Wind", "Light", "Dark"] as const;
export const elementKeySchema = z.enum(ELEMENT_VALUES);

// Clés de stats autorisées — pas de texte libre. Couvre ATK/élément, crit,
// compétence, morale, pénétration, etc.
export const STAT_KEYS = [
  "ATK", "ATK_Fire", "ATK_Water", "ATK_Thunder", "ATK_Wind", "ATK_Light", "ATK_Dark",
  "DEF", "HP", "MaxHp", "MaxES", "MaxSp",
  "SkillIntensity", "SkillRange", "SkillEfficiency", "SkillSustain", "SkillDmg", "ElementDmg",
  "Morale", "CritRate", "CritDmg", "PEN", "TriggerProbability",
] as const;

// Rôles d'équipe autorisés — identiques au picker du builder.
export const TEAM_ROLES = ["DPS", "Sub-DPS", "Support", "Heal", "Tank"] as const;

// Un perso n'expose que 3 slots de compétence référençables (skill1/2/3).
const MAX_SKILL_INDEX = 3;

// Catégories de build (tags) — jeu canonique fermé, libellés localisés à l'affichage.
export const BUILD_TAGS = ["solo", "team", "boss", "f2p", "endgame", "beginner"] as const;
export type BuildTag = (typeof BUILD_TAGS)[number];

export const buildTitleSchema = z.string().trim().min(3).max(60);
export const buildNoteSchema = z.string().trim().max(200).nullable().optional();

export const buildPayloadSchema = z.object({
  weapons: z
    .object({
      melee: z.array(z.object({ itemId: itemIdSchema, rank: rankSchema })).max(3).default([]),
      ranged: z.array(z.object({ itemId: itemIdSchema, rank: rankSchema })).max(3).default([]),
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
  genimon: z.array(z.object({ itemId: itemIdSchema, rank: rankSchema })).max(3).default([]),
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
        // Nom NON autoritatif : l'app le re-résout depuis skillIndex à l'affichage.
        skillName: z.string().trim().max(80).optional(),
        // LA référence : index du slot de compétence (1-3) du perso. Requis + borné.
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

// Vérifie qu'un index de compétence (1-3) correspond bien à un slot réel du
// perso (skill1/2/3 avec une icône) — on ne fait pas confiance au nombre envoyé.
function characterHasSkillIndex(
  character: NonNullable<ReturnType<typeof getCharacterById>>,
  index: number,
): boolean {
  const icons = character.skillIcons;
  const path =
    index === 1 ? icons.skill1?.publicPath : index === 2 ? icons.skill2?.publicPath : index === 3 ? icons.skill3?.publicPath : null;
  return Boolean(path);
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
  }

  const checkItem = (categoryId: "weapons" | "mods" | "genimons", itemId: string, label: string) => {
    if (!getItemByCategoryAndId(categoryId, itemId)) {
      errors.push(`${label} introuvable : ${itemId}.`);
    }
  };

  for (const weapon of input.payload.weapons.melee) checkItem("weapons", weapon.itemId, "Arme melee");
  for (const weapon of input.payload.weapons.ranged) checkItem("weapons", weapon.itemId, "Arme ranged");
  for (const genimon of input.payload.genimon) checkItem("genimons", genimon.itemId, "Génimon");
  for (const slot of input.payload.demonWedges.slots) checkItem("mods", slot.itemId, "Demon Wedge");
  if (input.payload.demonWedges.centerItemId) {
    checkItem("mods", input.payload.demonWedges.centerItemId, "Demon Wedge central");
    if (!isCenterDemonWedgeItemId(input.payload.demonWedges.centerItemId)) {
      errors.push("Ce Demon Wedge ne peut pas etre place au centre du build.");
    }
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
