"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toIntlLocale } from "@/lib/intl-locale";
import { XP_KEYS, type MaterialKey, type PlanStep, type PlannerDataset, type PlannerGoal } from "@/lib/planner/types";

export type GoalDisplay = { name: string; icon: string | null; rarity: number | null; subtitle: string | null };

/** Noms, icônes et libellés d'étapes, résolus une fois pour tout le planificateur. */
export function usePlannerLabels(dataset: PlannerDataset | null) {
  const t = useTranslations("planner");
  const locale = useLocale();

  return useMemo(() => {
    const number = new Intl.NumberFormat(toIntlLocale(locale));
    const characters = new Map(dataset?.catalog.characters.map((c) => [c.id, c]) ?? []);
    const weapons = new Map(dataset?.catalog.weapons.map((w) => [w.id, w]) ?? []);
    const wedges = new Map(dataset?.catalog.wedges.map((w) => [w.id, w]) ?? []);

    const material = (key: MaterialKey) => {
      if (key === XP_KEYS.character || key === XP_KEYS.weapon) {
        const items = key === XP_KEYS.character ? dataset?.progression.characterXpItems : dataset?.progression.weaponXpItems;
        const top = items?.[0] ? dataset?.materials[items[0].key] : null;
        return {
          name: key === XP_KEYS.character ? t("xpCharacter") : t("xpWeapon"),
          icon: top?.icon ?? null,
          rarity: top?.rarity ?? 3,
          href: null,
        };
      }
      const known = dataset?.materials[key];
      if (!known) return { name: key, icon: null, rarity: 1, href: null };
      return key.startsWith("draft:") ? { ...known, name: t("draftName", { name: known.name }) } : known;
    };

    const goal = (g: PlannerGoal): GoalDisplay => {
      if (g.kind === "character") {
        const option = characters.get(g.targetId);
        const element = option && option.elements.length > 1 ? option.elements.find((e) => e.charId === g.charId) : null;
        return {
          name: option?.name ?? g.targetId,
          icon: option?.avatar ?? null,
          rarity: option?.rarity ?? null,
          subtitle: element?.label ? `${t("kind.character")} · ${element.label}` : t("kind.character"),
        };
      }
      const item = g.kind === "weapon" ? weapons.get(g.targetId) : wedges.get(g.targetId);
      return {
        name: item?.name ?? g.targetId,
        icon: item?.icon ?? null,
        rarity: item?.rarity ?? null,
        subtitle: g.kind === "weapon" ? t("kind.weapon") : t("kind.wedgeCopies", { count: g.copies }),
      };
    };

    const skillName = (g: PlannerGoal, index: number) => {
      if (g.kind !== "character") return String(index);
      return characters.get(g.targetId)?.skills.find((s) => s.index === index)?.name ?? t("skillSlot", { index });
    };

    const step = (g: PlannerGoal, s: PlanStep) => {
      switch (s.kind) {
        case "level":
          return t("steps.level", { from: s.from, to: s.to });
        case "break":
          return t("steps.break", { n: s.to });
        case "skill":
          return t("steps.skill", { skill: skillName(g, s.index), to: s.to });
        case "intron":
          return t("steps.intron", { n: s.to });
        case "refine":
          return t("steps.refine", { n: s.to });
        case "acquire":
          return g.kind === "weapon" ? t("steps.acquireWeapon") : t("steps.acquireWedge", { count: s.count });
        case "rank":
          return s.star ? t("steps.star", { n: s.to }) : t("steps.rank", { n: s.to });
      }
    };

    return { number: (n: number) => number.format(n), material, goal, step, skillName };
  }, [dataset, locale, t]);
}

export type PlannerLabels = ReturnType<typeof usePlannerLabels>;
