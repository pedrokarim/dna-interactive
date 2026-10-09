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
import { toIntlLocale } from "@/lib/cosmetics/format";
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
    <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
      {type.unlockCost.map((cost, index) => {
        const item = resolveBuildItemRef("resources", cost.itemId, lang);
        if (!item) return null;
        return (
          <li key={cost.itemId} className="flex items-center gap-1.5 text-xs text-parch/85">
            <DnaItemIcon src={item.icon} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
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
      <p className="mt-2 text-xs leading-relaxed text-muted">{t("bonus", { percent: BONUS_PERCENT })}</p>

      {proficiency.allTypes ? (
        <p className="mt-3 text-sm text-parch">
          <span className="font-semibold text-gold-bright">{allWeaponTypesName(lang)}</span>
          {" – "}
          {t("allTypes")}
        </p>
      ) : (
        <>
          <h3 className="mt-4 font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold">{t("baseLabel")}</h3>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {proficiency.base.map((type) => (
              <WeaponTypeChip key={type.tag} type={type} name={weaponTypeName(type, lang)} />
            ))}
          </div>

          <h3 className="mt-5 font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold">{t("extraLabel")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t("extraHint")}</p>
          <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
            {proficiency.extra.map((type) => (
              <WeaponTypeChip key={type.tag} type={type} name={weaponTypeName(type, lang)} tone="extra" size="sm" />
            ))}
          </div>

          {proficiency.extra[0] ? (
            <div className="mt-4 border-t border-white/8 pt-3">
              <p className="mb-2 text-xs text-muted">{t("costLabel")}</p>
              <UnlockCost type={proficiency.extra[0]} lang={lang} />
              <p className="mt-2 text-xs leading-relaxed text-muted">{t("costHint")}</p>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {onOpenBuild && !proficiency.allTypes ? (
          <button
            type="button"
            onClick={onOpenBuild}
            className="inline-flex items-center justify-center gap-2 border border-gold/45 bg-gold/10 px-3 py-2 font-caps text-[0.62rem] uppercase tracking-[0.18em] text-gold-bright transition-colors hover:bg-gold/20"
          >
            {t("seeBuild")}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <Link href={PROFICIENCY_GUIDE_HREF} className="text-center text-xs text-muted underline-offset-4 hover:text-parch hover:underline">
          {t("guideLink")}
        </Link>
      </div>
    </DnaPanel>
  );
}
