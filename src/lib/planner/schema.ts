/**
 * Forme valide d'un plan, bornée. Sert à relire le `localStorage` (qui peut
 * être corrompu ou d'une ancienne version) et à valider ce qu'un client envoie
 * au serveur. Le contrôle référentiel (ids connus du jeu) vient en plus, côté
 * serveur.
 */
import { z } from "zod";
import { EMPTY_PLANNER } from "./builds";
import type { PlannerState } from "./types";

export const MAX_GOALS = 40;
export const MAX_INVENTORY_ENTRIES = 600;
/** Au-delà des plafonds du jeu (crédits compris) : rejette les valeurs absurdes. */
export const MAX_QUANTITY = 10_000_000_000;

const id = z.string().trim().min(1).max(80);
const materialKey = z.string().regex(/^(res|mod|draft|weapon):\d{1,9}$/);
const level = z.number().int().min(1).max(100);
const small = z.number().int().min(0).max(20);

const origin = z.object({ buildKey: z.string().max(120), label: z.string().max(160) });
const base = {
  id: z.string().min(1).max(64),
  paused: z.boolean().optional(),
  origins: z.array(origin).max(20).optional(),
};

const characterState = z.object({
  level,
  breaks: small,
  skills: z.tuple([small, small, small]),
  intron: small,
});
const weaponState = z.object({ level, breaks: small, refinement: small });

export const plannerGoalSchema = z.discriminatedUnion("kind", [
  z.object({
    ...base,
    kind: z.literal("character"),
    targetId: id,
    element: z.string().max(20).nullable(),
    charId: z.number().int().min(1).max(9_999_999),
    current: characterState,
    target: characterState,
  }),
  z.object({ ...base, kind: z.literal("weapon"), targetId: id, current: weaponState, target: weaponState }),
  z.object({
    ...base,
    kind: z.literal("wedge"),
    targetId: id,
    copies: z.number().int().min(1).max(99),
    current: small,
    target: small,
    demand: z.record(z.string().max(120), z.object({ characterId: id, count: z.number().int().min(1).max(20) })).optional(),
  }),
]);

export const plannerStateSchema = z.object({
  version: z.literal(1),
  goals: z.array(plannerGoalSchema).max(MAX_GOALS),
  inventory: z
    .record(materialKey, z.number().int().min(0).max(MAX_QUANTITY))
    .refine((v) => Object.keys(v).length <= MAX_INVENTORY_ENTRIES, "Stock trop grand."),
  craftChoices: z
    .record(materialKey, z.enum(["farm", "craft"]))
    .refine((v) => Object.keys(v).length <= MAX_INVENTORY_ENTRIES, "Trop de choix."),
});

/**
 * Plan relu sans jamais planter : une entrée invalide est écartée, pas tout le
 * plan. Un plan illisible donne un plan vide, jamais une exception.
 */
export function readPlannerState(raw: unknown): PlannerState {
  const whole = plannerStateSchema.safeParse(raw);
  if (whole.success) return whole.data;
  if (!raw || typeof raw !== "object") return EMPTY_PLANNER;
  const value = raw as Record<string, unknown>;
  const goals = Array.isArray(value.goals)
    ? value.goals.flatMap((g) => {
        const parsed = plannerGoalSchema.safeParse(g);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
  const pickRecord = <T>(source: unknown, check: (key: string, v: unknown) => v is T) =>
    Object.fromEntries(
      Object.entries(source && typeof source === "object" ? source : {}).filter(([k, v]) => check(k, v)),
    ) as Record<string, T>;
  const inventory = pickRecord(
    value.inventory,
    (k, v): v is number =>
      materialKey.safeParse(k).success && typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_QUANTITY,
  );
  const craftChoices = pickRecord(
    value.craftChoices,
    (k, v): v is "farm" | "craft" => materialKey.safeParse(k).success && (v === "farm" || v === "craft"),
  );
  return { version: 1, goals: goals.slice(0, MAX_GOALS), inventory, craftChoices };
}
