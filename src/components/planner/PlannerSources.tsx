"use client";

import { useTranslations } from "next-intl";
import { DnaItemIcon } from "@/components/dna";
import type { MaterialLine, PlannerDataset, SourceGroup } from "@/lib/planner/types";
import type { PlannerLabels } from "./labels";

type PlannerSourcesProps = {
  groups: SourceGroup[];
  lines: MaterialLine[];
  dataset: PlannerDataset;
  labels: PlannerLabels;
};

/**
 * Onglet « Où farmer » : les manques regroupés par activité, la plus utile
 * d'abord. Dit où, pas combien de fois : les taux de drop ne sont pas encore
 * exploités.
 */
export function PlannerSources({ groups, lines, dataset, labels }: PlannerSourcesProps) {
  const t = useTranslations("planner");
  const missing = new Map(lines.map((l) => [l.key, l.missing]));

  if (groups.length === 0) return <p className="py-10 text-center text-sm text-muted">{t("sources.empty")}</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{t("sources.intro")}</p>
      <ol className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {groups.map((group, index) => {
          const activity = group.kind === "activity" ? dataset.sources.activities[group.id] : null;
          const title =
            group.kind === "activity"
              ? activity?.name ?? group.id
              : group.kind === "access"
                ? dataset.sources.access[group.id] ?? group.id
                : t("sources.unknown");
          const levels =
            activity && activity.levels[1] > 0
              ? activity.levels[0] === activity.levels[1]
                ? t("sources.level", { n: activity.levels[0] })
                : t("sources.levels", { min: activity.levels[0], max: activity.levels[1] })
              : null;
          return (
            <li key={`${group.kind}-${"id" in group ? group.id : "unknown"}`} className="min-w-0 border border-line/25 bg-panel/70 p-4">
              <p className="font-caps text-[0.58rem] uppercase tracking-[0.16em] text-muted-2">
                {group.kind === "activity" ? t("sources.stop", { n: index + 1 }) : t("sources.other")}
              </p>
              <h3 className="mt-1 break-words font-display text-lg font-semibold text-parch">{title}</h3>
              {activity?.focus || levels ? (
                <p className="mt-0.5 text-xs text-muted">{[activity?.focus, levels].filter(Boolean).join(" · ")}</p>
              ) : null}
              <p className="mt-2 text-xs text-parch/80">{t("sources.covers", { count: group.keys.length })}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {group.keys.map((key) => {
                  const material = labels.material(key);
                  return (
                    <li key={key} className="flex min-w-0 items-center gap-2">
                      <DnaItemIcon src={material.icon} alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
                      <span className="min-w-0 flex-1 truncate text-sm text-parch" title={material.name}>
                        {material.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-crimson-bright">
                        {labels.number(missing.get(key) ?? 0)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
