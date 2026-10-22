"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { NAVIGATION } from "@/lib/constants";
import { DnaButton, DnaProgress, DnaTabs, cn, useConfirm } from "@/components/dna";
import { applyStep, computePlan, shouldCraft } from "@/lib/planner/compute";
import { normalizeGoal } from "@/lib/planner/goals";
import {
  EMPTY_PLANNER,
  buildsInPlan,
  characterGoal,
  mergeGoals,
  removeBuild,
  weaponGoal,
  wedgeGoal,
  type PlannerBuildInput,
} from "@/lib/planner/builds";
import { MAX_GOALS, readPlannerState } from "@/lib/planner/schema";
import { plannerStateAtom } from "@/lib/planner/store";
import {
  CREDITS_KEY,
  MOD_COIN_KEY,
  type CraftChoice,
  type MaterialKey,
  type PlannerDataset,
  type PlannerGoal,
  type PlannerState,
} from "@/lib/planner/types";
import { usePlannerLabels } from "./labels";
import { PlannerMaterials } from "./PlannerMaterials";
import { PlannerGoals } from "./PlannerGoals";
import { PlannerSources } from "./PlannerSources";
import { AddGoalDialog, BuildImportDialog, BuildPickerDialog, type BuildTarget } from "./PlannerDialogs";
import { usePlannerSync } from "./usePlannerSync";

type Tab = "materials" | "goals" | "sources";

export type PlannerClientProps = {
  /** Build à importer (`?build=`), déjà résolu par le serveur. */
  pendingBuild: PlannerBuildInput | null;
  /** Cible à ajouter (`?add=char-aote`, `?add=weapons-10402`, `?add=mods-51758`). */
  addTarget: string | null;
};

/** `onLoaded` est appelé une fois les données reçues (lu par référence : il ne relance pas le chargement). */
function usePlannerDataset(locale: string, onLoaded: (data: PlannerDataset) => void) {
  const [dataset, setDataset] = useState<PlannerDataset | null>(null);
  const [failed, setFailed] = useState(false);
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/planner/dataset/${locale}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: PlannerDataset) => {
        setDataset(data);
        onLoadedRef.current(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("[planner] données indisponibles", error);
          setFailed(true);
        }
      });
    return () => controller.abort();
  }, [locale]);
  return { dataset, failed };
}

export function PlannerClient({ pendingBuild, addTarget }: PlannerClientProps) {
  const t = useTranslations("planner");
  const locale = useLocale();
  const router = useRouter();
  const { confirm } = useConfirm();
  const [stored, setStored] = useAtom(plannerStateAtom);
  const sync = usePlannerSync();
  const state = useMemo(() => readPlannerState(stored), [stored]);
  const [tab, setTab] = useState<Tab>("materials");
  const [adding, setAdding] = useState(false);
  const [buildToImport, setBuildToImport] = useState<PlannerBuildInput | null>(pendingBuild);
  /** Choix d'un build pour une cible ; `standalone` = la cible seule, proposée à l'ajout. */
  const [picking, setPicking] = useState<{ target: BuildTarget; standalone: PlannerGoal | null } | null>(null);
  /** Liste limitée aux objectifs d'un build (clé du build), ou tout le plan. */
  const [view, setView] = useState<string | null>(null);
  const [notices, setNotices] = useState<Record<string, string>>({});
  const [undo, setUndo] = useState<{ label: string; previous: PlannerState } | null>(null);

  const update = useCallback(
    (fn: (s: PlannerState) => PlannerState) => setStored((prev) => fn(readPlannerState(prev))),
    [setStored],
  );

  // Le paramètre d'URL ne sert qu'une fois : on le retire pour qu'un
  // rechargement ne propose pas deux fois le même ajout.
  const clearQuery = useCallback(() => router.replace("/planner"), [router]);

  /* ------------------------------------------------------------ ?add=… */
  const onDatasetLoaded = (data: PlannerDataset) => {
    if (!addTarget) return;
    const progression = data.progression;
    let goal: PlannerGoal | null = null;
    if (addTarget.startsWith("weapons-")) goal = weaponGoal(addTarget, progression);
    else if (addTarget.startsWith("mods-")) goal = wedgeGoal(addTarget, 1, progression);
    else {
      const option = data.catalog.characters.find((c) => c.id === addTarget);
      goal = option ? characterGoal(option, null, progression) : null;
    }
    if (goal) {
      const added = goal;
      update((s) => ({ ...s, goals: mergeGoals(s.goals, [added]).slice(0, MAX_GOALS) }));
      setTab("goals");
    }
    clearQuery();
  };
  const { dataset, failed } = usePlannerDataset(locale, onDatasetLoaded);
  const labels = usePlannerLabels(dataset);

  const result = useMemo(() => (dataset ? computePlan(state, dataset) : null), [state, dataset]);
  // Vue d'un seul build : mêmes calculs, sur ses seuls objectifs. Le stock
  // entier lui est disponible, comme si ce build passait en premier.
  const activeView = view && state.goals.some((g) => g.origins?.some((o) => o.buildKey === view)) ? view : null;
  const viewResult = useMemo(() => {
    if (!dataset || !activeView) return result;
    const goals = state.goals.filter((g) => g.origins?.some((o) => o.buildKey === activeView));
    return computePlan({ ...state, goals }, dataset);
  }, [dataset, activeView, state, result]);
  const goalNames = useMemo(
    () => Object.fromEntries(state.goals.map((g) => [g.id, labels.goal(g).name])),
    [state.goals, labels],
  );

  /* ---------------------------------------------------------- actions */
  const remember = (label: string) => setUndo({ label, previous: state });

  const onGoalChange = (goal: PlannerGoal) => {
    if (!dataset) return;
    const { goal: normalized, warnings } = normalizeGoal(goal, dataset.progression);
    const raised = warnings.find((w) => w.kind === "raisedForSkill");
    setNotices((n) => {
      const next = { ...n };
      if (raised && raised.kind === "raisedForSkill") {
        next[goal.id] = t("goals.raised", {
          skill: labels.skillName(goal, raised.skill),
          level: raised.level,
          breaks: raised.breaks,
        });
      } else delete next[goal.id];
      return next;
    });
    update((s) => ({ ...s, goals: s.goals.map((g) => (g.id === goal.id ? normalized : g)) }));
  };

  const onStep = (goalId: string, stepId: string) => {
    if (!dataset) return;
    const goal = state.goals.find((g) => g.id === goalId);
    const step = result?.byGoal[goalId]?.steps.find((s) => s.id === stepId);
    if (!goal || !step) return;
    remember(t("undo.step", { step: labels.step(goal, step.step), name: labels.goal(goal).name }));
    update((s) => applyStep(s, goalId, stepId, dataset));
  };

  const onMove = (goalId: string, direction: -1 | 1) =>
    update((s) => {
      const goals = [...s.goals];
      const from = goals.findIndex((g) => g.id === goalId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= goals.length) return s;
      [goals[from], goals[to]] = [goals[to], goals[from]];
      return { ...s, goals };
    });

  const onRemove = async (goalId: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;
    const name = labels.goal(goal).name;
    if (!(await confirm({ title: t("goals.removeTitle"), message: t("goals.removeMessage", { name }), danger: true }))) return;
    remember(t("undo.remove", { name }));
    update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== goalId) }));
  };

  const onInventory = (key: MaterialKey, value: number) =>
    update((s) => {
      const inventory = { ...s.inventory };
      if (value > 0) inventory[key] = value;
      else delete inventory[key];
      return { ...s, inventory };
    });

  const onCraftChoice = (key: MaterialKey, choice: CraftChoice) =>
    update((s) => ({ ...s, craftChoices: { ...s.craftChoices, [key]: choice } }));

  const addGoal = (goal: PlannerGoal) => {
    update((s) => ({ ...s, goals: mergeGoals(s.goals, [goal]).slice(0, MAX_GOALS) }));
    setTab("goals");
  };

  /** Cible d'un objectif, pour lui proposer ses builds. */
  const buildTarget = (goal: PlannerGoal): BuildTarget | null =>
    goal.kind === "wedge"
      ? null
      : { kind: goal.kind, id: goal.targetId, element: goal.kind === "character" ? goal.element : null, name: labels.goal(goal).name };

  // Un perso ou une arme : on propose d'abord ses builds (ou la cible seule).
  // Un Demon Wedge s'ajoute directement.
  const onAddGoal = (goal: PlannerGoal) => {
    setAdding(false);
    const target = buildTarget(goal);
    if (target) setPicking({ target, standalone: goal });
    else addGoal(goal);
  };

  const onPlanBuild = (goal: PlannerGoal) => {
    const target = buildTarget(goal);
    if (target) setPicking({ target, standalone: null });
  };

  const onImportBuild = (goals: PlannerGoal[]) => {
    update((s) => ({ ...s, goals: mergeGoals(s.goals, goals).slice(0, MAX_GOALS) }));
    setBuildToImport(null);
    setTab("goals");
    clearQuery();
  };

  const onRemoveBuild = async (buildKey: string, label: string) => {
    if (!(await confirm({ title: t("builds.removeTitle"), message: t("builds.removeMessage", { label }), danger: true }))) return;
    remember(t("undo.removeBuild", { label }));
    update((s) => ({ ...s, goals: removeBuild(s.goals, buildKey) }));
  };

  const onReset = async () => {
    if (!(await confirm({ title: t("reset.title"), message: t("reset.message"), danger: true }))) return;
    remember(t("undo.reset"));
    setStored(EMPTY_PLANNER);
  };

  /* ------------------------------------------------------------ rendu */
  if (failed) return <p className="border border-crimson/40 bg-crimson/10 px-4 py-6 text-sm text-parch">{t("loadError")}</p>;
  if (!dataset || !result) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="h-24 animate-pulse border border-line/20 bg-panel/50" />
        <div className="h-64 animate-pulse border border-line/20 bg-panel/40" />
      </div>
    );
  }

  const shown = viewResult ?? result;
  const lines = shown.lines;
  const toFarm = lines.filter((l) => l.missing > 0);
  const overall =
    lines.length === 0 ? 0 : lines.reduce((sum, l) => sum + Math.min(1, (l.owned + l.crafted) / l.required), 0) / lines.length;
  const credits = lines.find((l) => l.key === CREDITS_KEY);
  const modCoin = lines.find((l) => l.key === MOD_COIN_KEY);
  const builds = buildsInPlan(state.goals);
  const craftDefault = (key: MaterialKey) => shouldCraft(key, dataset, {});

  return (
    <div className="flex flex-col gap-5">
      {/* Résumé */}
      <section aria-label={t("summary.label")} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="min-w-0 border border-line/25 bg-panel/70 p-3 sm:p-4">
          <p className="truncate font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted" title={t("summary.progress")}>
            {t("summary.progress")}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-parch sm:text-3xl">{Math.floor(overall * 100)}&nbsp;%</p>
          <DnaProgress value={Math.round(overall * 100)} className="mt-2" label={t("summary.progress")} />
        </div>
        <SummaryTile label={t("summary.toFarm")} value={labels.number(toFarm.length)} hint={t("summary.toFarmHint", { count: lines.length })} />
        <SummaryTile
          label={labels.material(CREDITS_KEY).name}
          value={labels.number(credits?.missing ?? 0)}
          hint={t("summary.missingOf", { n: labels.number(credits?.required ?? 0) })}
        />
        <SummaryTile
          label={labels.material(MOD_COIN_KEY).name}
          value={labels.number(modCoin?.missing ?? 0)}
          hint={t("summary.missingOf", { n: labels.number(modCoin?.required ?? 0) })}
        />
      </section>

      {/* Actions et builds du plan */}
      <div className="flex flex-wrap items-center gap-2">
        <DnaButton variant="gold" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setAdding(true)} disabled={state.goals.length >= MAX_GOALS}>
          {t("add.button")}
        </DnaButton>
        {state.goals.length > 0 ? (
          <DnaButton onClick={onReset} className="px-4">
            {t("reset.button")}
          </DnaButton>
        ) : null}
        {builds.map((b) => (
          <span
            key={b.buildKey}
            className={cn(
              "inline-flex min-w-0 max-w-full items-center gap-1 border py-1 pl-1 pr-1 text-xs",
              activeView === b.buildKey ? "border-gold bg-gold/15 text-gold-bright" : "border-line/30 bg-gold/5 text-gold",
            )}
          >
            <button
              type="button"
              onClick={() => setView(activeView === b.buildKey ? null : b.buildKey)}
              aria-pressed={activeView === b.buildKey}
              title={t("view.only", { label: b.label })}
              className="min-w-0 truncate px-1.5 text-left hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              {b.label}
            </button>
            <button
              type="button"
              onClick={() => onRemoveBuild(b.buildKey, b.label)}
              aria-label={t("builds.remove", { label: b.label })}
              className="grid h-6 w-6 shrink-0 place-items-center text-muted hover:text-crimson-bright"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>

      <p className="-mt-2 text-xs text-muted" role="status">
        {t(`sync.${sync}`)}
        {sync === "anonymous" ? (
          <>
            {" "}
            <Link href={NAVIGATION.login} className="text-gold underline-offset-2 hover:text-gold-bright hover:underline">
              {t("sync.signIn")}
            </Link>
          </>
        ) : null}
      </p>

      {undo ? (
        <div role="status" className="flex flex-wrap items-center gap-3 border border-gold/30 bg-gold/5 px-4 py-2.5 text-sm text-parch">
          <span className="min-w-0 flex-1 break-words">{undo.label}</span>
          <button
            type="button"
            onClick={() => {
              setStored(undo.previous);
              setUndo(null);
            }}
            className="font-caps text-[0.62rem] uppercase tracking-[0.14em] text-gold hover:text-gold-bright"
          >
            {t("undo.button")}
          </button>
          <button type="button" onClick={() => setUndo(null)} aria-label={t("undo.dismiss")} className="text-muted hover:text-parch">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {activeView ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-parch/85" role="status">
          <span className="min-w-0 break-words">
            {t("view.active", { label: builds.find((b) => b.buildKey === activeView)?.label ?? "" })}
          </span>
          <button
            type="button"
            onClick={() => setView(null)}
            className="font-caps text-[0.62rem] uppercase tracking-[0.14em] text-gold hover:text-gold-bright"
          >
            {t("view.all")}
          </button>
        </p>
      ) : null}

      {state.goals.length === 0 ? (
        <div className="border border-line/25 bg-panel/70 px-5 py-10 text-center">
          <p className="font-display text-xl text-parch">{t("emptyTitle")}</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t("emptyText")}</p>
          <DnaButton variant="gold" className="mt-5" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setAdding(true)}>
            {t("add.button")}
          </DnaButton>
        </div>
      ) : (
        <>
          <DnaTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "materials", label: t("tabs.materials", { count: toFarm.length }) },
              { value: "goals", label: t("tabs.goals", { count: state.goals.length }) },
              { value: "sources", label: t("tabs.sources") },
            ]}
          />
          {tab === "materials" ? (
            <PlannerMaterials
              lines={lines}
              dataset={dataset}
              labels={labels}
              inventory={state.inventory}
              craftChoices={state.craftChoices}
              goalNames={goalNames}
              craftDefault={craftDefault}
              onInventory={onInventory}
              onCraftChoice={onCraftChoice}
            />
          ) : tab === "goals" ? (
            <PlannerGoals
              goals={state.goals}
              progress={result.byGoal}
              notices={notices}
              dataset={dataset}
              labels={labels}
              inventory={state.inventory}
              onChange={onGoalChange}
              onStep={onStep}
              onMove={onMove}
              onRemove={onRemove}
              onInventory={onInventory}
              onPlanBuild={onPlanBuild}
            />
          ) : (
            <PlannerSources groups={shown.sources} lines={lines} dataset={dataset} labels={labels} />
          )}
        </>
      )}

      <AddGoalDialog open={adding} onClose={() => setAdding(false)} dataset={dataset} goals={state.goals} onAdd={onAddGoal} />
      {buildToImport ? (
        <BuildImportDialog
          build={buildToImport}
          dataset={dataset}
          labels={labels}
          goals={state.goals}
          inventory={state.inventory}
          craftChoices={state.craftChoices}
          onConfirm={onImportBuild}
          onClose={() => {
            setBuildToImport(null);
            clearQuery();
          }}
        />
      ) : null}
      {picking ? (
        <BuildPickerDialog
          target={picking.target}
          standalone={picking.standalone}
          onStandalone={(goal) => {
            setPicking(null);
            addGoal(goal);
          }}
          onPick={(build) => {
            setPicking(null);
            setBuildToImport(build);
          }}
          onClose={() => setPicking(null)}
        />
      ) : null}
    </div>
  );
}

function SummaryTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 border border-line/25 bg-panel/70 p-3 sm:p-4">
      <p className="truncate font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted" title={label}>
        {label}
      </p>
      <p className="mt-1 truncate font-display text-2xl font-semibold tabular-nums text-parch sm:text-3xl" title={value}>
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted-2" title={hint}>
        {hint}
      </p>
    </div>
  );
}
