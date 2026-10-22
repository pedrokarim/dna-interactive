"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaItemIcon, DnaSegmented, cn } from "@/components/dna";
import { XP_KEYS, type CraftChoice, type MaterialKey, type MaterialLine, type PlannerDataset } from "@/lib/planner/types";
import { QuantityInput } from "./QuantityInput";
import type { PlannerLabels } from "./labels";

type PlannerMaterialsProps = {
  lines: MaterialLine[];
  dataset: PlannerDataset;
  labels: PlannerLabels;
  inventory: Record<MaterialKey, number>;
  craftChoices: Record<MaterialKey, CraftChoice>;
  goalNames: Record<string, string>;
  craftDefault: (key: MaterialKey) => boolean;
  onInventory: (key: MaterialKey, value: number) => void;
  onCraftChoice: (key: MaterialKey, choice: CraftChoice) => void;
};

/** Onglet « Matériaux » : la liste de farm, qui sert aussi de formulaire de stock. */
export function PlannerMaterials(props: PlannerMaterialsProps) {
  const t = useTranslations("planner");
  const missing = props.lines.filter((l) => l.missing > 0);
  const complete = props.lines.filter((l) => l.missing === 0);

  if (props.lines.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">{t("materials.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {missing.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line/15 border border-line/20 bg-panel/60">
          {missing.map((line) => (
            <MaterialRow key={line.key} line={line} {...props} />
          ))}
        </ul>
      ) : (
        <p className="border border-line/20 bg-panel/60 px-4 py-6 text-center text-sm text-parch/85">{t("materials.allSet")}</p>
      )}
      {complete.length > 0 ? (
        <details className="group border border-line/20 bg-panel/40">
          <summary className="cursor-pointer select-none px-4 py-3 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted hover:text-parch">
            {t("materials.completeCount", { count: complete.length })}
          </summary>
          <ul className="flex flex-col divide-y divide-line/15 border-t border-line/15">
            {complete.map((line) => (
              <MaterialRow key={line.key} line={line} {...props} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function MaterialRow({
  line,
  dataset,
  labels,
  inventory,
  craftChoices,
  goalNames,
  craftDefault,
  onInventory,
  onCraftChoice,
}: PlannerMaterialsProps & { line: MaterialLine }) {
  const t = useTranslations("planner");
  const material = labels.material(line.key);
  const isXp = line.key === XP_KEYS.character || line.key === XP_KEYS.weapon;
  const xpItems = line.key === XP_KEYS.character ? dataset.progression.characterXpItems : dataset.progression.weaponXpItems;
  const done = line.missing === 0;

  const usedBy = [
    ...line.usedBy.map((id) => goalNames[id]).filter(Boolean),
    ...line.forCrafting.map((key) => t("materials.forCrafting", { name: labels.material(key).name })),
  ];
  const usedByText = usedBy.join(" · ");
  const choice: CraftChoice = craftChoices[line.key] ?? (craftDefault(line.key) ? "craft" : "farm");

  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4 lg:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
      <DnaItemIcon
        src={material.icon}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 border border-line/20 bg-ink/40 object-contain"
      />
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          {material.href ? (
            <Link href={material.href} className="truncate font-display text-base text-parch hover:text-gold-bright" title={material.name}>
              {material.name}
            </Link>
          ) : (
            <span className="truncate font-display text-base text-parch" title={material.name}>
              {material.name}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted" title={usedByText}>
          {usedByText}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums text-parch/80">
          <span>{t("materials.required", { n: labels.number(line.required) })}</span>
          {line.crafted > 0 ? <span className="text-gold">{t("materials.crafted", { n: labels.number(line.crafted) })}</span> : null}
          {done ? (
            <span className="inline-flex items-center gap-1 text-ok">
              <Check className="h-3.5 w-3.5" aria-hidden />
              {t("materials.done")}
            </span>
          ) : (
            <span className="font-semibold text-crimson-bright">{t("materials.missing", { n: labels.number(line.missing) })}</span>
          )}
        </p>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-1 lg:justify-end">
        {isXp ? (
          <div className="flex flex-wrap items-center gap-2">
            {xpItems.map((item) => {
              const info = labels.material(item.key);
              return (
                <label key={item.key} className="flex items-center gap-1.5" title={`${info.name} (${labels.number(item.xp)} XP)`}>
                  <DnaItemIcon src={info.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                  <QuantityInput
                    value={inventory[item.key] ?? 0}
                    onChange={(n) => onInventory(item.key, n)}
                    label={t("materials.ownedOf", { name: info.name })}
                    className="w-[4.5rem]"
                  />
                </label>
              );
            })}
          </div>
        ) : (
          <>
            {line.craftable ? (
              <DnaSegmented<CraftChoice>
                ariaLabel={t("materials.craftChoice")}
                value={choice}
                onChange={(value) => onCraftChoice(line.key, value)}
                options={[
                  { value: "farm", label: t("materials.farm") },
                  { value: "craft", label: t("materials.craft") },
                ]}
              />
            ) : null}
            <span className="font-caps text-[0.6rem] uppercase tracking-[0.14em] text-muted-2">{t("materials.owned")}</span>
            <QuantityInput
              value={inventory[line.key] ?? 0}
              onChange={(n) => onInventory(line.key, n)}
              label={t("materials.ownedOf", { name: material.name })}
            />
            <button
              type="button"
              onClick={() => onInventory(line.key, Math.max(inventory[line.key] ?? 0, line.required))}
              disabled={(inventory[line.key] ?? 0) >= line.required}
              className={cn(
                "h-8 border border-line/30 px-2.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:text-gold-bright disabled:cursor-default disabled:opacity-40 disabled:hover:border-line/30 disabled:hover:text-gold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
              )}
            >
              {t("materials.haveAll")}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
