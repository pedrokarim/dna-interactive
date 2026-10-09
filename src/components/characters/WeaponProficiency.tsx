"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { WeaponTypeChip } from "@/components/characters/WeaponTypeChip";
import { resolveBuildItemRef } from "@/lib/characters/builds";
import { toIntlLocale } from "@/lib/intl-locale";
import {
  PROFICIENCY_ATTACK_BONUS,
  allWeaponTypesName,
  getCharacterProficiency,
  weaponTypeName,
  type WeaponTypeInfo,
} from "@/lib/characters/weapon-proficiency";

const BONUS_PERCENT = Math.round(PROFICIENCY_ATTACK_BONUS * 100);
/** Le chapitre du guide qui explique le système. */
const PROFICIENCY_GUIDE_HREF = "/items/weapons/about/proficiency";

/** Coût de déblocage d'un type : icône et quantité de chaque matériau. */
function UnlockCost({ type, lang }: { type: WeaponTypeInfo; lang: string }) {
  // La locale de la page, pas le code langue du jeu : « jp » n'est pas une locale valide, et un
  // code invalide retombe sur la locale de la machine, différente entre serveur et navigateur.
  const numberLocale = toIntlLocale(useLocale());
  return (
    <ul className="flex flex-col gap-2">
      {type.unlockCost.map((cost, index) => {
        const item = resolveBuildItemRef("resources", cost.itemId, lang);
        if (!item) return null;
        return (
          <li key={cost.itemId} className="flex items-center gap-2 text-sm text-parch/85">
            <DnaItemIcon src={item.icon} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="tabular-nums">{cost.amount.toLocaleString(numberLocale)}</span>
            {/* Le dernier matériau change avec le type visé : on tait le type, le coût vaut pour les quatre. */}
            <span className="text-muted">
              {index === type.unlockCost.length - 1 ? item.name.split(/\s*[:：]\s*/)[0] : item.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Les armes de prédilection d'un personnage, sur sa fiche : les deux d'origine,
 * les quatre choix de maîtrise supplémentaire, et ce que coûte un déblocage.
 */
export function WeaponProficiencyPanel({
  charId,
  lang,
  onOpenBuild,
}: {
  charId: number;
  /** Code langue des données de jeu (FR, EN, JP…). */
  lang: string;
  /** Ouvre l'onglet build, où la maîtrise conseillée est donnée. */
  onOpenBuild?: () => void;
}) {
  const t = useTranslations("weaponProficiency");
  const proficiency = useMemo(() => getCharacterProficiency(charId), [charId]);
  if (!proficiency) return null;

  return (
    <DnaPanel className="p-4 md:p-5">
      <DnaSectionLabel>{t("title")}</DnaSectionLabel>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t("bonus", { percent: BONUS_PERCENT })}</p>

      {proficiency.allTypes ? (
        <p className="mt-4 text-base text-parch">
          <span className="font-semibold text-gold-bright">{allWeaponTypesName(lang)}</span>
          {" – "}
          {t("allTypes")}
        </p>
      ) : (
        // En largeur : d'origine, supplémentaire, coût. Sur un écran étroit, les trois s'empilent.
        <div className="mt-5 grid gap-x-8 gap-y-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div>
            <h3 className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold">{t("baseLabel")}</h3>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 lg:flex-col">
              {proficiency.base.map((type) => (
                <WeaponTypeChip key={type.tag} type={type} name={weaponTypeName(type, lang)} />
              ))}
            </div>
          </div>

          <div className="lg:border-l lg:border-white/8 lg:pl-8">
            <h3 className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold">{t("extraLabel")}</h3>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
              {proficiency.extra.map((type) => (
                <WeaponTypeChip key={type.tag} type={type} name={weaponTypeName(type, lang)} tone="extra" size="sm" />
              ))}
            </div>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-muted">{t("extraHint")}</p>
          </div>

          {proficiency.extra[0] ? (
            <div className="lg:max-w-[19rem] lg:border-l lg:border-white/8 lg:pl-8">
              <h3 className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold">{t("costLabel")}</h3>
              <div className="mt-3">
                <UnlockCost type={proficiency.extra[0]} lang={lang} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">{t("costHint")}</p>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/8 pt-4">
        {onOpenBuild && !proficiency.allTypes ? (
          <button
            type="button"
            onClick={onOpenBuild}
            className="inline-flex items-center justify-center gap-2 border border-gold/45 bg-gold/10 px-4 py-2 font-caps text-[0.62rem] uppercase tracking-[0.18em] text-gold-bright transition-colors hover:bg-gold/20"
          >
            {t("seeBuild")}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <Link href={PROFICIENCY_GUIDE_HREF} className="text-xs text-muted underline-offset-4 hover:text-parch hover:underline">
          {t("guideLink")}
        </Link>
      </div>
    </DnaPanel>
  );
}
