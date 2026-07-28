"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  BadgeInfo,
  BookOpenText,
  FlameKindling,
  Gem,
  GitBranch,
  Lock,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Wrench,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaStatRow } from "@/components/dna/StatRow";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { WeaponFusionTrack } from "@/components/items/WeaponFusionTrack";
import { CalamityPotentialTree } from "@/components/items/CalamityPotentialTree";
import { CALAMITY_ACCENT_HEX, potentialNodesUnlocked } from "@/lib/items/calamity-weapons";

type GuideWedgeSlot = {
  position: number;
  name: string;
  icon: string;
  href: string | null;
  track: number | null;
};

type GuideForgeMaterial = {
  id: number;
  name: string;
  icon: string;
  quantity: number;
};

type GuideForgeStep = {
  level: number;
  materials: GuideForgeMaterial[];
  note: string | null;
};

export type CalamityGuideWeapon = {
  id: string;
  href: string;
  name: string;
  englishName: string;
  description: string | null;
  icon: string;
  type: "Melee" | "Ranged";
  typeLabel: string;
  subtype: string;
  subtypeLabel: string;
  atkType: string | null;
  baseAtk: number | null;
  maxAtk: number | null;
  critRate: number | null;
  critDamage: number | null;
  openVersion: number | null;
  passiveDescription: string | null;
  potentialTreeKnown: boolean;
  wedgePoolKey: "UI_Armory_Meleeweapon" | "UI_Armory_Longrange";
  wedgePoolLabel: string;
  wedgeBuildSlots: GuideWedgeSlot[];
  forgeSteps: GuideForgeStep[];
};

type CalamityWeaponsGuideClientProps = {
  categorySlug: string;
  /** Code langue des données de jeu (FR, EN, …) dérivé de la locale de la page. */
  gameLang: string;
  totalWeaponCount: number;
  weapons: CalamityGuideWeapon[];
  wedgePools: {
    melee: number;
    ranged: number;
    consonanceMelee: number;
    consonanceRanged: number;
  };
};

/** Paliers de Fusion : le chiffre romain est un repère visuel, les textes viennent des messages. */
const FUSION_LEVELS = [
  { level: 0, label: null },
  { level: 1, label: "I" },
  { level: 2, label: "II" },
  { level: 3, label: "III" },
  { level: 4, label: "IV" },
  { level: 5, label: "V" },
] as const;

const ATK_TYPE_KEYS = ["Psionic", "Smash", "Spike", "Slash"];

function formatPercent(value: number | null, digits = 0, naLabel = "N/A"): string {
  if (value === null) return naLabel;
  return `${(value * 100).toFixed(digits).replace(/\.0+$/, "")}%`;
}

function formatVersion(value: number | null, naLabel = "N/A"): string {
  if (value === null) return naLabel;
  if (value < 10) return `v${value}`;
  return `v${Math.floor(value / 10)}.${value % 10}`;
}

function CalamityBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 px-3 py-1 text-xs text-parch">
      {children}
    </span>
  );
}

function FactCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="border border-white/10 bg-ink/55 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center border border-gold/25 bg-gold/10 text-gold">
          {icon}
        </span>
        <h3 className="font-display text-lg text-parch">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-parch/80">{children}</p>
    </article>
  );
}

export default function CalamityWeaponsGuideClient({
  categorySlug,
  gameLang,
  totalWeaponCount,
  weapons,
  wedgePools,
}: CalamityWeaponsGuideClientProps) {
  const t = useTranslations("calamityGuide");
  const [selectedWeaponId, setSelectedWeaponId] = useState(weapons[0]?.id ?? "");
  const [fusionLevel, setFusionLevel] = useState(0);

  const activeWeapon = useMemo(
    () => weapons.find((weapon) => weapon.id === selectedWeaponId) ?? weapons[0],
    [selectedWeaponId, weapons],
  );

  if (!activeWeapon) {
    return null;
  }

  const code = (chunks: ReactNode) => <code>{chunks}</code>;
  const naLabel = t("naValue");
  const currentLevel = FUSION_LEVELS.find((step) => step.level === fusionLevel) ?? FUSION_LEVELS[0];
  // Le palier 0 porte un libellé traduit ; les suivants gardent leur chiffre romain.
  const currentStepLabel = currentLevel.label ?? t("fusionSteps.0.label");
  const currentStepTitle = t(`fusionSteps.${currentLevel.level}.title`);
  const currentStepBody = t(`fusionSteps.${currentLevel.level}.body`);
  const currentForgeStep = activeWeapon.forgeSteps.find((step) => step.level === Math.max(1, fusionLevel));
  const unlockedPotentialNodes = potentialNodesUnlocked(activeWeapon.id, fusionLevel);
  return (
    <div className="space-y-8">
      <DnaPanel className="overflow-hidden p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/items/${categorySlug}`}
            className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-parch transition-colors hover:border-gold/45 hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToWeapons")}
          </Link>
          <CalamityBadge>
            <BookOpenText className="h-3.5 w-3.5 text-crimson-bright" />
            {t("badge")}
          </CalamityBadge>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="font-caps text-[0.68rem] uppercase tracking-[0.3em] text-crimson-bright">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-parch/85 md:text-base">
              {t.rich("intro", { c: code })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-crimson-bright/25 bg-crimson/10 p-4">
              <p className="font-caps text-[0.62rem] uppercase tracking-[0.22em] text-muted">
                {t("catalogLabel")}
              </p>
              <p className="mt-1 font-display text-3xl text-parch">{weapons.length}</p>
              <p className="text-xs text-muted">{t("catalogCount", { total: totalWeaponCount })}</p>
            </div>
            <div className="border border-gold/25 bg-gold/10 p-4">
              <p className="font-caps text-[0.62rem] uppercase tracking-[0.22em] text-muted">
                {t("fusionLabel")}
              </p>
              <p className="mt-1 font-display text-3xl text-parch">0-5</p>
              <p className="text-xs text-muted">{t("fusionTiers")}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <CalamityBadge>
            <Swords className="h-3.5 w-3.5 text-gold" />
            {t("badgeOnePerCharacter")}
          </CalamityBadge>
          <CalamityBadge>
            <Target className="h-3.5 w-3.5 text-hydro" />
            {t("badgePotentialOnly")}
          </CalamityBadge>
          <CalamityBadge>
            <Gem className="h-3.5 w-3.5 text-umbro" />
            {t("badgeSeparateBuilds")}
          </CalamityBadge>
        </div>
      </DnaPanel>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>{t("arsenalLabel")}</DnaSectionLabel>
          <div className="mt-4 grid gap-2">
            {weapons.map((weapon) => {
              const active = weapon.id === activeWeapon.id;
              return (
                <button
                  key={weapon.id}
                  type="button"
                  onClick={() => {
                    setSelectedWeaponId(weapon.id);
                    setFusionLevel(0);
                  }}
                  aria-pressed={active}
                  className={`flex min-h-[76px] items-center gap-3 border p-3 text-left transition-colors ${
                    active
                      ? "border-crimson-bright/55 bg-crimson/15"
                      : "border-white/10 bg-ink/55 hover:border-gold/40"
                  }`}
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center border border-gold/20 bg-panel/70 p-2">
                    <DnaItemIcon
                      src={weapon.icon}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg text-parch">{weapon.name}</span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {weapon.typeLabel} · {weapon.subtypeLabel} · {formatVersion(weapon.openVersion, naLabel)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </DnaPanel>

        <DnaPanel className="p-4 md:p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
            <div className="min-w-0">
              <DnaSectionLabel>{t("activeSheetLabel")}</DnaSectionLabel>
              <div className="mt-5 flex flex-col gap-5 sm:flex-row">
                <div className="grid h-32 w-32 shrink-0 place-items-center border border-crimson-bright/35 bg-ink/70 p-4 shadow-[0_0_35px_rgba(181,48,42,0.16)]">
                  <DnaItemIcon
                    src={activeWeapon.icon}
                    alt={activeWeapon.name}
                    width={128}
                    height={128}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-caps text-[0.62rem] uppercase tracking-[0.24em] text-crimson-bright">
                    {activeWeapon.englishName}
                  </p>
                  <h2 className="mt-1 font-display text-3xl text-parch">{activeWeapon.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-sm border border-white/10 bg-ink/55 px-2 py-1 text-parch/85">
                      {activeWeapon.typeLabel}
                    </span>
                    <span className="rounded-sm border border-white/10 bg-ink/55 px-2 py-1 text-parch/85">
                      {activeWeapon.subtypeLabel}
                    </span>
                    <span className="rounded-sm border border-crimson-bright/35 bg-crimson/10 px-2 py-1 text-crimson-bright">
                      WeaponSubType: Hyper
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-parch/80">
                    {activeWeapon.description ?? t("noDescription")}
                  </p>
                  <Link
                    href={activeWeapon.href}
                    className="mt-4 inline-flex items-center gap-2 rounded-sm border border-gold/35 bg-gold/10 px-3 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
                  >
                    {t("openFullSheet")}
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <DnaStatRow
                  label={t("statAtk")}
                  value={
                    activeWeapon.baseAtk !== null && activeWeapon.maxAtk !== null
                      ? `${activeWeapon.baseAtk} -> ${activeWeapon.maxAtk}`
                      : naLabel
                  }
                />
                <DnaStatRow
                  label={t("statAtkType")}
                  value={
                    activeWeapon.atkType
                      ? ATK_TYPE_KEYS.includes(activeWeapon.atkType)
                        ? t(`atkTypes.${activeWeapon.atkType}`)
                        : activeWeapon.atkType
                      : naLabel
                  }
                />
                <DnaStatRow label={t("statCritRate")} value={formatPercent(activeWeapon.critRate, 0, naLabel)} />
                <DnaStatRow label={t("statCritDamage")} value={formatPercent(activeWeapon.critDamage, 0, naLabel)} />
              </div>
            </div>

            <div className="border border-white/10 bg-ink/55 p-4">
              <DnaSectionLabel>{t("fusionLabel")}</DnaSectionLabel>
              <WeaponFusionTrack
                levels={[0, 1, 2, 3, 4, 5]}
                value={fusionLevel}
                accentHex={CALAMITY_ACCENT_HEX}
                onChange={setFusionLevel}
              />
              <div className="mt-4 border border-crimson-bright/25 bg-crimson/10 p-3">
                <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-crimson-bright">
                  {t("tierLabel", { label: currentStepLabel })}
                </p>
                <p className="mt-1 text-sm font-medium text-parch">{currentStepTitle}</p>
                <p className="mt-2 text-xs leading-relaxed text-parch/75">{currentStepBody}</p>
                <p className="mt-3 text-xs text-muted">
                  {t("unlockedPotentials")}{" "}
                  <span className="text-parch">
                    {unlockedPotentialNodes === null ? t("notDetailed") : unlockedPotentialNodes}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </DnaPanel>
      </section>

      <DnaPanel className="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DnaSectionLabel>{t("potentialsLabel", { name: activeWeapon.name })}</DnaSectionLabel>
          <span className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-muted">
            {t("adjustHint", { label: currentStepLabel })}
          </span>
        </div>
        <div className="mt-5">
          <CalamityPotentialTree weaponItemId={activeWeapon.id} lang={gameLang} fusionLevel={fusionLevel} />
        </div>
      </DnaPanel>

      <section className="grid gap-5 lg:grid-cols-4">
        <FactCard icon={<FlameKindling className="h-5 w-5" />} title={t("factFusionTitle")}>
          {t.rich("factFusionBody", { c: code })}
        </FactCard>
        <FactCard icon={<Sparkles className="h-5 w-5" />} title={t("factPotentialTitle")}>
          {t("factPotentialBody")}
        </FactCard>
        <FactCard icon={<Lock className="h-5 w-5" />} title={t("factLimitTitle")}>
          {t("factLimitBody")}
        </FactCard>
        <FactCard icon={<ShieldCheck className="h-5 w-5" />} title={t("factNotConsonanceTitle")}>
          {t.rich("factNotConsonanceBody", { c: code })}
        </FactCard>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>{t("costLabel")}</DnaSectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-parch/80">{t.rich("costText", { c: code })}</p>

          {fusionLevel === 0 ? (
            <div className="mt-4 border border-white/10 bg-ink/55 p-4 text-sm text-muted">
              {t("costNoneTier0")}
            </div>
          ) : currentForgeStep ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {currentForgeStep.materials.map((material) => (
                <div
                  key={`${currentForgeStep.level}-${material.id}`}
                  className="flex items-center gap-3 border border-white/10 bg-ink/55 p-3"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-gold/20 bg-panel/70 p-1.5">
                    <DnaItemIcon src={material.icon} alt="" width={40} height={40} loading="lazy" className="max-h-full max-w-full object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-parch">{material.name}</span>
                    <span className="text-xs text-muted">{t("materialId", { id: material.id })}</span>
                  </span>
                  <span className="font-caps text-sm text-gold">x{material.quantity}</span>
                </div>
              ))}
              {currentForgeStep.note ? (
                <p className="sm:col-span-2 text-xs text-muted">{currentForgeStep.note}</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 border border-white/10 bg-ink/55 p-4 text-sm text-muted">
              {t("costNotExposed")}
            </div>
          )}
        </DnaPanel>

        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>{t("wedgesLabel")}</DnaSectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-parch/80">
            {t.rich("wedgesText", {
              name: activeWeapon.name,
              poolKey: activeWeapon.wedgePoolKey,
              poolLabel: activeWeapon.wedgePoolLabel,
              c: code,
              n: (chunks) => <span className="text-parch">{chunks}</span>,
            })}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="border border-white/10 bg-ink/55 p-3">
              <p className="text-muted">{t("poolMelee")}</p>
              <p className="mt-1 font-display text-2xl text-parch">{wedgePools.melee}</p>
            </div>
            <div className="border border-white/10 bg-ink/55 p-3">
              <p className="text-muted">{t("poolRanged")}</p>
              <p className="mt-1 font-display text-2xl text-parch">{wedgePools.ranged}</p>
            </div>
            <div className="border border-white/10 bg-ink/55 p-3">
              <p className="text-muted">{t("poolConsonanceMelee")}</p>
              <p className="mt-1 font-display text-2xl text-parch">{wedgePools.consonanceMelee}</p>
            </div>
            <div className="border border-white/10 bg-ink/55 p-3">
              <p className="text-muted">{t("poolConsonanceRanged")}</p>
              <p className="mt-1 font-display text-2xl text-parch">{wedgePools.consonanceRanged}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {activeWeapon.wedgeBuildSlots.map((slot) => (
              <Link
                key={`${activeWeapon.id}-${slot.position}`}
                href={slot.href ?? "/items/mods"}
                className="group border border-white/10 bg-ink/55 p-2 transition-colors hover:border-gold/40"
              >
                <div className="flex h-12 items-center justify-center">
                  <DnaItemIcon src={slot.icon} alt="" width={48} height={48} loading="lazy" className="max-h-full max-w-full object-contain" />
                </div>
                <p className="mt-2 line-clamp-2 min-h-8 text-center text-[11px] leading-tight text-parch/85 group-hover:text-gold">
                  {slot.position}. {slot.name}
                </p>
              </Link>
            ))}
          </div>
        </DnaPanel>
      </section>

      <DnaPanel className="p-4 md:p-5">
        <DnaSectionLabel>{t("dataLabel")}</DnaSectionLabel>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FactCard icon={<BadgeInfo className="h-5 w-5" />} title={t("dataWeaponTitle")}>
            {t.rich("dataWeaponBody", { c: code })}
          </FactCard>
          <FactCard icon={<Zap className="h-5 w-5" />} title={t("dataBattleWeaponTitle")}>
            {t.rich("dataBattleWeaponBody", { c: code })}
          </FactCard>
          <FactCard icon={<GitBranch className="h-5 w-5" />} title={t("dataSkillTreeTitle")}>
            {t.rich("dataSkillTreeBody", { c: code })}
          </FactCard>
          <FactCard icon={<Wrench className="h-5 w-5" />} title={t("dataCardLevelTitle")}>
            {t.rich("dataCardLevelBody", { c: code })}
          </FactCard>
        </div>
      </DnaPanel>
    </div>
  );
}
