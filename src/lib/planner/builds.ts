/**
 * Créer des objectifs, et traduire un build en objectifs. Pur, sans réseau :
 * le build arrive déjà résolu (`PlannerBuildInput`), officiel ou communautaire.
 */
import { MIN_SKILL_LEVEL, skillMaxLevel } from "./goals";
import type {
  CharacterGoal,
  CharacterState,
  GoalOrigin,
  PlannerCharacterOption,
  PlannerGoal,
  PlannerState,
  ProgressionData,
  WeaponGoal,
  WedgeGoal,
} from "./types";

/** Build réduit à ce que le plan en retient. */
export type PlannerBuildInput = {
  /** `official:<characterId>:<index>` ou `community:<uuid>`. */
  key: string;
  label: string;
  characterId: string;
  element: string | null;
  /** Priorité 1 à 5 par emplacement de compétence. */
  skillPriority: { skillIndex: number; priority: number }[];
  /** Armes classées « meilleur choix ». */
  weapons: string[];
  alternativeWeapons: string[];
  /** Wedges du personnage : wedge → nombre d'emplacements qu'il occupe. */
  wedges: Record<string, number>;
  /**
   * Wedges posés sur une arme, par arme. Comptés au nom de l'arme et non du
   * build : le build d'un perso et le build de Demon Wedges de la même arme
   * désignent les mêmes exemplaires, ils ne s'additionnent pas.
   */
  weaponWedges?: Record<string, Record<string, number>>;
};

/** Build proposé dans le planificateur, avant résolution (`/api/planner/builds`). */
export type PlannerBuildOption = {
  key: string;
  label: string;
  kind: "official" | "community" | "weapon";
  votes?: number;
  legacy?: boolean;
};

export const EMPTY_PLANNER: PlannerState = { version: 1, goals: [], inventory: {}, craftChoices: {} };

export function newGoalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const START_CHARACTER: CharacterState = { level: 1, breaks: 0, skills: [1, 1, 1], intron: 0 };

/**
 * Niveau de compétence visé selon la priorité du build. Proposition du
 * cadrage (section 6), modifiable objectif par objectif : 5 → max, 4 → 8,
 * 3 → 6, 2 → 4, 1 → inchangé.
 */
export function skillTargetForPriority(priority: number, max: number, current: number): number {
  const byPriority: Record<number, number> = { 5: max, 4: 8, 3: 6, 2: 4 };
  return Math.min(max, Math.max(current, byPriority[priority] ?? current));
}

export function characterGoal(
  option: PlannerCharacterOption,
  elementKey: string | null,
  data: ProgressionData,
): CharacterGoal | null {
  const element = option.elements.find((e) => e.key === elementKey) ?? option.elements[0];
  if (!element || !data.characters[String(element.charId)]) return null;
  const progression = data.characters[String(element.charId)];
  return {
    id: newGoalId(),
    kind: "character",
    targetId: option.id,
    element: element.key,
    charId: element.charId,
    current: START_CHARACTER,
    target: { level: data.maxLevel, breaks: progression.breaks.length, skills: [1, 1, 1], intron: 0 },
  };
}

export function weaponGoal(targetId: string, data: ProgressionData): WeaponGoal | null {
  const progression = data.weapons[targetId];
  if (!progression) return null;
  return {
    id: newGoalId(),
    kind: "weapon",
    targetId,
    current: { level: 1, breaks: 0, refinement: 0 },
    target: { level: data.maxLevel, breaks: progression.breaks.length, refinement: 0 },
  };
}

/** Rang visé par défaut : le maximum sans étoile, les étoiles coûtant des exemplaires. */
export function wedgeGoal(targetId: string, copies: number, data: ProgressionData): WedgeGoal | null {
  const wedge = data.mods[targetId];
  if (!wedge) return null;
  return { id: newGoalId(), kind: "wedge", targetId, copies: Math.max(1, copies), current: 0, target: wedge.maxLevel };
}

const sameTarget = (a: PlannerGoal, b: PlannerGoal) =>
  a.kind === b.kind &&
  a.targetId === b.targetId &&
  (a.kind !== "character" || (b.kind === "character" && a.charId === b.charId));

const addOrigin = (origins: GoalOrigin[] | undefined, origin: GoalOrigin) =>
  origins?.some((o) => o.buildKey === origin.buildKey) ? origins : [...(origins ?? []), origin];

/**
 * Exemplaires d'un wedge : le maximum entre les builds d'un même perso (on
 * n'en équipe qu'un à la fois), la somme entre persos différents.
 */
export function copiesFromDemand(demand: WedgeGoal["demand"]): number {
  const byCharacter = new Map<string, number>();
  for (const { characterId, count } of Object.values(demand ?? {})) {
    byCharacter.set(characterId, Math.max(byCharacter.get(characterId) ?? 0, count));
  }
  return [...byCharacter.values()].reduce((a, b) => a + b, 0);
}

/** Objectifs proposés pour un build, avant confirmation. */
export function goalsFromBuild(
  build: PlannerBuildInput,
  option: PlannerCharacterOption | undefined,
  data: ProgressionData,
): PlannerGoal[] {
  const origin: GoalOrigin = { buildKey: build.key, label: build.label };
  const goals: PlannerGoal[] = [];

  const character = option ? characterGoal(option, build.element, data) : null;
  if (character) {
    const progression = data.characters[String(character.charId)];
    const skills = [...character.target.skills] as CharacterState["skills"];
    for (const { skillIndex, priority } of build.skillPriority) {
      if (skillIndex < 1 || skillIndex > 3) continue;
      const max = skillMaxLevel(progression, skillIndex);
      skills[skillIndex - 1] = skillTargetForPriority(priority, max, MIN_SKILL_LEVEL);
    }
    goals.push({ ...character, target: { ...character.target, skills }, origins: [origin] });
  }

  for (const weaponId of build.weapons) {
    const goal = weaponGoal(weaponId, data);
    if (goal) goals.push({ ...goal, origins: [origin] });
  }

  // Une demande par porteur (le perso, ou chaque arme) : `copiesFromDemand`
  // prend le maximum par porteur et additionne les porteurs.
  const demands = new Map<string, NonNullable<WedgeGoal["demand"]>>();
  const addDemand = (wedgeId: string, demandKey: string, owner: string, count: number) => {
    const demand = demands.get(wedgeId) ?? {};
    demand[demandKey] = { characterId: owner, count };
    demands.set(wedgeId, demand);
  };
  for (const [wedgeId, count] of Object.entries(build.wedges)) addDemand(wedgeId, build.key, build.characterId, count);
  for (const [weaponId, wedges] of Object.entries(build.weaponWedges ?? {})) {
    for (const [wedgeId, count] of Object.entries(wedges)) addDemand(wedgeId, `${build.key}#${weaponId}`, weaponId, count);
  }
  for (const [wedgeId, demand] of demands) {
    const goal = wedgeGoal(wedgeId, copiesFromDemand(demand), data);
    if (goal) goals.push({ ...goal, origins: [origin], demand });
  }
  return goals;
}

/**
 * Ajoute des objectifs au plan sans jamais créer de doublon : un objectif déjà
 * présent garde son état actuel, et sa cible est relevée si la nouvelle est
 * plus haute.
 */
export function mergeGoals(existing: PlannerGoal[], incoming: PlannerGoal[]): PlannerGoal[] {
  const goals = [...existing];
  for (const goal of incoming) {
    const index = goals.findIndex((g) => sameTarget(g, goal));
    if (index < 0) {
      goals.push(goal);
      continue;
    }
    const current = goals[index];
    const origins = goal.origins?.reduce((acc, o) => addOrigin(acc, o), current.origins) ?? current.origins;
    if (current.kind === "character" && goal.kind === "character") {
      goals[index] = {
        ...current,
        origins,
        target: {
          level: Math.max(current.target.level, goal.target.level),
          breaks: Math.max(current.target.breaks, goal.target.breaks),
          skills: current.target.skills.map((s, i) => Math.max(s, goal.target.skills[i])) as CharacterState["skills"],
          intron: Math.max(current.target.intron, goal.target.intron),
        },
      };
    } else if (current.kind === "weapon" && goal.kind === "weapon") {
      goals[index] = {
        ...current,
        origins,
        target: {
          level: Math.max(current.target.level, goal.target.level),
          breaks: Math.max(current.target.breaks, goal.target.breaks),
          refinement: Math.max(current.target.refinement, goal.target.refinement),
        },
      };
    } else if (current.kind === "wedge" && goal.kind === "wedge") {
      const demand = { ...current.demand, ...goal.demand };
      goals[index] = {
        ...current,
        origins,
        demand,
        copies: Math.max(current.copies, copiesFromDemand(demand)),
        target: Math.max(current.target, goal.target),
      };
    }
  }
  return goals;
}

/**
 * Retire un build du plan : ce qu'il a seul apporté disparaît, ce qu'un autre
 * build ou le joueur utilise encore reste (seule l'étiquette part).
 */
export function removeBuild(goals: PlannerGoal[], buildKey: string): PlannerGoal[] {
  const out: PlannerGoal[] = [];
  for (const goal of goals) {
    if (!goal.origins?.some((o) => o.buildKey === buildKey)) {
      out.push(goal);
      continue;
    }
    const origins = goal.origins.filter((o) => o.buildKey !== buildKey);
    if (origins.length === 0) continue;
    if (goal.kind === "wedge" && goal.demand) {
      const demand = { ...goal.demand };
      // La part du perso (`<build>`) et celles de ses armes (`<build>#<arme>`).
      for (const key of Object.keys(demand)) if (key === buildKey || key.startsWith(`${buildKey}#`)) delete demand[key];
      out.push({ ...goal, origins, demand, copies: Math.max(1, copiesFromDemand(demand)) });
    } else {
      out.push({ ...goal, origins });
    }
  }
  return out;
}

/** Builds présents dans le plan, pour les lister et les retirer d'un clic. */
export function buildsInPlan(goals: PlannerGoal[]): GoalOrigin[] {
  const seen = new Map<string, GoalOrigin>();
  for (const goal of goals) for (const origin of goal.origins ?? []) seen.set(origin.buildKey, origin);
  return [...seen.values()];
}

/**
 * Fusion de deux plans (navigateur et compte) sans rien perdre : objectifs
 * réunis sans doublon (cibles relevées au plus haut), stock au maximum des
 * deux, choix de forge du plan `preferred` en cas de désaccord.
 */
export function mergePlans(base: PlannerState, preferred: PlannerState): PlannerState {
  const inventory = { ...base.inventory };
  for (const [key, value] of Object.entries(preferred.inventory)) inventory[key] = Math.max(inventory[key] ?? 0, value);
  // Un même objectif avancé sur deux appareils : on garde l'état le plus avancé.
  const goals = mergeGoals(base.goals, preferred.goals).map((goal) => {
    const other = preferred.goals.find((g) => sameTarget(g, goal));
    if (!other || other.id === goal.id) return goal;
    if (goal.kind === "character" && other.kind === "character") {
      const c = goal.current;
      const o = other.current;
      return {
        ...goal,
        current: {
          level: Math.max(c.level, o.level),
          breaks: Math.max(c.breaks, o.breaks),
          skills: c.skills.map((s, i) => Math.max(s, o.skills[i])) as CharacterState["skills"],
          intron: Math.max(c.intron, o.intron),
        },
      };
    }
    if (goal.kind === "weapon" && other.kind === "weapon") {
      const c = goal.current;
      const o = other.current;
      return {
        ...goal,
        current: { level: Math.max(c.level, o.level), breaks: Math.max(c.breaks, o.breaks), refinement: Math.max(c.refinement, o.refinement) },
      };
    }
    if (goal.kind === "wedge" && other.kind === "wedge") return { ...goal, current: Math.max(goal.current, other.current) };
    return goal;
  });
  return {
    version: 1,
    goals,
    inventory,
    craftChoices: { ...base.craftChoices, ...preferred.craftChoices },
  };
}

export const isEmptyPlan = (plan: PlannerState) =>
  plan.goals.length === 0 && Object.keys(plan.inventory).length === 0;
