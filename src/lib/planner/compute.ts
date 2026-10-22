/**
 * Calcul du plan : objectifs → besoins → fabrication éventuelle → moins le
 * stock → reste à farmer → regroupé par source. Fonction pure : même entrée,
 * même sortie, sans réseau ni base. Cadrage : `docs/cadrage-planificateur-farm.md`.
 */
import { goalReserved, goalSteps, normalizeGoal, weaponKey, wedgeKey } from "./goals";
import {
  XP_KEYS,
  type CraftChoice,
  type GoalProgress,
  type MaterialKey,
  type MaterialLine,
  type PlanResult,
  type PlanWarning,
  type PlannerGoal,
  type PlannerSources,
  type PlannerState,
  type ProgressionData,
  type SourceGroup,
  type XpPool,
} from "./types";

/** Profondeur de fabrication : pièce → sous-pièce → … ; le jeu n'en a que trois. */
const MAX_CRAFT_DEPTH = 6;

type PlanInput = { progression: ProgressionData; sources: Pick<PlannerSources, "byMaterial"> };

const xpPoolOf = (key: MaterialKey): XpPool | null =>
  key === XP_KEYS.character ? "character" : key === XP_KEYS.weapon ? "weapon" : null;

const xpItemsOf = (data: ProgressionData, pool: XpPool) =>
  pool === "character" ? data.characterXpItems : data.weaponXpItems;

/** Stock nettoyé : entiers positifs uniquement. */
function cleanInventory(inventory: Record<MaterialKey, number>): Map<MaterialKey, number> {
  const pool = new Map<MaterialKey, number>();
  for (const [key, value] of Object.entries(inventory)) {
    const n = Math.floor(Number(value));
    if (Number.isFinite(n) && n > 0) pool.set(key, n);
  }
  return pool;
}

/** XP disponible : la somme des objets d'XP du stock. */
function xpAvailable(pool: Map<MaterialKey, number>, data: ProgressionData, xpPool: XpPool): number {
  return xpItemsOf(data, xpPool).reduce((sum, item) => sum + (pool.get(item.key) ?? 0) * item.xp, 0);
}

/**
 * Fabriquer ou farmer ? Le choix du joueur d'abord ; à défaut, on fabrique ce
 * qu'aucun donjon ne donne (armes, pièces d'arme, la plupart des produits de forge).
 */
export function shouldCraft(
  key: MaterialKey,
  input: PlanInput,
  choices: Record<MaterialKey, CraftChoice>,
): boolean {
  if (!input.progression.recipes[key]) return false;
  const choice = choices[key];
  if (choice) return choice === "craft";
  return (input.sources.byMaterial[key]?.activities.length ?? 0) === 0;
}

function goalNeeds(goal: PlannerGoal, data: ProgressionData, owned: (key: MaterialKey) => number) {
  const steps = goalSteps(goal, data, owned);
  const needs = new Map<MaterialKey, number>();
  for (const cost of [...goalReserved(goal), ...steps.flatMap((s) => s.costs)]) {
    if (cost.num > 0) needs.set(cost.key, (needs.get(cost.key) ?? 0) + cost.num);
  }
  return { steps, needs };
}

export function computePlan(state: PlannerState, input: PlanInput): PlanResult {
  const data = input.progression;
  const inventory = cleanInventory(state.inventory);
  const owned = (key: MaterialKey) => inventory.get(key) ?? 0;
  const warnings: PlanWarning[] = [];

  const goals = state.goals.map((goal) => {
    const normalized = normalizeGoal(goal, data);
    warnings.push(...normalized.warnings);
    return normalized.goal;
  });
  const perGoal = goals.map((goal) => ({ goal, ...goalNeeds(goal, data, owned) }));

  // 1. Besoins agrégés des objectifs actifs.
  const lines = new Map<MaterialKey, MaterialLine>();
  const line = (key: MaterialKey) => {
    let l = lines.get(key);
    if (!l) {
      l = {
        key,
        required: 0,
        owned: 0,
        crafted: 0,
        missing: 0,
        craftable: Boolean(data.recipes[key]),
        crafting: false,
        usedBy: [],
        forCrafting: [],
      };
      lines.set(key, l);
    }
    return l;
  };
  const required = new Map<MaterialKey, number>();
  for (const { goal, needs } of perGoal) {
    if (goal.paused) continue;
    for (const [key, num] of needs) {
      required.set(key, (required.get(key) ?? 0) + num);
      const usedBy = line(key).usedBy;
      if (!usedBy.includes(goal.id)) usedBy.push(goal.id);
    }
  }

  // 2. Stock, puis fabrication. File d'attente en largeur : tous les besoins
  // directs se servent dans le stock avant les ingrédients des fabrications.
  const pool = new Map(inventory);
  const xpLeft: Record<XpPool, number> = {
    character: xpAvailable(pool, data, "character"),
    weapon: xpAvailable(pool, data, "weapon"),
  };
  const take = (key: MaterialKey, qty: number) => {
    const xp = xpPoolOf(key);
    if (xp) {
      const used = Math.min(xpLeft[xp], qty);
      xpLeft[xp] -= used;
      return used;
    }
    const used = Math.min(pool.get(key) ?? 0, qty);
    pool.set(key, (pool.get(key) ?? 0) - used);
    return used;
  };

  type Job = { key: MaterialKey; qty: number; parent: MaterialKey | null; path: MaterialKey[] };
  const queue: Job[] = [...required].map(([key, qty]) => ({ key, qty, parent: null, path: [] }));
  while (queue.length > 0) {
    const { key, qty, parent, path } = queue.shift()!;
    const l = line(key);
    l.required += qty;
    if (parent && !l.forCrafting.includes(parent)) l.forCrafting.push(parent);
    const used = take(key, qty);
    l.owned += used;
    const short = qty - used;
    if (short <= 0) continue;

    const recipe = data.recipes[key];
    const canCraft = recipe && !path.includes(key) && path.length < MAX_CRAFT_DEPTH && shouldCraft(key, input, state.craftChoices);
    if (!canCraft) {
      l.missing += short;
      continue;
    }
    const crafts = Math.ceil(short / Math.max(1, recipe.quantity));
    l.crafted += short;
    l.crafting = true;
    const nextPath = [...path, key];
    for (const ingredient of recipe.ingredients) {
      queue.push({ key: ingredient.key, qty: ingredient.num * crafts, parent: key, path: nextPath });
    }
    queue.push({ key: recipe.draft, qty: crafts, parent: key, path: nextPath });
  }

  // 3. Progression par objectif : le stock va d'abord au premier de la liste.
  const allocation = new Map(inventory);
  const xpAllocation: Record<XpPool, number> = {
    character: xpAvailable(allocation, data, "character"),
    weapon: xpAvailable(allocation, data, "weapon"),
  };
  const byGoal: Record<string, GoalProgress> = {};
  for (const { goal, steps, needs } of perGoal) {
    let ratioSum = 0;
    let ready = true;
    for (const [key, need] of needs) {
      const xp = xpPoolOf(key);
      const available = xp ? xpAllocation[xp] : allocation.get(key) ?? 0;
      const used = Math.min(available, need);
      if (!goal.paused) {
        if (xp) xpAllocation[xp] -= used;
        else allocation.set(key, available - used);
      }
      ratioSum += used / need;
      if (used < need) ready = false;
    }
    byGoal[goal.id] = { ratio: needs.size === 0 ? 1 : ratioSum / needs.size, ready, steps };
  }

  const sortedLines = [...lines.values()].sort(
    (a, b) => Number(b.missing > 0) - Number(a.missing > 0) || b.missing / b.required - a.missing / a.required,
  );

  return { lines: sortedLines, byGoal, sources: groupSources(sortedLines, input), warnings };
}

/** Objet dont on lit les sources : un objet d'XP pour une réserve d'XP. */
function sourceKey(key: MaterialKey, data: ProgressionData): MaterialKey {
  const xp = xpPoolOf(key);
  return xp ? xpItemsOf(data, xp)[0]?.key ?? key : key;
}

/** Catégories trop vagues pour guider seules (« Mission » sans précision). */
const VAGUE_ACCESS = new Set(["Dungeon"]);

/**
 * Où farmer : couverture gloutonne. On prend l'activité qui couvre le plus de
 * manques, on les retire, on recommence. Ce qu'aucun donjon ne donne passe
 * par les catégories de source du jeu (boutique, mandats scellés…).
 */
function groupSources(lines: MaterialLine[], input: PlanInput): SourceGroup[] {
  const missing = lines.filter((l) => l.missing > 0).map((l) => l.key);
  const groups: SourceGroup[] = [];
  const sourcesOf = (key: MaterialKey) => input.sources.byMaterial[sourceKey(key, input.progression)];

  const cover = (keys: MaterialKey[], candidatesOf: (key: MaterialKey) => string[], kind: "activity" | "access") => {
    let remaining = keys.filter((k) => candidatesOf(k).length > 0);
    const rest = keys.filter((k) => candidatesOf(k).length === 0);
    while (remaining.length > 0) {
      const counts = new Map<string, number>();
      for (const key of remaining) for (const id of candidatesOf(key)) counts.set(id, (counts.get(id) ?? 0) + 1);
      const [best] = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      const covered = remaining.filter((k) => candidatesOf(k).includes(best));
      groups.push({ kind, id: best, keys: covered });
      remaining = remaining.filter((k) => !covered.includes(k));
    }
    return rest;
  };

  const withoutActivity = cover(missing, (k) => sourcesOf(k)?.activities ?? [], "activity");
  const unknown = cover(
    withoutActivity,
    (k) => {
      const access = sourcesOf(k)?.access ?? [];
      const precise = access.filter((a) => !VAGUE_ACCESS.has(a));
      return precise.length > 0 ? precise : access;
    },
    "access",
  );
  if (unknown.length > 0) groups.push({ kind: "unknown", keys: unknown });
  return groups;
}

// ---------------------------------------------------------------------------
// Valider une étape
// ---------------------------------------------------------------------------

/**
 * Retire de l'XP du stock : les plus gros objets d'abord, puis le plus petit
 * qui suffit pour finir. Le joueur corrige si son usage a été différent.
 */
function consumeXp(inventory: Record<MaterialKey, number>, data: ProgressionData, xp: XpPool, amount: number) {
  const items = xpItemsOf(data, xp);
  let left = amount;
  for (const item of items) {
    const use = Math.min(inventory[item.key] ?? 0, Math.floor(left / item.xp));
    if (use > 0) inventory[item.key] = (inventory[item.key] ?? 0) - use;
    left -= use * item.xp;
  }
  for (const item of [...items].reverse()) {
    while (left > 0 && (inventory[item.key] ?? 0) > 0) {
      inventory[item.key] -= 1;
      left -= item.xp;
    }
  }
}

function subtract(inventory: Record<MaterialKey, number>, key: MaterialKey, num: number) {
  if (!inventory[key]) return;
  inventory[key] = Math.max(0, inventory[key] - num);
  if (inventory[key] === 0) delete inventory[key];
}

/**
 * « Fait » : l'objectif avance ET le coût de l'étape sort du stock, puisque le
 * jeu l'a consommé. Sans le second point, un matériau serait compté deux fois.
 * Une étape indisponible (hors de l'ordre du jeu) ne change rien.
 */
export function applyStep(state: PlannerState, goalId: string, stepId: string, input: PlanInput): PlannerState {
  const data = input.progression;
  const index = state.goals.findIndex((g) => g.id === goalId);
  if (index < 0) return state;
  const goal = normalizeGoal(state.goals[index], data).goal;
  const inventory = { ...state.inventory };
  const owned = (key: MaterialKey) => Math.max(0, inventory[key] ?? 0);
  const step = goalSteps(goal, data, owned).find((s) => s.id === stepId);
  if (!step || !step.available) return state;

  for (const cost of step.costs) {
    const xp = xpPoolOf(cost.key);
    if (xp) consumeXp(inventory, data, xp, cost.num);
    else subtract(inventory, cost.key, cost.num);
  }

  let next: PlannerGoal = goal;
  const s = step.step;
  if (s.kind === "acquire" && goal.kind !== "character") {
    const key = goal.kind === "weapon" ? weaponKey(goal.targetId) : wedgeKey(goal.targetId);
    const want = goal.kind === "weapon" ? 1 : goal.copies;
    const gained = Math.max(0, want - owned(key));
    // Fabriqué : les ingrédients d'une fabrication sont partis aussi.
    const recipe = data.recipes[key];
    if (recipe && gained > 0 && shouldCraft(key, input, state.craftChoices)) {
      const crafts = Math.ceil(gained / Math.max(1, recipe.quantity));
      for (const ingredient of recipe.ingredients) subtract(inventory, ingredient.key, ingredient.num * crafts);
      subtract(inventory, recipe.draft, crafts);
    }
    inventory[key] = Math.max(owned(key), want);
  } else if (goal.kind === "wedge" && s.kind === "rank") {
    next = { ...goal, current: s.to };
  } else if (goal.kind === "weapon") {
    if (s.kind === "level") next = { ...goal, current: { ...goal.current, level: s.to } };
    if (s.kind === "break") next = { ...goal, current: { ...goal.current, breaks: s.to } };
    if (s.kind === "refine") next = { ...goal, current: { ...goal.current, refinement: s.to } };
  } else if (goal.kind === "character") {
    if (s.kind === "level") next = { ...goal, current: { ...goal.current, level: s.to } };
    if (s.kind === "break") next = { ...goal, current: { ...goal.current, breaks: s.to } };
    if (s.kind === "intron") next = { ...goal, current: { ...goal.current, intron: s.to } };
    if (s.kind === "skill") {
      const skills = [...goal.current.skills] as typeof goal.current.skills;
      skills[s.index - 1] = s.to;
      next = { ...goal, current: { ...goal.current, skills } };
    }
  }

  const goals = [...state.goals];
  goals[index] = next;
  return { ...state, goals, inventory };
}

/** Un objectif est atteint quand il ne reste aucune étape. */
export function isGoalComplete(progress: GoalProgress | undefined): boolean {
  return Boolean(progress) && progress!.steps.length === 0;
}
