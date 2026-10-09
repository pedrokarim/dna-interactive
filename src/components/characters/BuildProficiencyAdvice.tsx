"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { WeaponTypeChip } from "@/components/characters/WeaponTypeChip";
import {
  PROFICIENCY_ATTACK_BONUS,
  allWeaponTypesName,
  getCharacterProficiency,
  weaponTypeName,
  type ProficiencySuggestion,
} from "@/lib/characters/weapon-proficiency";

// Fichier à part du panneau de la fiche : celui-ci ne tire pas le catalogue
// d'objets, et le builder peut donc l'embarquer.

const BONUS_PERCENT = Math.round(PROFICIENCY_ATTACK_BONUS * 100);
const PROFICIENCY_GUIDE_HREF = "/items/weapons/about/proficiency";

/**
 * Dans un build : rappel des prédilections du personnage, puis la maîtrise
 * supplémentaire que les armes conseillées rendent utile.
 */
export function BuildProficiencyAdvice({
  charId,
  suggestions,
  lang,
}: {
  charId: number;
  /** Maîtrises utiles aux armes du build, la plus utile en premier (calculées par l'appelant). */
  suggestions: ProficiencySuggestion[];
  lang: string;
}) {
  const t = useTranslations("weaponProficiency");
  const proficiency = useMemo(() => getCharacterProficiency(charId), [charId]);
  if (!proficiency) return null;

  return (
    <div className="mt-4 border border-white/10 bg-ink/45 p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold">{t("baseLabel")}</span>
        {proficiency.allTypes ? (
          <span className="text-sm text-parch">{allWeaponTypesName(lang)}</span>
        ) : (
          proficiency.base.map((type) => (
            <WeaponTypeChip key={type.tag} type={type} name={weaponTypeName(type, lang)} size="sm" />
          ))
        )}
      </div>

      {proficiency.allTypes ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">{t("allTypes")}</p>
      ) : suggestions.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted">{t("adviceNone")}</p>
      ) : (
        <>
          <p className="mt-4 font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold">
            {t("adviceTitle", { count: suggestions.length })}
          </p>
          <ul className="mt-2 space-y-2.5">
            {suggestions.map((suggestion, index) => {
              const weaponNames = suggestion.weapons.map((weapon) => weapon.name);
              const calamityNames = suggestion.weapons.filter((weapon) => weapon.calamity).map((weapon) => weapon.name);
              return (
                <li key={suggestion.type.tag} className="flex items-start gap-3">
                  <WeaponTypeChip type={suggestion.type} tone={index === 0 ? "suggested" : "extra"} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-parch">
                      <span className="font-semibold">{weaponTypeName(suggestion.type, lang)}</span>
                      <span className="ml-2 font-caps text-[0.55rem] uppercase tracking-[0.16em] text-muted">
                        {index === 0 ? t("adviceFirst") : t("adviceOther")}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-parch/80">
                      {t("reasonAttack", { percent: BONUS_PERCENT, weapons: weaponNames.join(", ") })}
                      {calamityNames.length > 0 ? ` ${t("reasonPotentials", { weapons: calamityNames.join(", ") })}` : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {suggestions.length > 1 ? <p className="mt-3 text-xs leading-relaxed text-muted">{t("adviceOneActive")}</p> : null}
        </>
      )}

      <Link href={PROFICIENCY_GUIDE_HREF} className="mt-3 inline-block text-xs text-muted underline-offset-4 hover:text-parch hover:underline">
        {t("guideLink")}
      </Link>
    </div>
  );
}
