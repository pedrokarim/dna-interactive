import { z } from "zod";
import { getCharacterById, getCharacterElements } from "@/lib/characters/catalog";
import { getItemByCategoryAndId } from "@/lib/items/catalog";

const itemIdSchema = z.string().trim().min(1).max(96);
const rankSchema = z.enum(["best", "alternative"]);

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
      affinity: z.string().trim().max(80).nullable().optional(),
    })
    .default({ slots: [] }),
  genimon: z.array(z.object({ itemId: itemIdSchema, rank: rankSchema })).max(3).default([]),
  consonanceWeapon: z
    .object({
      slots: z.array(itemIdSchema).max(4).default([]),
    })
    .nullable()
    .default(null),
  statsPriority: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  skillPriority: z
    .array(
      z.object({
        skillName: z.string().trim().min(1).max(80),
        skillIndex: z.number().int().min(1).max(12).optional(),
        priority: z.number().int().min(1).max(12),
      }),
    )
    .max(12)
    .default([]),
  team: z
    .array(
      z.object({
        characterId: z.string().trim().min(1).max(80),
        role: z.string().trim().min(1).max(40),
      }),
    )
    .max(3)
    .default([]),
});

export const createBuildSchema = z.object({
  characterId: z.string().trim().min(1).max(80),
  element: z.string().trim().min(1).max(40).nullable().optional(),
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
  element: z.string().trim().min(1).max(40).nullable().optional(),
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
  }
  for (const slot of input.payload.consonanceWeapon?.slots ?? []) {
    checkItem("mods", slot, "MOD de consonance");
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
