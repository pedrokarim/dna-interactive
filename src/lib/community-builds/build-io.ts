import { z } from "zod";

import type { BuilderOptions } from "./options";
import type { DnaPickerItem } from "@/components/dna/ItemPicker";
import type { CommunityBuildPayload } from "./validation";
import { BUILD_TAGS } from "./validation";
import { isCenterDemonWedgeItemId } from "./center-wedges";

export const COMMUNITY_BUILD_EXPORT_SCHEMA = "dna.community-build";
export const COMMUNITY_BUILD_EXPORT_VERSION = 1;
const MAX_IMPORT_BYTES = 512 * 1024;

const itemIdSchema = z.string().trim().min(1).max(96);
const elementSchema = z.enum(["Fire", "Water", "Thunder", "Wind", "Light", "Dark"]);
const rankSchema = z.enum(["best", "alternative"]);

const buildPayloadIoSchema = z
  .object({
    weapons: z
      .object({
        melee: z.array(z.object({ itemId: itemIdSchema, rank: rankSchema }).strict()).max(3),
        ranged: z.array(z.object({ itemId: itemIdSchema, rank: rankSchema }).strict()).max(3),
      })
      .strict(),
    demonWedges: z
      .object({
        slots: z
          .array(
            z
              .object({
                position: z.coerce.number().int().min(1).max(8),
                itemId: itemIdSchema,
                track: z.coerce.number().int().min(1).max(4).nullable().optional(),
              })
              .strict(),
          )
          .max(8),
        centerItemId: itemIdSchema.nullable().optional(),
        affinity: z.string().trim().max(80).nullable().optional(),
      })
      .strict(),
    genimon: z.array(z.object({ itemId: itemIdSchema, rank: rankSchema }).strict()).max(3),
    consonanceWeapon: z.object({ slots: z.array(itemIdSchema).max(4) }).strict().nullable(),
    statsPriority: z.array(z.string().trim().min(1).max(40)).max(12),
    skillPriority: z
      .array(
        z
          .object({
            skillName: z.string().trim().min(1).max(80),
            skillIndex: z.coerce.number().int().min(1).max(12).optional(),
            priority: z.coerce.number().int().min(1).max(12),
          })
          .strict(),
      )
      .max(12),
    team: z
      .array(
        z
          .object({
            characterId: z.string().trim().min(1).max(80),
            role: z.string().trim().min(1).max(40),
          })
          .strict(),
      )
      .max(3),
    tags: z.array(z.enum(BUILD_TAGS)).max(5).default([]),
  })
  .strict();

const buildExportSchema = z
  .object({
    schema: z.literal(COMMUNITY_BUILD_EXPORT_SCHEMA),
    version: z.literal(COMMUNITY_BUILD_EXPORT_VERSION),
    exportedAt: z.string().datetime(),
    characterId: itemIdSchema,
    element: elementSchema.nullable(),
    title: z.string().trim().min(3).max(60),
    note: z.string().trim().max(200).nullable(),
    payload: buildPayloadIoSchema,
  })
  .strict();

export type CommunityBuildExport = z.infer<typeof buildExportSchema>;

type ParseResult =
  | { ok: true; data: CommunityBuildExport }
  | { ok: false; errors: string[] };

function asSet(items: Array<{ id: string }>) {
  return new Set(items.map((item) => item.id));
}

function hasDuplicatePositions(slots: Array<{ position: number }>) {
  return new Set(slots.map((slot) => slot.position)).size !== slots.length;
}

function itemName(items: DnaPickerItem[], itemId: string) {
  return items.find((item) => item.id === itemId)?.name ?? itemId;
}

function validateAgainstOptions(data: CommunityBuildExport, options: BuilderOptions) {
  const errors: string[] = [];
  const character = options.characters.find((item) => item.id === data.characterId);
  const weaponIds = asSet(options.weapons);
  const modIds = asSet(options.mods);
  const genimonIds = asSet(options.genimons);
  const characterIds = asSet(options.characters);

  if (!character) {
    errors.push("Le personnage exporte n'existe pas dans le catalogue local.");
  } else if (data.element && !character.elements.some((element) => element.key === data.element)) {
    errors.push("L'element du build ne correspond pas au personnage choisi.");
  }

  for (const weapon of data.payload.weapons.melee) {
    if (!weaponIds.has(weapon.itemId)) {
      errors.push("Une arme melee exportee n'existe pas dans le catalogue local.");
    }
  }

  for (const weapon of data.payload.weapons.ranged) {
    if (!weaponIds.has(weapon.itemId)) {
      errors.push("Une arme ranged exportee n'existe pas dans le catalogue local.");
    }
  }

  if (
    data.payload.demonWedges.centerItemId &&
    !modIds.has(data.payload.demonWedges.centerItemId)
  ) {
    errors.push("Le Demon Wedge central n'existe pas dans le catalogue local.");
  }

  if (
    data.payload.demonWedges.centerItemId &&
    !isCenterDemonWedgeItemId(data.payload.demonWedges.centerItemId)
  ) {
    errors.push(
      `${itemName(options.mods, data.payload.demonWedges.centerItemId)} ne peut pas etre place au centre du build.`,
    );
  }

  for (const slot of data.payload.demonWedges.slots) {
    if (!modIds.has(slot.itemId)) {
      errors.push(`Le Demon Wedge en position ${slot.position} n'existe pas.`);
    }
  }

  if (hasDuplicatePositions(data.payload.demonWedges.slots)) {
    errors.push("Le build contient plusieurs Demon Wedges sur la meme position.");
  }

  if (data.payload.consonanceWeapon) {
    data.payload.consonanceWeapon.slots.forEach((itemId, index) => {
      if (!modIds.has(itemId)) {
        errors.push(`Le Demon Wedge de consonance en position ${index + 1} n'existe pas.`);
      }
    });
  }

  for (const genimon of data.payload.genimon) {
    if (!genimonIds.has(genimon.itemId)) {
      errors.push("Un Geniemon exporte n'existe pas dans le catalogue local.");
    }
  }

  for (const teammate of data.payload.team) {
    if (!characterIds.has(teammate.characterId)) {
      errors.push("Un personnage d'equipe exporte n'existe pas dans le catalogue local.");
    }
  }

  return errors;
}

export function createCommunityBuildExport(input: {
  characterId: string;
  element: CommunityBuildExport["element"];
  title: string;
  note: string;
  payload: CommunityBuildPayload;
}) {
  const title = input.title.trim().length >= 3 ? input.title.trim() : "Build DNA";
  const note = input.note.trim() ? input.note.trim() : null;

  return buildExportSchema.parse({
    schema: COMMUNITY_BUILD_EXPORT_SCHEMA,
    version: COMMUNITY_BUILD_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    characterId: input.characterId,
    element: input.element,
    title,
    note,
    payload: input.payload,
  });
}

export function validateCommunityBuildExport(
  candidate: unknown,
  options: BuilderOptions,
): ParseResult {
  const parsed = buildExportSchema.safeParse(candidate);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const optionErrors = validateAgainstOptions(parsed.data, options);
  if (optionErrors.length) {
    return { ok: false, errors: optionErrors };
  }

  return { ok: true, data: parsed.data };
}

export function serializeBuildJson(data: CommunityBuildExport) {
  return JSON.stringify(data, null, 2);
}

// --- Lien auto-portant : le build est encodé (base64url) dans l'URL, sans DB,
// pour le partager même non publié et sans compte. ---
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(param: string): string {
  const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeBuildParam(data: CommunityBuildExport): string {
  return toBase64Url(JSON.stringify(data));
}

export function decodeBuildParam(param: string, options: BuilderOptions): ParseResult {
  let text: string;
  try {
    text = fromBase64Url(param);
  } catch {
    return { ok: false, errors: ["Le lien de build n'est pas valide."] };
  }
  const sizeError = ensureReasonableImportSize(text);
  if (sizeError) return { ok: false, errors: [sizeError] };
  try {
    return validateCommunityBuildExport(JSON.parse(text), options);
  } catch {
    return { ok: false, errors: ["Le lien de build n'est pas valide."] };
  }
}

export function serializeBuildXml(data: CommunityBuildExport) {
  const document = window.document.implementation.createDocument("", "dnaCommunityBuild");
  const root = document.documentElement;
  root.setAttribute("schema", data.schema);
  root.setAttribute("version", String(data.version));

  const appendText = (name: string, value: string) => {
    const node = document.createElement(name);
    node.textContent = value;
    root.appendChild(node);
  };

  const character = document.createElement("character");
  character.setAttribute("id", data.characterId);
  if (data.element) {
    character.setAttribute("element", data.element);
  }
  root.appendChild(character);

  appendText("exportedAt", data.exportedAt);
  appendText("title", data.title);
  appendText("note", data.note ?? "");

  const payload = document.createElement("payload");
  payload.setAttribute("encoding", "json");
  payload.textContent = JSON.stringify(data.payload);
  root.appendChild(payload);

  return new XMLSerializer().serializeToString(document);
}

function ensureReasonableImportSize(text: string) {
  if (new Blob([text]).size > MAX_IMPORT_BYTES) {
    return "Le fichier importe est trop volumineux pour un build.";
  }

  return null;
}

export function parseBuildJsonText(text: string, options: BuilderOptions): ParseResult {
  const sizeError = ensureReasonableImportSize(text);
  if (sizeError) {
    return { ok: false, errors: [sizeError] };
  }

  try {
    return validateCommunityBuildExport(JSON.parse(text), options);
  } catch {
    return { ok: false, errors: ["Le fichier JSON n'est pas valide."] };
  }
}

export function parseBuildXmlText(text: string, options: BuilderOptions): ParseResult {
  const sizeError = ensureReasonableImportSize(text);
  if (sizeError) {
    return { ok: false, errors: [sizeError] };
  }

  const document = new DOMParser().parseFromString(text, "application/xml");
  if (document.querySelector("parsererror")) {
    return { ok: false, errors: ["Le fichier XML n'est pas valide."] };
  }

  const root = document.documentElement;
  if (
    root.localName !== "dnaCommunityBuild" ||
    root.getAttribute("schema") !== COMMUNITY_BUILD_EXPORT_SCHEMA ||
    root.getAttribute("version") !== String(COMMUNITY_BUILD_EXPORT_VERSION)
  ) {
    return { ok: false, errors: ["Le fichier XML n'est pas un export de build DNA valide."] };
  }

  const character = root.querySelector("character");
  const payloadText = root.querySelector("payload")?.textContent;
  if (!character?.getAttribute("id") || !payloadText) {
    return { ok: false, errors: ["Le fichier XML ne contient pas les donnees de build attendues."] };
  }

  try {
    return validateCommunityBuildExport(
      {
        schema: root.getAttribute("schema"),
        version: Number(root.getAttribute("version")),
        exportedAt: root.querySelector("exportedAt")?.textContent,
        characterId: character.getAttribute("id"),
        element: character.getAttribute("element") || null,
        title: root.querySelector("title")?.textContent,
        note: root.querySelector("note")?.textContent || null,
        payload: JSON.parse(payloadText),
      },
      options,
    );
  } catch {
    return { ok: false, errors: ["Le payload du fichier XML n'est pas valide."] };
  }
}
