import { describe, expect, it } from "vitest";
import progressionJson from "@/data/planner/progression.json";
import sourcesJson from "@/data/planner/sources.json";
import { applyStep, computePlan } from "./compute";
import { copiesFromDemand, goalsFromBuild, mergeGoals, mergePlans, removeBuild, type PlannerBuildInput } from "./builds";
import { readPlannerState } from "./schema";
import { CREDITS_KEY, XP_KEYS, type PlannerCharacterOption, type PlannerGoal, type PlannerState, type ProgressionData } from "./types";

const progression = progressionJson as unknown as ProgressionData;
const input = { progression, sources: sourcesJson as unknown as { byMaterial: Record<string, { activities: string[]; access: string[] }> } };

// L'Étranger (`char-aote`, charId 5102) : coûts relus dans `CharBreak`.
const AOTE = 5102;
const AOTE_BREAK_CREDITS = 4160 + 8320 + 13040 + 27760 + 65280 + 194400;

const state = (goals: PlannerGoal[], inventory: Record<string, number> = {}): PlannerState => ({
  version: 1,
  goals,
  inventory,
  craftChoices: {},
});

const aote = (patch: Partial<Extract<PlannerGoal, { kind: "character" }>> = {}): PlannerGoal => ({
  id: "aote",
  kind: "character",
  targetId: "char-aote",
  element: null,
  charId: AOTE,
  current: { level: 1, breaks: 0, skills: [1, 1, 1], intron: 0 },
  target: { level: 80, breaks: 6, skills: [1, 1, 1], intron: 0 },
  ...patch,
});

const lineOf = (result: ReturnType<typeof computePlan>, key: string) => result.lines.find((l) => l.key === key);

describe("personnage", () => {
  it("additionne l'XP de 1 à 80 et les crédits des six percées", () => {
    const result = computePlan(state([aote()]), input);
    const xpTotal = progression.characterXp.reduce((a, b) => a + b, 0);
    expect(lineOf(result, XP_KEYS.character)?.required).toBe(xpTotal);
    expect(lineOf(result, CREDITS_KEY)?.required).toBe(AOTE_BREAK_CREDITS);
    // Ordre du jeu : niveau 1 → 20, percée 1, niveau 20 → 30…
    const steps = result.byGoal.aote.steps.map((s) => s.id);
    expect(steps.slice(0, 4)).toEqual(["level-20", "break-1", "level-30", "break-2"]);
    expect(steps.at(-1)).toBe("level-80");
  });

  it("relève percées et niveau quand une compétence l'exige", () => {
    const goal = aote({ target: { level: 1, breaks: 0, skills: [10, 1, 1], intron: 0 } });
    const result = computePlan(state([goal]), input);
    expect(result.warnings).toContainEqual(expect.objectContaining({ kind: "raisedForSkill", skill: 1, breaks: 6 }));
    const ids = result.byGoal.aote.steps.map((s) => s.id);
    expect(ids).toContain("break-6");
    expect(ids).toContain("skill-1-10");
  });

  it("déduit le stock, et l'XP se lit dans les objets d'XP", () => {
    const xpItem = progression.characterXpItems[0];
    const result = computePlan(state([aote()], { [CREDITS_KEY]: 12_960, [xpItem.key]: 10 }), input);
    const credits = lineOf(result, CREDITS_KEY)!;
    expect(credits.owned).toBe(12_960);
    expect(credits.missing).toBe(AOTE_BREAK_CREDITS - 12_960);
    expect(lineOf(result, XP_KEYS.character)?.owned).toBe(10 * xpItem.xp);
  });

  it("« Fait » sur une percée avance l'objectif et vide le stock d'autant", () => {
    const first = progression.characters[String(AOTE)].breaks[0];
    const inventory = Object.fromEntries(first.costs.map((c) => [c.key, c.num + 3]));
    const start = state([aote({ current: { level: 20, breaks: 0, skills: [1, 1, 1], intron: 0 } })], inventory);
    const after = applyStep(start, "aote", "break-1", input);
    const goal = after.goals[0] as Extract<PlannerGoal, { kind: "character" }>;
    expect(goal.current.breaks).toBe(1);
    for (const cost of first.costs) expect(after.inventory[cost.key]).toBe(3);
  });

  it("refuse une étape hors de l'ordre du jeu", () => {
    const start = state([aote()]);
    expect(applyStep(start, "aote", "break-1", input)).toBe(start);
    // Niveau 20 atteint : l'ascension 1 passe avant le niveau 30.
    const at20 = applyStep(start, "aote", "level-20", input);
    const steps = computePlan(at20, input).byGoal.aote.steps;
    expect(steps.find((s) => s.id === "break-1")?.available).toBe(true);
    expect(steps.find((s) => s.id === "level-30")?.available).toBe(false);
  });
});

describe("arme et Demon Wedge", () => {
  it("fabrique une arme non possédée : plan, pièces et crédits de forge", () => {
    const goal: PlannerGoal = {
      id: "w",
      kind: "weapon",
      targetId: "weapons-20503",
      current: { level: 1, breaks: 0, refinement: 0 },
      target: { level: 1, breaks: 0, refinement: 0 },
    };
    const result = computePlan(state([goal]), input);
    const weapon = lineOf(result, "weapon:20503")!;
    expect(weapon.crafting).toBe(true);
    expect(weapon.missing).toBe(0);
    expect(lineOf(result, "draft:9526")?.missing).toBe(1);
    expect(lineOf(result, "res:3000013")?.forCrafting).toEqual(["weapon:20503"]);
    expect(lineOf(result, CREDITS_KEY)?.required).toBe(70_000);
  });

  it("une arme déjà possédée ne coûte plus sa fabrication", () => {
    const goal: PlannerGoal = {
      id: "w",
      kind: "weapon",
      targetId: "weapons-20503",
      current: { level: 1, breaks: 0, refinement: 0 },
      target: { level: 1, breaks: 0, refinement: 0 },
    };
    const result = computePlan(state([goal], { "weapon:20503": 1 }), input);
    expect(lineOf(result, "draft:9526")).toBeUndefined();
    expect(result.byGoal.w.steps).toHaveLength(0);
  });

  it("les étoiles consomment des exemplaires en plus de ceux équipés", () => {
    const wedge = progression.mods["mods-51758"];
    const goal: PlannerGoal = { id: "m", kind: "wedge", targetId: "mods-51758", copies: 5, current: wedge.maxLevel, target: wedge.maxLevel + 2 };
    const result = computePlan(state([goal], { "mod:51758": 5 }), input);
    const copies = lineOf(result, "mod:51758")!;
    const starCopies = (wedge.starCopies[0] + wedge.starCopies[1]) * 5;
    expect(copies.required).toBe(5 + starCopies);
    expect(copies.owned).toBe(5);
    expect(copies.missing + copies.crafted).toBe(starCopies);
  });
});

describe("builds", () => {
  const option: PlannerCharacterOption = {
    id: "char-aote",
    name: "L'Étranger",
    avatar: null,
    rarity: 5,
    elements: [{ key: "Wind", label: "Anemo", charId: AOTE }],
    skills: [],
  };
  const build = (key: string, characterId: string, wedges: Record<string, number>): PlannerBuildInput => ({
    key,
    label: key,
    characterId,
    element: null,
    skillPriority: [{ skillIndex: 1, priority: 5 }],
    weapons: ["weapons-10402"],
    alternativeWeapons: [],
    wedges,
  });

  it("traduit un build : perso, arme, wedges comptés par exemplaire", () => {
    const goals = goalsFromBuild(build("a", "char-aote", { "mods-51758": 5 }), option, progression);
    expect(goals.map((g) => g.kind)).toEqual(["character", "weapon", "wedge"]);
    const character = goals[0] as Extract<PlannerGoal, { kind: "character" }>;
    expect(character.target.skills[0]).toBe(10);
    expect((goals[2] as Extract<PlannerGoal, { kind: "wedge" }>).copies).toBe(5);
  });

  it("fusionne sans doublon : maximum pour un même perso, somme entre persos", () => {
    let goals = goalsFromBuild(build("a", "char-aote", { "mods-51758": 5 }), option, progression);
    goals = mergeGoals(goals, goalsFromBuild(build("b", "char-aote", { "mods-51758": 3 }), option, progression));
    expect(goals.filter((g) => g.kind === "character")).toHaveLength(1);
    const wedge = () => goals.find((g) => g.kind === "wedge") as Extract<PlannerGoal, { kind: "wedge" }>;
    expect(wedge().copies).toBe(5);
    goals = mergeGoals(goals, goalsFromBuild(build("c", "char-lise", { "mods-51758": 2 }), undefined, progression));
    expect(copiesFromDemand(wedge().demand)).toBe(7);

    goals = removeBuild(goals, "a");
    expect(wedge().copies).toBe(5);
    goals = removeBuild(removeBuild(goals, "b"), "c");
    expect(goals).toHaveLength(0);
  });

  it("un build de Demon Wedges d'arme donne l'arme et ses wedges, sans personnage", () => {
    const weaponBuild: PlannerBuildInput = {
      key: "weapon:weapons-10402:0",
      label: "Arme",
      characterId: "weapons-10402",
      element: null,
      skillPriority: [],
      weapons: ["weapons-10402"],
      alternativeWeapons: [],
      wedges: {},
      weaponWedges: { "weapons-10402": { "mods-52004": 1, "mods-52007": 2 } },
    };
    const goals = goalsFromBuild(weaponBuild, undefined, progression);
    expect(goals.map((g) => g.kind)).toEqual(["weapon", "wedge", "wedge"]);
    expect(goals.every((g) => g.origins?.[0].buildKey === weaponBuild.key)).toBe(true);

    // Le build d'un perso qui porte la même arme avec les mêmes wedges : pas de doublon.
    const characterBuild: PlannerBuildInput = {
      ...build("a", "char-aote", { "mods-52007": 1 }),
      weaponWedges: { "weapons-10402": { "mods-52007": 2 } },
    };
    const merged = mergeGoals(goals, goalsFromBuild(characterBuild, option, progression));
    const wedge = merged.find((g) => g.kind === "wedge" && g.targetId === "mods-52007") as Extract<PlannerGoal, { kind: "wedge" }>;
    // 2 sur l'arme (maximum entre les deux builds) + 1 sur le perso.
    expect(wedge.copies).toBe(3);
    // Retirer le build du perso rend ses deux parts (perso et arme) : il reste celle du build d'arme.
    const afterRemoval = removeBuild(merged, "a").find((g) => g.kind === "wedge" && g.targetId === "mods-52007");
    expect((afterRemoval as Extract<PlannerGoal, { kind: "wedge" }>).copies).toBe(2);
  });

  it("le stock va d'abord au premier objectif de la liste", () => {
    const one = aote({ id: "one", target: { level: 20, breaks: 1, skills: [1, 1, 1], intron: 0 } });
    const two = aote({ id: "two", charId: 4101, targetId: "char-lise", target: { level: 20, breaks: 1, skills: [1, 1, 1], intron: 0 } });
    const credits = progression.characters[String(AOTE)].breaks[0].costs.find((c) => c.key === CREDITS_KEY)!.num;
    const result = computePlan(state([one, two], { [CREDITS_KEY]: credits }), input);
    const total = lineOf(result, CREDITS_KEY)!;
    expect(total.owned).toBe(credits);
    expect(result.byGoal.one.ratio).toBeGreaterThan(result.byGoal.two.ratio);
  });
});

describe("stockage et synchronisation", () => {
  it("fusionne deux plans sans rien perdre : état le plus avancé, stock au maximum", () => {
    const device = state([aote({ id: "a", current: { level: 40, breaks: 3, skills: [1, 1, 1], intron: 0 } })], { [CREDITS_KEY]: 10, "res:2014": 5 });
    const account = state([aote({ id: "b", current: { level: 20, breaks: 1, skills: [4, 1, 1], intron: 0 } })], { [CREDITS_KEY]: 30 });
    const merged = mergePlans(account, device);
    expect(merged.goals).toHaveLength(1);
    const goal = merged.goals[0] as Extract<PlannerGoal, { kind: "character" }>;
    expect(goal.current).toEqual({ level: 40, breaks: 3, skills: [4, 1, 1], intron: 0 });
    expect(merged.inventory).toEqual({ [CREDITS_KEY]: 30, "res:2014": 5 });
  });

  it("relit un stockage abîmé en écartant l'entrée fautive, pas tout le plan", () => {
    const raw = {
      version: 1,
      goals: [aote(), { id: "x", kind: "character", targetId: "?" }],
      inventory: { [CREDITS_KEY]: 12, "res:abc": 3, "mod:1": -4 },
      craftChoices: { "weapon:20503": "craft", "weapon:1": "maybe" },
    };
    const plan = readPlannerState(raw);
    expect(plan.goals.map((g) => g.id)).toEqual(["aote"]);
    expect(plan.inventory).toEqual({ [CREDITS_KEY]: 12 });
    expect(plan.craftChoices).toEqual({ "weapon:20503": "craft" });
    expect(readPlannerState("n'importe quoi").goals).toEqual([]);
  });
});
