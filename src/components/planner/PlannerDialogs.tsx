"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DnaButton, DnaDialog, DnaItemIcon, DnaItemPicker, DnaSegmented, type DnaPickerItem, type ElementKey } from "@/components/dna";
import { characterGoal, goalsFromBuild, weaponGoal, wedgeGoal, type PlannerBuildInput, type PlannerBuildOption } from "@/lib/planner/builds";
import { computePlan } from "@/lib/planner/compute";
import { wedgeMaxRank } from "@/lib/planner/goals";
import { CREDITS_KEY, MOD_COIN_KEY, type PlannerDataset, type PlannerGoal, type PlannerState } from "@/lib/planner/types";
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

type WedgeRank = "base" | "stars";
type Proposal = { goal: PlannerGoal; checked: boolean; alternative: boolean };

/**
 * Confirmation d'un build : le joueur voit ce qui sera ajouté, choisit jusqu'où
 * monter les Demon Wedges et voit ce que le build coûte avec son stock avant
 * de l'ajouter. Rien n'entre dans le plan en silence.
 */
export function BuildImportDialog({
  build,
  dataset,
  labels,
  goals,
  inventory,
  craftChoices,
  onConfirm,
  onClose,
}: {
  build: PlannerBuildInput;
  dataset: PlannerDataset;
  labels: PlannerLabels;
  goals: PlannerGoal[];
  inventory: PlannerState["inventory"];
  craftChoices: PlannerState["craftChoices"];
  onConfirm: (goals: PlannerGoal[]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("planner");
  const data = dataset.progression;
  const proposals = useMemo<Proposal[]>(() => {
    const option = dataset.catalog.characters.find((c) => c.id === build.characterId);
    const main = goalsFromBuild(build, option, data).map((goal) => ({ goal, checked: true, alternative: false }));
    const origin = { buildKey: build.key, label: build.label };
    const alternatives = build.alternativeWeapons
      .map((id) => weaponGoal(id, data))
      .filter((g): g is NonNullable<typeof g> => Boolean(g))
      .map((goal) => ({ goal: { ...goal, origins: [origin] }, checked: false, alternative: true }));
    return [...main, ...alternatives];
  }, [build, dataset, data]);
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(proposals.map((p) => [p.goal.id, p.checked])),
  );
  const [wedgeRank, setWedgeRank] = useState<WedgeRank>("base");
  const hasStars = proposals.some((p) => p.goal.kind === "wedge" && (data.mods[p.goal.targetId]?.starMax ?? 0) > 0);

  const inPlan = (goal: PlannerGoal) =>
    goals.some(
      (g) => g.kind === goal.kind && g.targetId === goal.targetId && (g.kind !== "character" || goal.kind !== "character" || g.charId === goal.charId),
    );
  // Rang visé des wedges : maximum sans étoile, ou avec toutes les étoiles.
  const selected = useMemo(
    () =>
      proposals
        .filter((p) => checked[p.goal.id])
        .map(({ goal }) =>
          goal.kind === "wedge" && wedgeRank === "stars" ? { ...goal, target: wedgeMaxRank(data, goal.targetId) } : goal,
        ),
    [proposals, checked, wedgeRank, data],
  );

  // Coût du build seul, avec le stock actuel (sans les autres objectifs).
  const cost = useMemo(() => {
    const plan = computePlan({ version: 1, goals: selected, inventory, craftChoices }, dataset);
    const missing = (key: string) => plan.lines.find((l) => l.key === key)?.missing ?? 0;
    return {
      credits: missing(CREDITS_KEY),
      modCoin: missing(MOD_COIN_KEY),
      toFarm: plan.lines.filter((l) => l.missing > 0 && l.key !== CREDITS_KEY && l.key !== MOD_COIN_KEY).length,
    };
  }, [selected, inventory, craftChoices, dataset]);

  const sections: { kind: PlannerGoal["kind"]; label: string }[] = [
    { kind: "character", label: t("kind.character") },
    { kind: "weapon", label: t("build.weapons") },
    { kind: "wedge", label: t("build.wedges") },
  ];

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
        <>
          {hasStars ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">{t("build.wedgeRank")}</span>
              <DnaSegmented<WedgeRank>
                ariaLabel={t("build.wedgeRank")}
                value={wedgeRank}
                onChange={setWedgeRank}
                options={[
                  { value: "base", label: t("build.rankBase") },
                  { value: "stars", label: t("build.rankStars") },
                ]}
              />
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-3 gap-2 border border-line/20 bg-ink/30 p-3 text-center">
            <p className="col-span-3 text-left font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">{t("build.cost")}</p>
            {[
              { label: labels.material(CREDITS_KEY).name, value: labels.number(cost.credits) },
              { label: labels.material(MOD_COIN_KEY).name, value: labels.number(cost.modCoin) },
              { label: t("build.toFarm"), value: labels.number(cost.toFarm) },
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <p className="truncate font-display text-lg tabular-nums text-parch" title={item.value}>
                  {item.value}
                </p>
                <p className="truncate text-[0.68rem] text-muted" title={item.label}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {sections.map((section) => {
            const items = proposals.filter((p) => p.goal.kind === section.kind);
            if (items.length === 0) return null;
            return (
              <section key={section.kind} className="mt-4">
                <h3 className="mb-1.5 font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">{section.label}</h3>
                <ul className="flex flex-col gap-1.5">
                  {items.map(({ goal, alternative }) => {
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
              </section>
            );
          })}
        </>
      )}
    </DnaDialog>
  );
}

export type BuildTarget = {
  kind: "character" | "weapon";
  id: string;
  element: string | null;
  name: string;
};

/**
 * Choisir un build pour une cible : builds officiels et communautaires d'un
 * personnage, builds de Demon Wedges d'une arme. À l'ajout d'une cible, propose
 * aussi de l'ajouter seule.
 */
export function BuildPickerDialog({
  target,
  standalone,
  onStandalone,
  onPick,
  onClose,
}: {
  target: BuildTarget;
  standalone: PlannerGoal | null;
  onStandalone: (goal: PlannerGoal) => void;
  onPick: (build: PlannerBuildInput) => void;
  onClose: () => void;
}) {
  const t = useTranslations("planner");
  const locale = useLocale();
  const [builds, setBuilds] = useState<PlannerBuildOption[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ target: target.id, locale });
    if (target.element) params.set("element", target.element);
    fetch(`/api/planner/builds?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { builds: PlannerBuildOption[] }) => setBuilds(body.builds))
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [target, locale]);

  const open = async (key: string) => {
    setOpening(key);
    try {
      const r = await fetch(`/api/planner/builds?${new URLSearchParams({ key, locale })}`);
      const body = (await r.json()) as { build: PlannerBuildInput | null };
      if (body.build) onPick(body.build);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setOpening(null);
    }
  };

  const groups: { kind: PlannerBuildOption["kind"]; label: string }[] = [
    { kind: "official", label: t("pick.official") },
    { kind: "community", label: t("pick.community") },
    { kind: "weapon", label: t("pick.weapon") },
  ];

  return (
    <DnaDialog open onClose={onClose} title={t("pick.title", { name: target.name })} size="lg">
      {standalone ? (
        <DnaButton className="w-full justify-start" onClick={() => onStandalone(standalone)}>
          {target.kind === "character" ? t("pick.aloneCharacter", { name: target.name }) : t("pick.aloneWeapon", { name: target.name })}
        </DnaButton>
      ) : null}
      {failed ? <p className="mt-4 text-sm text-crimson-bright">{t("pick.error")}</p> : null}
      {!builds && !failed ? <p className="mt-4 text-sm text-muted">{t("pick.loading")}</p> : null}
      {builds && builds.length === 0 ? <p className="mt-4 text-sm text-muted">{t("pick.none")}</p> : null}
      {builds
        ? groups.map((group) => {
            const items = builds.filter((b) => b.kind === group.kind);
            if (items.length === 0) return null;
            return (
              <section key={group.kind} className="mt-4">
                <h3 className="mb-1.5 font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">{group.label}</h3>
                <ul className="flex flex-col gap-1.5">
                  {items.map((b) => (
                    <li key={b.key}>
                      <button
                        type="button"
                        disabled={opening !== null}
                        onClick={() => open(b.key)}
                        className="flex w-full min-w-0 items-center gap-3 border border-line/15 bg-ink/30 px-3 py-2.5 text-left transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-60"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm text-parch" title={b.label}>
                          {b.label}
                        </span>
                        {b.legacy ? <span className="shrink-0 text-xs text-muted-2">{t("pick.legacy")}</span> : null}
                        {b.votes !== undefined ? (
                          <span className="shrink-0 text-xs tabular-nums text-muted">{t("pick.votes", { count: b.votes })}</span>
                        ) : null}
                        <span className="shrink-0 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold">
                          {opening === b.key ? t("pick.opening") : t("pick.choose")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        : null}
    </DnaDialog>
  );
}
