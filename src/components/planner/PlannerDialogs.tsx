"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DnaButton, DnaDialog, DnaItemIcon, DnaItemPicker, DnaSegmented, type DnaPickerItem, type ElementKey } from "@/components/dna";
import { characterGoal, goalsFromBuild, weaponGoal, wedgeGoal, type PlannerBuildInput } from "@/lib/planner/builds";
import type { PlannerDataset, PlannerGoal } from "@/lib/planner/types";
import type { PlannerLabels } from "./labels";

type AddKind = "character" | "weapon" | "wedge";

const ELEMENT_KEYS = new Set(["Fire", "Water", "Thunder", "Wind", "Light", "Dark"]);
const asElement = (key: string | null) => (key && ELEMENT_KEYS.has(key) ? (key as ElementKey) : null);

/** Choisir une cible : personnage (par élément), arme ou Demon Wedge. */
export function AddGoalDialog({
  open,
  onClose,
  dataset,
  goals,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  dataset: PlannerDataset;
  goals: PlannerGoal[];
  onAdd: (goal: PlannerGoal) => void;
}) {
  const t = useTranslations("planner");
  const [kind, setKind] = useState<AddKind>("character");

  const items = useMemo<Record<AddKind, DnaPickerItem[]>>(
    () => ({
      character: dataset.catalog.characters.flatMap((option) =>
        option.elements.map((element) => ({
          id: `${option.id}|${element.charId}`,
          name: option.elements.length > 1 && element.label ? `${option.name} · ${element.label}` : option.name,
          icon: option.avatar,
          rarity: option.rarity,
          element: asElement(element.key),
        })),
      ),
      weapon: dataset.catalog.weapons,
      wedge: dataset.catalog.wedges,
    }),
    [dataset],
  );

  const used = useMemo(
    () =>
      goals.map((g) => (g.kind === "character" ? `${g.targetId}|${g.charId}` : g.targetId)),
    [goals],
  );

  const select = (item: DnaPickerItem) => {
    const data = dataset.progression;
    let goal: PlannerGoal | null = null;
    if (kind === "character") {
      const [id, charId] = item.id.split("|");
      const option = dataset.catalog.characters.find((c) => c.id === id);
      const element = option?.elements.find((e) => String(e.charId) === charId);
      goal = option ? characterGoal(option, element?.key ?? null, data) : null;
    } else if (kind === "weapon") {
      goal = weaponGoal(item.id, data);
    } else {
      goal = wedgeGoal(item.id, 1, data);
    }
    if (goal) onAdd(goal);
  };

  return (
    <DnaDialog open={open} onClose={onClose} title={t("add.title")} size="xl" className="max-w-4xl">
      <div className="flex flex-col gap-4">
        <DnaSegmented<AddKind>
          ariaLabel={t("add.kind")}
          value={kind}
          onChange={setKind}
          options={[
            { value: "character", label: t("kind.character") },
            { value: "weapon", label: t("kind.weapon") },
            { value: "wedge", label: t("kind.wedge") },
          ]}
        />
        <DnaItemPicker
          key={kind}
          items={items[kind]}
          usedIds={used}
          onSelect={select}
          placeholder={t("add.search")}
          minColumnWidth="9rem"
          emptyLabel={t("add.empty")}
        />
      </div>
    </DnaDialog>
  );
}

/**
 * Confirmation d'un build : le joueur voit ce qui sera ajouté et décoche ce
 * qu'il ne veut pas. Rien n'entre dans le plan en silence.
 */
export function BuildImportDialog({
  build,
  dataset,
  labels,
  goals,
  onConfirm,
  onClose,
}: {
  build: PlannerBuildInput;
  dataset: PlannerDataset;
  labels: PlannerLabels;
  goals: PlannerGoal[];
  onConfirm: (goals: PlannerGoal[]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("planner");
  const proposals = useMemo(() => {
    const data = dataset.progression;
    const option = dataset.catalog.characters.find((c) => c.id === build.characterId);
    const main = goalsFromBuild(build, option, data).map((goal) => ({ goal, checked: true, alternative: false }));
    const origin = { buildKey: build.key, label: build.label };
    const alternatives = build.alternativeWeapons
      .map((id) => weaponGoal(id, data))
      .filter((g): g is NonNullable<typeof g> => Boolean(g))
      .map((goal) => ({ goal: { ...goal, origins: [origin] }, checked: false, alternative: true }));
    return [...main, ...alternatives];
  }, [build, dataset]);
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(proposals.map((p) => [p.goal.id, p.checked])),
  );

  const inPlan = (goal: PlannerGoal) =>
    goals.some(
      (g) => g.kind === goal.kind && g.targetId === goal.targetId && (g.kind !== "character" || goal.kind !== "character" || g.charId === goal.charId),
    );
  const selected = proposals.filter((p) => checked[p.goal.id]).map((p) => p.goal);

  return (
    <DnaDialog
      open
      onClose={onClose}
      title={t("build.title")}
      size="lg"
      footer={
        <>
          <DnaButton onClick={onClose}>{t("build.cancel")}</DnaButton>
          <DnaButton variant="gold" disabled={selected.length === 0} onClick={() => onConfirm(selected)}>
            {t("build.confirm", { count: selected.length })}
          </DnaButton>
        </>
      }
    >
      <p className="break-words font-display text-base text-parch">{build.label}</p>
      <p className="mt-1 text-xs text-muted">{t("build.intro")}</p>
      {proposals.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("build.nothing")}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1.5">
          {proposals.map(({ goal, alternative }) => {
            const display = labels.goal(goal);
            return (
              <li key={goal.id}>
                <label className="flex min-w-0 cursor-pointer items-center gap-3 border border-line/15 bg-ink/30 px-3 py-2 hover:border-gold/40">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[goal.id])}
                    onChange={(e) => setChecked((c) => ({ ...c, [goal.id]: e.target.checked }))}
                    className="h-4 w-4 shrink-0 accent-[var(--color-gold)]"
                  />
                  <DnaItemIcon src={display.icon} alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-parch" title={display.name}>
                      {display.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {[display.subtitle, alternative ? t("build.alternative") : null, inPlan(goal) ? t("build.alreadyIn") : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </DnaDialog>
  );
}
