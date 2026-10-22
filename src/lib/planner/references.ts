import "server-only";
import progressionJson from "@/data/planner/progression.json";
import materialsJson from "@/data/planner/materials.json";
import { getCharacterById } from "@/lib/characters/catalog";
import type { PlannerGoal, PlannerState, ProgressionData } from "./types";

const progression = progressionJson as unknown as ProgressionData;
const materials = materialsJson as Record<string, unknown>;

/** Objet connu du jeu : catalogue extrait, ou arme / wedge planifiable. */
function isKnownMaterial(key: string): boolean {
  if (materials[key]) return true;
  const [prefix, id] = key.split(":");
  if (prefix === "weapon") return Boolean(progression.weapons[`weapons-${id}`]);
  if (prefix === "mod") return Boolean(progression.mods[`mods-${id}`]);
  return false;
}

function isKnownGoal(goal: PlannerGoal): boolean {
  if (goal.kind === "character") {
    return Boolean(progression.characters[String(goal.charId)]) && Boolean(getCharacterById(goal.targetId));
  }
  if (goal.kind === "weapon") return Boolean(progression.weapons[goal.targetId]);
  return Boolean(progression.mods[goal.targetId]);
}

/**
 * Contrôle référentiel, en plus du schéma : seuls des objectifs et des objets
 * qui existent dans les données du jeu sont gardés. On écarte l'entrée
 * inconnue au lieu de refuser tout le plan, pour qu'un objet retiré du jeu ne
 * rende pas un plan ancien impossible à enregistrer.
 */
export function keepKnownReferences(state: PlannerState): PlannerState {
  return {
    version: 1,
    goals: state.goals.filter(isKnownGoal),
    inventory: Object.fromEntries(Object.entries(state.inventory).filter(([key]) => isKnownMaterial(key))),
    craftChoices: Object.fromEntries(Object.entries(state.craftChoices).filter(([key]) => Boolean(progression.recipes[key]))),
  };
}
