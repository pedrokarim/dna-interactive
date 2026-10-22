"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Pause, Play, Trash2 } from "lucide-react";
import { DnaButton, DnaItemIcon, DnaProgress, DnaSwitch, DnaTag, cn } from "@/components/dna";
import { skillMaxLevel, weaponKey, wedgeKey, wedgeMaxRank } from "@/lib/planner/goals";
import type {
  CharacterState,
  GoalProgress,
  GoalStep,
  MaterialKey,
  PlannerDataset,
  PlannerGoal,
} from "@/lib/planner/types";
import { QuantityInput } from "./QuantityInput";
import type { PlannerLabels } from "./labels";

type GoalCallbacks = {
  onChange: (goal: PlannerGoal) => void;
  onStep: (goalId: string, stepId: string) => void;
  onMove: (goalId: string, direction: -1 | 1) => void;
  onRemove: (goalId: string) => void;
  onInventory: (key: MaterialKey, value: number) => void;
  /** Proposer les builds d'un perso ou d'une arme. */
  onPlanBuild: (goal: PlannerGoal) => void;
};

type PlannerGoalsProps = GoalCallbacks & {
  goals: PlannerGoal[];
  progress: Record<string, GoalProgress>;
  notices: Record<string, string>;
  dataset: PlannerDataset;
  labels: PlannerLabels;
  inventory: Record<MaterialKey, number>;
};

/** Onglet « Objectifs » : une carte par cible, dans l'ordre de priorité. */
export function PlannerGoals({ goals, progress, notices, ...rest }: PlannerGoalsProps) {
  const t = useTranslations("planner");
  if (goals.length === 0) return <p className="py-10 text-center text-sm text-muted">{t("goals.empty")}</p>;
  return (
    <ol className="flex flex-col gap-4">
      {goals.map((goal, index) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          index={index}
          total={goals.length}
          progress={progress[goal.id]}
          notice={notices[goal.id] ?? null}
          {...rest}
        />
      ))}
    </ol>
  );
}

const iconButton =
  "grid h-8 w-8 shrink-0 place-items-center border border-line/25 text-muted transition-colors hover:border-gold/60 hover:text-gold-bright disabled:opacity-30 disabled:hover:border-line/25 disabled:hover:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

function GoalCard({
  goal,
  index,
  total,
  progress,
  notice,
  dataset,
  labels,
  inventory,
  onChange,
  onStep,
  onMove,
  onRemove,
  onInventory,
  onPlanBuild,
}: Omit<PlannerGoalsProps, "goals" | "progress" | "notices"> & {
  goal: PlannerGoal;
  index: number;
  total: number;
  progress: GoalProgress | undefined;
  notice: string | null;
}) {
  const t = useTranslations("planner");
  const display = labels.goal(goal);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const steps = progress?.steps ?? [];
  const visibleSteps = showAllSteps ? steps : steps.slice(0, 5);
  const ratio = progress?.ratio ?? 0;
  const status = steps.length === 0 ? t("goals.reached") : progress?.ready ? t("goals.ready") : `${Math.floor(ratio * 100)} %`;

  return (
    <li className={cn("min-w-0 border border-line/25 bg-panel/70", goal.paused && "opacity-60")}>
      <div className="flex min-w-0 flex-wrap items-center gap-3 border-b border-line/15 px-3 py-3 sm:px-4">
        <DnaItemIcon
          src={display.icon}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 border border-line/20 bg-ink/40 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="font-caps text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
            {index + 1}. {display.subtitle}
          </p>
          <h3 className="truncate font-display text-lg font-semibold text-parch" title={display.name}>
            {display.name}
          </h3>
          {goal.origins?.length ? (
            <div className="mt-1 flex min-w-0 flex-wrap gap-1.5">
              {goal.origins.map((o) => (
                <DnaTag key={o.buildKey} className="max-w-full min-w-0">
                  <span className="min-w-0 truncate" title={o.label}>
                    {o.label}
                  </span>
                </DnaTag>
              ))}
            </div>
          ) : null}
          {goal.kind !== "wedge" ? (
            <button
              type="button"
              onClick={() => onPlanBuild(goal)}
              className="mt-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              {goal.kind === "character" ? t("goals.planBuild") : t("goals.planWeaponBuild")}
            </button>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" className={iconButton} disabled={index === 0} onClick={() => onMove(goal.id, -1)} aria-label={t("goals.moveUp")} title={t("goals.moveUp")}>
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" className={iconButton} disabled={index === total - 1} onClick={() => onMove(goal.id, 1)} aria-label={t("goals.moveDown")} title={t("goals.moveDown")}>
            <ArrowDown className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onChange({ ...goal, paused: !goal.paused })}
            aria-label={goal.paused ? t("goals.resume") : t("goals.pause")}
            title={goal.paused ? t("goals.resume") : t("goals.pause")}
          >
            {goal.paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
          </button>
          <button type="button" className={iconButton} onClick={() => onRemove(goal.id)} aria-label={t("goals.remove")} title={t("goals.remove")}>
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 px-3 py-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3 text-xs">
            <span className="font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">{t("goals.progress")}</span>
            <span className="tabular-nums text-parch">{goal.paused ? t("goals.paused") : status}</span>
          </div>
          <DnaProgress value={Math.round(ratio * 100)} max={100} label={t("goals.progress")} />
          {notice ? <p className="mt-3 border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-parch/90">{notice}</p> : null}
          <div className="mt-4">
            <GoalEditor goal={goal} dataset={dataset} labels={labels} inventory={inventory} onChange={onChange} onInventory={onInventory} />
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">{t("goals.nextSteps")}</p>
          {steps.length === 0 ? (
            <p className="text-sm text-parch/80">{t("goals.nothingLeft")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {visibleSteps.map((step) => (
                <StepRow key={step.id} step={step} goal={goal} labels={labels} onDone={() => onStep(goal.id, step.id)} />
              ))}
            </ul>
          )}
          {steps.length > 5 ? (
            <button
              type="button"
              onClick={() => setShowAllSteps((v) => !v)}
              className="mt-2 font-caps text-[0.6rem] uppercase tracking-[0.14em] text-gold hover:text-gold-bright"
            >
              {showAllSteps ? t("goals.fewerSteps") : t("goals.allSteps", { count: steps.length })}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function StepRow({ step, goal, labels, onDone }: { step: GoalStep; goal: PlannerGoal; labels: PlannerLabels; onDone: () => void }) {
  const t = useTranslations("planner");
  const shown = step.costs.slice(0, 4);
  const hidden = step.costs.length - shown.length;
  return (
    <li className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 border border-line/15 bg-ink/30 px-2.5 py-2">
      <span className="min-w-0 flex-1 basis-40 text-sm text-parch">{labels.step(goal, step.step)}</span>
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        {shown.map((cost) => {
          const material = labels.material(cost.key);
          return (
            <span key={cost.key} className="inline-flex items-center gap-1 text-xs tabular-nums text-parch/85" title={material.name}>
              <DnaItemIcon src={material.icon} alt={material.name} width={20} height={20} className="h-5 w-5 object-contain" />
              {labels.number(cost.num)}
            </span>
          );
        })}
        {hidden > 0 ? <span className="text-xs text-muted">+{hidden}</span> : null}
      </span>
      <DnaButton
        variant={step.available ? "gold" : "ghost"}
        disabled={!step.available}
        onClick={onDone}
        title={step.available ? t("goals.doneHint") : t("goals.notYet")}
        className="shrink-0 px-3 py-1 text-xs"
      >
        {t("goals.done")}
      </DnaButton>
    </li>
  );
}

/* ------------------------------------------------------------------ édition */

/** Libellé au-dessus des champs sur mobile, à leur gauche dès que la place le permet. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-x-3 gap-y-1 py-1 sm:grid-cols-[minmax(0,1fr)_auto]">
      <span className="min-w-0 truncate text-xs text-parch/85" title={label}>
        {label}
      </span>
      <span className="flex items-center gap-1.5">{children}</span>
    </div>
  );
}

function Pair({
  label,
  current,
  target,
  min,
  max,
  onCurrent,
  onTarget,
}: {
  label: string;
  current: number;
  target: number;
  min: number;
  max: number;
  onCurrent: (n: number) => void;
  onTarget: (n: number) => void;
}) {
  const t = useTranslations("planner");
  return (
    <Row label={label}>
      <QuantityInput value={current} min={min} max={max} onChange={onCurrent} label={t("goals.currentOf", { label })} className="w-[3.75rem]" />
      <span aria-hidden className="text-muted-2">→</span>
      <QuantityInput value={target} min={min} max={max} onChange={onTarget} label={t("goals.targetOf", { label })} className="w-[3.75rem]" />
      <span className="w-9 text-right text-[0.68rem] tabular-nums text-muted-2">/{max}</span>
    </Row>
  );
}

function GoalEditor({
  goal,
  dataset,
  labels,
  inventory,
  onChange,
  onInventory,
}: {
  goal: PlannerGoal;
  dataset: PlannerDataset;
  labels: PlannerLabels;
  inventory: Record<MaterialKey, number>;
  onChange: (goal: PlannerGoal) => void;
  onInventory: (key: MaterialKey, value: number) => void;
}) {
  const t = useTranslations("planner");
  const data = dataset.progression;

  const header = (
    <div className="grid grid-cols-1 gap-x-3 pb-1 sm:grid-cols-[minmax(0,1fr)_auto]">
      <span className="hidden sm:block" />
      <span className="flex items-center gap-1.5 font-caps text-[0.55rem] uppercase tracking-[0.14em] text-muted-2">
        <span className="w-[3.75rem] text-center">{t("goals.current")}</span>
        <span aria-hidden className="invisible">→</span>
        <span className="w-[3.75rem] text-center">{t("goals.target")}</span>
        <span className="w-9" />
      </span>
    </div>
  );

  if (goal.kind === "character") {
    const progression = data.characters[String(goal.charId)];
    if (!progression) return <p className="text-xs text-muted">{t("goals.noData")}</p>;
    const set = (patch: (s: CharacterState) => CharacterState, which: "current" | "target") =>
      onChange({ ...goal, [which]: patch(goal[which]) });
    return (
      <div>
        {header}
        <Pair
          label={t("goals.level")}
          current={goal.current.level}
          target={goal.target.level}
          min={1}
          max={data.maxLevel}
          onCurrent={(n) => set((s) => ({ ...s, level: n }), "current")}
          onTarget={(n) => set((s) => ({ ...s, level: n }), "target")}
        />
        <Pair
          label={t("goals.breaks")}
          current={goal.current.breaks}
          target={goal.target.breaks}
          min={0}
          max={progression.breaks.length}
          onCurrent={(n) => set((s) => ({ ...s, breaks: n }), "current")}
          onTarget={(n) => set((s) => ({ ...s, breaks: n }), "target")}
        />
        {[1, 2, 3].map((index) => {
          const updateSkill = (s: CharacterState, n: number) => {
            const skills = [...s.skills] as CharacterState["skills"];
            skills[index - 1] = n;
            return { ...s, skills };
          };
          return (
            <Pair
              key={index}
              label={labels.skillName(goal, index)}
              current={goal.current.skills[index - 1]}
              target={goal.target.skills[index - 1]}
              min={1}
              max={skillMaxLevel(progression, index)}
              onCurrent={(n) => set((s) => updateSkill(s, n), "current")}
              onTarget={(n) => set((s) => updateSkill(s, n), "target")}
            />
          );
        })}
        <Pair
          label={t("goals.intron")}
          current={goal.current.intron}
          target={goal.target.intron}
          min={0}
          max={progression.introns.length}
          onCurrent={(n) => set((s) => ({ ...s, intron: n }), "current")}
          onTarget={(n) => set((s) => ({ ...s, intron: n }), "target")}
        />
      </div>
    );
  }

  if (goal.kind === "weapon") {
    const progression = data.weapons[goal.targetId];
    if (!progression) return <p className="text-xs text-muted">{t("goals.noData")}</p>;
    const key = weaponKey(goal.targetId);
    const owned = (inventory[key] ?? 0) > 0;
    return (
      <div>
        <Row label={t("goals.weaponOwned")}>
          <DnaSwitch checked={owned} onChange={(next) => onInventory(key, next ? 1 : 0)} aria-label={t("goals.weaponOwned")} />
        </Row>
        <div className="mt-2">{header}</div>
        <Pair
          label={t("goals.level")}
          current={goal.current.level}
          target={goal.target.level}
          min={1}
          max={data.maxLevel}
          onCurrent={(n) => onChange({ ...goal, current: { ...goal.current, level: n } })}
          onTarget={(n) => onChange({ ...goal, target: { ...goal.target, level: n } })}
        />
        <Pair
          label={t("goals.breaks")}
          current={goal.current.breaks}
          target={goal.target.breaks}
          min={0}
          max={progression.breaks.length}
          onCurrent={(n) => onChange({ ...goal, current: { ...goal.current, breaks: n } })}
          onTarget={(n) => onChange({ ...goal, target: { ...goal.target, breaks: n } })}
        />
        {progression.refinement.length > 0 ? (
          <Pair
            label={t("goals.refinement")}
            current={goal.current.refinement}
            target={goal.target.refinement}
            min={0}
            max={progression.refinement.length}
            onCurrent={(n) => onChange({ ...goal, current: { ...goal.current, refinement: n } })}
            onTarget={(n) => onChange({ ...goal, target: { ...goal.target, refinement: n } })}
          />
        ) : null}
      </div>
    );
  }

  const wedge = data.mods[goal.targetId];
  if (!wedge) return <p className="text-xs text-muted">{t("goals.noData")}</p>;
  const key = wedgeKey(goal.targetId);
  return (
    <div>
      <Row label={t("goals.copies")}>
        <QuantityInput value={goal.copies} min={1} max={99} onChange={(n) => onChange({ ...goal, copies: n })} label={t("goals.copies")} className="w-[3.75rem]" />
      </Row>
      <Row label={t("goals.copiesOwned")}>
        <QuantityInput value={inventory[key] ?? 0} min={0} max={9999} onChange={(n) => onInventory(key, n)} label={t("goals.copiesOwned")} className="w-[3.75rem]" />
      </Row>
      <div className="mt-2">{header}</div>
      <Pair
        label={t("goals.rank")}
        current={goal.current}
        target={goal.target}
        min={0}
        max={wedgeMaxRank(data, goal.targetId)}
        onCurrent={(n) => onChange({ ...goal, current: n })}
        onTarget={(n) => onChange({ ...goal, target: n })}
      />
      {wedge.starMax > 0 ? (
        <p className="mt-2 text-xs text-muted">
          {t("goals.starsHint", {
            max: wedge.maxLevel,
            stars: wedge.starMax,
            resource: wedge.starResource ? labels.material(wedge.starResource).name : "",
          })}
        </p>
      ) : null}
    </div>
  );
}
