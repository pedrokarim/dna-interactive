/**
 * Règles de progression du jeu appliquées aux objectifs : bornes, prérequis
 * implicites, et découpage en étapes chiffrées. Tout est pur.
 *
 * Règles tirées du code du jeu (cf. `research_data/extract-planner.ts`) :
 * - la percée k se fait au niveau `breaks[k-1].level` et lève le plafond au
 *   palier suivant (sans percée : plafond 20, après la 6ᵉ : 80) ;
 * - passer une compétence au niveau s exige `skills[i][s-2].breaks` percées ;
 * - le rang n d'un wedge coûte `modLevels[n-1][rareté]` ; au-delà de
 *   `maxLevel`, chaque rang est une étoile qui consomme des exemplaires.
 */
import {
  XP_KEYS,
  type BreakStep,
  type CharacterGoal,
  type CharacterProgression,
  type CharacterState,
  type Cost,
  type GoalStep,
  type PlanStep,
  type PlanWarning,
  type PlannerGoal,
  type ProgressionData,
  type WeaponGoal,
  type WedgeGoal,
} from "./types";

export const MIN_SKILL_LEVEL = 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

/** Plafond de niveau après `breaks` percées. */
export function levelCap(breaks: BreakStep[], count: number, maxLevel: number): number {
  return breaks[count]?.level ?? maxLevel;
}

/**
 * Percées possibles à un niveau donné : au niveau 25, la 1ʳᵉ est forcément
 * faite (plafond 20 sinon) ; au niveau 20, elle peut l'être ou non.
 */
export function breakRange(breaks: BreakStep[], level: number): [number, number] {
  const min = breaks.filter((b) => b.level < level).length;
  const max = breaks.filter((b) => b.level <= level).length;
  return [min, max];
}

export function skillMaxLevel(progression: CharacterProgression | undefined, index: number): number {
  const rows = progression?.skills[String(index)];
  return rows ? rows.length + 1 : MIN_SKILL_LEVEL;
}

/** Percées exigées pour porter la compétence `index` au niveau `level`. */
export function breaksForSkill(progression: CharacterProgression, index: number, level: number): number {
  const rows = progression.skills[String(index)] ?? [];
  let needed = 0;
  for (let s = MIN_SKILL_LEVEL + 1; s <= level; s++) needed = Math.max(needed, rows[s - 2]?.breaks ?? 0);
  return needed;
}

/** Ramène un état dans les bornes du jeu, en gardant niveau et percées cohérents. */
function clampLevelAndBreaks<T extends { level: number; breaks: number }>(state: T, breaks: BreakStep[], maxLevel: number): T {
  const level = clamp(state.level, 1, maxLevel);
  const [min, max] = breakRange(breaks, level);
  return { ...state, level, breaks: clamp(state.breaks, min, max) };
}

export function clampCharacterState(
  state: CharacterState,
  progression: CharacterProgression,
  maxLevel: number,
): CharacterState {
  const base = clampLevelAndBreaks(state, progression.breaks, maxLevel);
  const skills = state.skills.map((level, i) =>
    clamp(level, MIN_SKILL_LEVEL, skillMaxLevel(progression, i + 1)),
  ) as CharacterState["skills"];
  // Une compétence ne dépasse pas ce que les percées permettent.
  for (let i = 0; i < 3; i++) {
    while (skills[i] > MIN_SKILL_LEVEL && breaksForSkill(progression, i + 1, skills[i]) > base.breaks) skills[i]--;
  }
  return { ...base, skills, intron: clamp(state.intron, 0, progression.introns.length) };
}

/**
 * Objectif d'un perso remis d'aplomb : état actuel dans les bornes, cible au
 * moins égale à l'actuel, et prérequis relevés (compétence → percées →
 * niveau). On relève, on ne refuse jamais ; chaque relèvement est signalé.
 */
export function normalizeCharacterGoal(
  goal: CharacterGoal,
  data: ProgressionData,
): { goal: CharacterGoal; warnings: PlanWarning[] } {
  const progression = data.characters[String(goal.charId)];
  if (!progression) return { goal, warnings: [{ kind: "missingData", goalId: goal.id }] };
  const warnings: PlanWarning[] = [];
  const current = clampCharacterState(goal.current, progression, data.maxLevel);

  const skills = goal.target.skills.map((level, i) =>
    clamp(Math.max(level, current.skills[i]), MIN_SKILL_LEVEL, skillMaxLevel(progression, i + 1)),
  ) as CharacterState["skills"];
  let breaks = clamp(Math.max(goal.target.breaks, current.breaks), 0, progression.breaks.length);
  let level = clamp(Math.max(goal.target.level, current.level), 1, data.maxLevel);

  // Niveau visé au-delà du plafond : les percées suivent.
  breaks = Math.max(breaks, breakRange(progression.breaks, level)[0]);
  for (let i = 0; i < 3; i++) {
    const needed = breaksForSkill(progression, i + 1, skills[i]);
    if (needed > breaks) {
      breaks = needed;
      const neededLevel = progression.breaks[needed - 1]?.level ?? level;
      warnings.push({ kind: "raisedForSkill", goalId: goal.id, skill: i + 1, level: skills[i], breaks: needed });
      level = Math.max(level, neededLevel);
    }
  }
  // Une percée se fait au niveau de son palier.
  if (breaks > 0) level = Math.max(level, progression.breaks[breaks - 1].level);
  const intron = clamp(Math.max(goal.target.intron, current.intron), 0, progression.introns.length);

  return { goal: { ...goal, current, target: { level, breaks, skills, intron } }, warnings };
}

export function normalizeWeaponGoal(goal: WeaponGoal, data: ProgressionData): WeaponGoal {
  const progression = data.weapons[goal.targetId];
  if (!progression) return goal;
  const current = {
    ...clampLevelAndBreaks(goal.current, progression.breaks, data.maxLevel),
    refinement: clamp(goal.current.refinement, 0, progression.refinement.length),
  };
  let level = clamp(Math.max(goal.target.level, current.level), 1, data.maxLevel);
  let breaks = clamp(Math.max(goal.target.breaks, current.breaks), 0, progression.breaks.length);
  breaks = Math.max(breaks, breakRange(progression.breaks, level)[0]);
  if (breaks > 0) level = Math.max(level, progression.breaks[breaks - 1].level);
  const refinement = clamp(Math.max(goal.target.refinement, current.refinement), 0, progression.refinement.length);
  return { ...goal, current, target: { level, breaks, refinement } };
}

export function wedgeMaxRank(data: ProgressionData, targetId: string): number {
  const wedge = data.mods[targetId];
  return wedge ? wedge.maxLevel + wedge.starMax : 0;
}

export function normalizeWedgeGoal(goal: WedgeGoal, data: ProgressionData): WedgeGoal {
  const max = wedgeMaxRank(data, goal.targetId);
  const current = clamp(goal.current, 0, max);
  return { ...goal, copies: clamp(goal.copies, 1, 99), current, target: clamp(Math.max(goal.target, current), 0, max) };
}

export function normalizeGoal(goal: PlannerGoal, data: ProgressionData): { goal: PlannerGoal; warnings: PlanWarning[] } {
  if (goal.kind === "character") return normalizeCharacterGoal(goal, data);
  if (goal.kind === "weapon") return { goal: normalizeWeaponGoal(goal, data), warnings: [] };
  return { goal: normalizeWedgeGoal(goal, data), warnings: [] };
}

// ---------------------------------------------------------------------------
// Étapes
// ---------------------------------------------------------------------------

const scale = (costs: Cost[], factor: number): Cost[] => costs.map((c) => ({ key: c.key, num: c.num * factor }));

function xpBetween(curve: number[], from: number, to: number): number {
  let total = 0;
  for (let level = from; level < to; level++) total += curve[level - 1] ?? 0;
  return total;
}

/** Niveaux et percées entrelacés, dans l'ordre où le jeu les impose. */
function levelAndBreakSteps(
  current: { level: number; breaks: number },
  target: { level: number; breaks: number },
  breaks: BreakStep[],
  curve: number[],
  xpKey: string,
): RawStep[] {
  const steps: RawStep[] = [];
  let level = current.level;
  const pushLevel = (to: number) => {
    if (to <= level) return;
    steps.push({ id: `level-${to}`, step: { kind: "level", from: level, to }, costs: [{ key: xpKey, num: xpBetween(curve, level, to) }] });
    level = to;
  };
  for (let k = current.breaks; k < target.breaks; k++) {
    pushLevel(breaks[k].level);
    steps.push({ id: `break-${k + 1}`, step: { kind: "break", to: k + 1 }, costs: breaks[k].costs });
  }
  pushLevel(target.level);
  return steps;
}

/**
 * Ce que l'objectif garde en stock : l'arme elle-même, les exemplaires
 * équipés du wedge. Toujours compté, même déjà possédé, pour que ces
 * exemplaires ne soient pas pris pour les étoiles. L'étape « obtenir » n'a
 * donc pas de coût propre : elle dit seulement qu'il en manque.
 */
export function goalReserved(goal: PlannerGoal): Cost[] {
  if (goal.kind === "weapon") return [{ key: weaponKey(goal.targetId), num: 1 }];
  if (goal.kind === "wedge") return [{ key: wedgeKey(goal.targetId), num: goal.copies }];
  return [];
}

/**
 * Étapes restantes d'un objectif, chiffrées. `owned` lit le stock pour savoir
 * si une arme ou des exemplaires de wedge restent à obtenir.
 */
export function goalSteps(goal: PlannerGoal, data: ProgressionData, owned: (key: string) => number): GoalStep[] {
  return buildSteps(goal, data, owned).map((s) => ({ ...s, available: isAvailable(goal, s.step, data) }));
}

/** Une étape se valide dans l'ordre du jeu : jamais une percée avant son niveau. */
function isAvailable(goal: PlannerGoal, step: PlanStep, data: ProgressionData): boolean {
  if (step.kind === "acquire") return true;
  if (goal.kind === "wedge") return step.kind === "rank" && step.to === goal.current + 1;
  const breaks = goal.kind === "character" ? data.characters[String(goal.charId)]?.breaks : data.weapons[goal.targetId]?.breaks;
  // Un niveau ne dépasse pas le plafond des ascensions déjà faites.
  if (step.kind === "level") {
    return step.from === goal.current.level && step.to <= levelCap(breaks ?? [], goal.current.breaks, data.maxLevel);
  }
  if (step.kind === "break") {
    return step.to === goal.current.breaks + 1 && goal.current.level >= (breaks?.[step.to - 1]?.level ?? Infinity);
  }
  if (goal.kind === "character") {
    const progression = data.characters[String(goal.charId)];
    if (step.kind === "skill") {
      return (
        step.to === goal.current.skills[step.index - 1] + 1 &&
        Boolean(progression) &&
        breaksForSkill(progression, step.index, step.to) <= goal.current.breaks
      );
    }
    if (step.kind === "intron") return step.to === goal.current.intron + 1;
  }
  if (goal.kind === "weapon" && step.kind === "refine") return step.to === goal.current.refinement + 1;
  return false;
}

type RawStep = Omit<GoalStep, "available">;

function buildSteps(goal: PlannerGoal, data: ProgressionData, owned: (key: string) => number): RawStep[] {
  if (goal.kind === "character") {
    const progression = data.characters[String(goal.charId)];
    if (!progression) return [];
    const steps = levelAndBreakSteps(goal.current, goal.target, progression.breaks, data.characterXp, XP_KEYS.character);
    for (let i = 0; i < 3; i++) {
      const rows = progression.skills[String(i + 1)] ?? [];
      for (let to = goal.current.skills[i] + 1; to <= goal.target.skills[i]; to++) {
        const row = rows[to - 2];
        if (row) steps.push({ id: `skill-${i + 1}-${to}`, step: { kind: "skill", index: i + 1, to }, costs: row.costs });
      }
    }
    for (let to = goal.current.intron + 1; to <= goal.target.intron; to++) {
      steps.push({ id: `intron-${to}`, step: { kind: "intron", to }, costs: progression.introns[to - 1] ?? [] });
    }
    return steps;
  }

  if (goal.kind === "weapon") {
    const progression = data.weapons[goal.targetId];
    if (!progression) return [];
    const key = weaponKey(goal.targetId);
    const steps: RawStep[] = [];
    if (owned(key) < 1) steps.push({ id: "acquire", step: { kind: "acquire", count: 1 }, costs: [] });
    steps.push(...levelAndBreakSteps(goal.current, goal.target, progression.breaks, data.weaponXp, XP_KEYS.weapon));
    for (let to = goal.current.refinement + 1; to <= goal.target.refinement; to++) {
      steps.push({ id: `refine-${to}`, step: { kind: "refine", to }, costs: progression.refinement[to - 1] ?? [] });
    }
    return steps;
  }

  const wedge = data.mods[goal.targetId];
  if (!wedge) return [];
  const key = wedgeKey(goal.targetId);
  const steps: RawStep[] = [];
  const missingCopies = goal.copies - owned(key);
  if (missingCopies > 0) {
    steps.push({ id: "acquire", step: { kind: "acquire", count: missingCopies }, costs: [] });
  }
  for (let to = goal.current + 1; to <= goal.target; to++) {
    const star = to > wedge.maxLevel;
    const costs = scale(data.modLevels[to - 1]?.[String(wedge.rarity)] ?? [], goal.copies);
    if (star) costs.push({ key, num: (wedge.starCopies[to - wedge.maxLevel - 1] ?? 0) * goal.copies });
    steps.push({ id: `rank-${to}`, step: { kind: "rank", to, star }, costs: costs.filter((c) => c.num > 0) });
  }
  return steps;
}

/** Clés d'objet des cibles, à partir des ids du site. */
export const weaponKey = (siteId: string) => `weapon:${siteId.replace(/^weapons-/, "")}`;
export const wedgeKey = (siteId: string) => `mod:${siteId.replace(/^mods-/, "")}`;
