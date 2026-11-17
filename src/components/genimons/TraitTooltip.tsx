"use client";

import { useTranslations } from "next-intl";
import CursorTooltip from "@/components/CursorTooltip";
import type { BuildGenimonTrait } from "@/lib/genimons/build-traits";

/**
 * Infobulle d'un Trait de Géniemon.
 *
 * `CursorTooltip` suit le curseur sur ordinateur et s'ouvre au toucher sur
 * mobile, comme pour les Demon Wedges.
 *
 * Un simple `title` n'affichait ni le glyphe, ni la rareté, ni la valeur, et
 * le mobile ne le montre jamais.
 */
export function TraitTooltip({
  trait,
  children,
}: {
  trait: BuildGenimonTrait;
  children: React.ReactNode;
}) {
  const t = useTranslations("genimonGuide");

  const content = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {trait.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" decoding="async" src={trait.icon} alt="" width={26} height={26} className="h-[26px] w-[26px] shrink-0" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-parch">{trait.name}</p>
          {trait.category !== "unknown" ? (
            <p className="font-caps text-[0.55rem] uppercase tracking-[0.18em] text-muted-2">
              {t(`category_${trait.category}`)}
            </p>
          ) : null}
        </div>
      </div>
      {/* L'effet est déjà résolu pour la rareté visée, chiffres compris. */}
      <p className="whitespace-pre-line text-xs leading-relaxed text-parch/85">{trait.effect}</p>
      <p className="border-t border-white/10 pt-1.5 text-[0.65rem] text-muted-2">
        {t("tooltipRarityNote", { rarity: trait.rarity })}
      </p>
    </div>
  );

  return (
    <CursorTooltip as="block" width={252} content={content}>
      {children}
    </CursorTooltip>
  );
}
