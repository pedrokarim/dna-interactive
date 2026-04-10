"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { type ComponentType, Fragment, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Heart,
  Image as ImageIcon,
  Languages,
  Layers,
  Settings,
  Shield,
  Sparkles,
  Swords,
  X,
  ZoomIn,
} from "lucide-react";
import { useAtom } from "jotai";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import {
  getAllCharacters,
  getCharacterTranslation,
  getLanguageLabel,
  getStatAtLevel,
  normalizeLanguageCodes,
} from "@/lib/characters/catalog";
import type {
  CharacterAddonAttr,
  CharacterRecord,
  CharactersCatalog,
  LevelUpCurves,
} from "@/lib/characters/types";
import type {
  CharacterBuild,
  BuildDemonWedgeSlot,
} from "@/lib/characters/builds";
import {
  getArmoryCircle,
  getElementIcon,
  getTrackIcon,
  ARMORY_DEFAULT_ICON,
  ARMORY_MOD_GLOW,
} from "@/lib/characters/builds";
import {
  charactersFavoritesAtom,
  toggleCharacterFavoriteAtom,
} from "@/lib/store";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CharacterDetailClientProps = {
  catalog: CharactersCatalog;
  character: CharacterRecord;
  levelUpCurves: LevelUpCurves;
  builds?: CharacterBuild[];
};

// ---------------------------------------------------------------------------
// Visual constants (existing)
// ---------------------------------------------------------------------------

const ELEMENT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  Fire: { border: "border-red-500/50", bg: "bg-red-500/15", text: "text-red-200" },
  Water: { border: "border-blue-400/50", bg: "bg-blue-400/15", text: "text-blue-200" },
  Thunder: { border: "border-violet-400/50", bg: "bg-violet-400/15", text: "text-violet-200" },
  Wind: { border: "border-emerald-400/50", bg: "bg-emerald-400/15", text: "text-emerald-200" },
  Light: { border: "border-amber-400/50", bg: "bg-amber-400/15", text: "text-amber-200" },
  Dark: { border: "border-indigo-400/50", bg: "bg-indigo-400/15", text: "text-indigo-200" },
};

const ELEMENT_AMBIENT: Record<string, string> = {
  Fire: "rgba(239, 68, 68, 0.07)",
  Water: "rgba(96, 165, 250, 0.07)",
  Thunder: "rgba(167, 139, 250, 0.07)",
  Wind: "rgba(52, 211, 153, 0.07)",
  Light: "rgba(251, 191, 36, 0.06)",
  Dark: "rgba(129, 140, 248, 0.07)",
};

const ELEMENT_ICONS: Record<string, string> = {
  Fire: "/assets/items/mods/T_Armory_Fire.png",
  Water: "/assets/items/mods/T_Armory_Water.png",
  Thunder: "/assets/items/mods/T_Armory_Thunder.png",
  Wind: "/assets/items/mods/T_Armory_Wind.png",
  Light: "/assets/items/mods/T_Armory_Light.png",
  Dark: "/assets/items/mods/T_Armory_Dark.png",
};

const ELEMENT_BAR_COLORS: Record<string, string> = {
  Fire: "from-red-600/80 to-red-400/60",
  Water: "from-blue-600/80 to-blue-400/60",
  Thunder: "from-violet-600/80 to-violet-400/60",
  Wind: "from-emerald-600/80 to-emerald-400/60",
  Light: "from-amber-600/80 to-amber-400/60",
  Dark: "from-indigo-600/80 to-indigo-400/60",
};

const RARITY_COLORS: Record<number, string> = {
  5: "text-amber-300",
  4: "text-violet-300",
  3: "text-blue-300",
};

const ELEMENT_RGB: Record<string, string> = {
  Fire: "239, 68, 68",
  Water: "96, 165, 250",
  Thunder: "167, 139, 250",
  Wind: "52, 211, 153",
  Light: "251, 191, 36",
  Dark: "129, 140, 248",
};

type PortraitType = "gacha" | "head" | "icon" | "bust" | "phantom" | "charpiece";

const PORTRAIT_LABELS: Record<PortraitType, string> = {
  gacha: "Gacha",
  head: "Portrait",
  icon: "Icone",
  bust: "Bust",
  phantom: "Phantom",
  charpiece: "Intron",
};

// ---------------------------------------------------------------------------
// Tab system — add new tabs here
// ---------------------------------------------------------------------------

const TAB_IDS = ["stats", "build", "portraits", "intron", "translations", "tech"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_CONFIG: { id: TabId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "stats", label: "Attributs", icon: BarChart3 },
  { id: "build", label: "Build", icon: Swords },
  { id: "portraits", label: "Portraits", icon: ImageIcon },
  { id: "intron", label: "Intron", icon: Layers },
  { id: "translations", label: "Traductions", icon: Languages },
  { id: "tech", label: "Technique", icon: Settings },
];

// ---------------------------------------------------------------------------
// Stats labels & formatting
// ---------------------------------------------------------------------------

const ATTR_LABELS: Record<string, string> = {
  ATK: "ATQ",
  ATK_Fire: "ATQ Feu",
  ATK_Water: "ATQ Eau",
  ATK_Thunder: "ATQ Foudre",
  ATK_Wind: "ATQ Vent",
  ATK_Light: "ATQ Lumiere",
  ATK_Dark: "ATQ Ombre",
  ATK_Slash: "ATQ Tranchant",
  ATK_Smash: "ATQ Contondant",
  ATK_Spike: "ATQ Percant",
  ATK_Default: "ATQ",
  DEF: "Defense",
  MaxHp: "PV Max",
  MaxES: "Bouclier",
  MaxSp: "Lucidite",
  SkillIntensity: "Intensite",
  SkillEfficiency: "Efficacite",
  SkillSustain: "Endurance",
  SkillRange: "Portee",
  SkillSpeed: "Vitesse comp.",
  StrongValue: "Vigueur",
  EnmityValue: "Tenacite",
  WeaponCRIModifierRate: "Taux critique",
  MultiShootModifierRate: "Multi-tir",
};

const POSITIONING_STYLES: Record<string, { label: string; className: string }> = {
  DPS: { label: "DPS", className: "border-red-500/40 bg-red-500/10 text-red-200" },
  Support: { label: "Support", className: "border-green-500/40 bg-green-500/10 text-green-200" },
  Uweapon: { label: "Arme ultime", className: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" },
  WeaponDPS: { label: "DPS Arme", className: "border-amber-500/40 bg-amber-500/10 text-amber-200" },
};

function formatAddonValue(attr: CharacterAddonAttr): string {
  if (attr.rate !== undefined) {
    const pct = attr.rate * 100;
    return `+${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
  }
  if (attr.value !== undefined) {
    return `+${attr.value}`;
  }
  return "";
}

// ---------------------------------------------------------------------------
// StatBar — reusable stat row with label, value, and progress bar
// ---------------------------------------------------------------------------

function StatBar({
  label,
  value,
  maxValue,
  icon,
  barColorClass,
}: {
  label: string;
  value: number;
  maxValue: number;
  icon: React.ReactNode;
  barColorClass: string;
}) {
  const percent = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/80">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-slate-300">{label}</span>
          <span className="text-sm font-semibold tabular-nums text-white">{value}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-300 ${barColorClass}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Build tab
// ---------------------------------------------------------------------------

function BuildLocalizedText({
  texts,
  lang,
}: {
  texts: Record<string, string>;
  lang: string;
}) {
  const value =
    texts[lang.toUpperCase()] ??
    texts.FR ??
    texts.EN ??
    Object.values(texts)[0] ??
    null;
  return value ? <>{value}</> : null;
}

const ELEMENT_BORDER_COLORS: Record<string, string> = {
  Thunder: "border-violet-500/70 shadow-violet-500/20",
  Water: "border-blue-400/70 shadow-blue-400/20",
  Wind: "border-emerald-400/70 shadow-emerald-400/20",
  Fire: "border-amber-400/70 shadow-amber-400/20",
  Light: "border-yellow-200/70 shadow-yellow-200/20",
  Dark: "border-indigo-400/70 shadow-indigo-400/20",
};

const ELEMENT_GLOW_COLORS: Record<string, string> = {
  Thunder: "from-violet-500/15 to-violet-900/30",
  Water: "from-blue-500/15 to-blue-900/30",
  Wind: "from-emerald-500/15 to-emerald-900/30",
  Fire: "from-amber-500/15 to-amber-900/30",
  Light: "from-yellow-300/15 to-yellow-800/30",
  Dark: "from-indigo-500/15 to-indigo-900/30",
};

const CLIP_LEFT = "polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)";
const CLIP_RIGHT = "polygon(0% 0%, 85% 0%, 100% 100%, 15% 100%)";

function DemonWedgeSlotCard({
  slot,
  elementKey,
  side,
  showTrackAdjust = false,
}: {
  slot: BuildDemonWedgeSlot;
  elementKey: string;
  side: "left" | "right";
  showTrackAdjust?: boolean;
}) {
  const td = useTranslations('characterDetail');
  const icon = slot.item?.icon ?? ARMORY_DEFAULT_ICON;
  const name = slot.item?.name ?? td('demonWedgeEmpty');
  const href = slot.item?.href;
  const borderColor = ELEMENT_BORDER_COLORS[elementKey] ?? ELEMENT_BORDER_COLORS.Water;
  const glowColor = ELEMENT_GLOW_COLORS[elementKey] ?? ELEMENT_GLOW_COLORS.Water;
  const clip = side === "left" ? CLIP_LEFT : CLIP_RIGHT;
  const polarityIconSrc = getTrackIcon(slot.item?.polarity ?? null);
  const trackAdjustIconSrc = slot.track !== null ? getTrackIcon(slot.track) : null;
  const topSide = side === "left" ? "right-1.5" : "left-1.5";
  const bottomSide = side === "left" ? "left-1.5" : "right-1.5";

  const card = (
    <div
      className={`relative h-36 w-[6.5rem] border-2 shadow-lg sm:h-44 sm:w-32 ${borderColor}`}
      style={{
        clipPath: clip,
        background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.95))",
      }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-b ${glowColor}`}
        style={{ clipPath: clip }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={icon}
          alt={name}
          className="h-14 w-14 object-contain drop-shadow-lg sm:h-[4.5rem] sm:w-[4.5rem]"
        />
      </div>
      {polarityIconSrc && (
        <img
          src={polarityIconSrc}
          alt=""
          className={`absolute top-1.5 h-5 w-5 object-contain opacity-80 sm:h-6 sm:w-6 ${topSide}`}
        />
      )}
      {showTrackAdjust && slot.track !== null && (
        <div className={`absolute bottom-2 flex h-6 w-6 items-center justify-center rounded border border-amber-400/50 bg-slate-900/90 sm:h-7 sm:w-7 ${bottomSide}`}>
          {trackAdjustIconSrc ? (
            <img src={trackAdjustIconSrc} alt="" className="h-4 w-4 object-contain sm:h-5 sm:w-5" />
          ) : (
            <span className="text-xs text-red-400">✖</span>
          )}
        </div>
      )}
    </div>
  );

  const tooltip = slot.item ? (
    <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-sm shadow-[0_20px_40px_rgba(2,6,23,0.65)] group-hover:block">
      <p className="font-medium text-slate-100">{name}</p>
      <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
        <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-200">
          #{slot.item.modId}
        </span>
        {slot.item.rarity !== null && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">
            {slot.item.rarity}★
          </span>
        )}
        {slot.item.element && (
          <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-200">
            {slot.item.element}
          </span>
        )}
      </div>
      {slot.item.description && (
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{slot.item.description}</p>
      )}
    </div>
  ) : null;

  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      {href ? (
        <Link href={href} className="block transition-transform duration-150 hover:scale-105">
          {card}
        </Link>
      ) : (
        card
      )}
      <p className="max-w-[8rem] truncate text-center text-xs text-slate-300">{name}</p>
      {tooltip}
    </div>
  );
}

function DemonWedgeCenterSlot({
  centerItem,
  affinity,
  elementKey,
  lang,
}: {
  centerItem: import("@/lib/characters/builds").ResolvedItemRef | null;
  affinity: Record<string, string>;
  elementKey: string;
  lang: string;
}) {
  const circleSrc = getArmoryCircle(elementKey);
  const icon = centerItem?.icon ?? ARMORY_DEFAULT_ICON;
  const name = centerItem?.name ?? null;
  const href = centerItem?.href;

  const circle = (
    <div className="relative h-28 w-28 sm:h-32 sm:w-32">
      <img src={circleSrc} alt="" className="absolute inset-0 h-full w-full object-contain opacity-60" />
      <img src={ARMORY_MOD_GLOW} alt="" className="absolute inset-0 h-full w-full object-contain opacity-30" />
      <img src={icon} alt={name ?? ""} className="absolute inset-[18%] h-[64%] w-[64%] object-contain drop-shadow-lg" />
    </div>
  );

  return (
    <div className="group relative flex flex-col items-center gap-2 px-2">
      {href ? (
        <Link href={href} className="block transition-transform duration-150 hover:scale-105">
          {circle}
        </Link>
      ) : (
        circle
      )}
      <p className="max-w-[8rem] text-center text-xs font-medium text-slate-300">
        <BuildLocalizedText texts={affinity} lang={lang} />
      </p>
      {centerItem && (
        <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-sm shadow-[0_20px_40px_rgba(2,6,23,0.65)] group-hover:block">
          <p className="font-medium text-slate-100">{name}</p>
          <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
            <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-200">
              #{centerItem.modId}
            </span>
            {centerItem.rarity !== null && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                {centerItem.rarity}★
              </span>
            )}
          </div>
          {centerItem.description && (
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{centerItem.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

function DemonWedgeLayout({
  slots,
  centerItem,
  affinity,
  elementKey,
  lang,
  showTrackAdjust = false,
}: {
  slots: BuildDemonWedgeSlot[];
  centerItem: import("@/lib/characters/builds").ResolvedItemRef | null;
  affinity: Record<string, string>;
  elementKey: string;
  lang: string;
  showTrackAdjust?: boolean;
}) {
  const topLeft = slots.filter((s) => s.position >= 1 && s.position <= 2);
  const topRight = slots.filter((s) => s.position >= 3 && s.position <= 4);
  const bottomLeft = slots.filter((s) => s.position >= 5 && s.position <= 6);
  const bottomRight = slots.filter((s) => s.position >= 7 && s.position <= 8);

  return (
    <div className="flex flex-col items-center gap-3 md:gap-6">
      {/* Desktop layout */}
      <div className="hidden w-full max-w-4xl items-center justify-center gap-6 md:flex">
        {/* Left column — parallelograms lean right */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {topLeft.map((s) => (
              <DemonWedgeSlotCard key={s.position} slot={s} elementKey={elementKey} side="left" showTrackAdjust={showTrackAdjust} />
            ))}
          </div>
          <div className="flex gap-2">
            {bottomLeft.map((s) => (
              <DemonWedgeSlotCard key={s.position} slot={s} elementKey={elementKey} side="left" showTrackAdjust={showTrackAdjust} />
            ))}
          </div>
        </div>

        {/* Center — actual demon wedge in a circle */}
        <DemonWedgeCenterSlot centerItem={centerItem} affinity={affinity} elementKey={elementKey} lang={lang} />

        {/* Right column — parallelograms lean left (mirrored) */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {topRight.map((s) => (
              <DemonWedgeSlotCard key={s.position} slot={s} elementKey={elementKey} side="right" showTrackAdjust={showTrackAdjust} />
            ))}
          </div>
          <div className="flex gap-2">
            {bottomRight.map((s) => (
              <DemonWedgeSlotCard key={s.position} slot={s} elementKey={elementKey} side="right" showTrackAdjust={showTrackAdjust} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile layout — 90° rotation:
          - Left column = desktop top row (positions 1,2,3,4 top-to-bottom)
          - Right column = desktop bottom row (positions 5,6,7,8 top-to-bottom)
          - Center wedge spans both columns, vertically in the middle */}
      <div className="w-full md:hidden">
        <details className="group mb-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 open:bg-indigo-500/10">
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-indigo-200 list-none [&::-webkit-details-marker]:hidden">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">Comment lire ce layout sur mobile ?</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <div className="border-t border-indigo-500/20 px-3 py-2 text-xs leading-relaxed text-slate-300">
            L&apos;affichage est tourné pour tenir sur l&apos;écran.
            <br />
            <strong className="text-indigo-200">Colonne gauche</strong> = ligne du <strong>haut</strong> du layout desktop (emplacements 1–4).
            <br />
            <strong className="text-indigo-200">Colonne droite</strong> = ligne du <strong>bas</strong> (emplacements 5–8).
          </div>
        </details>

        <div className="grid grid-cols-2 place-items-center gap-3">
          {/* Top rows — desktop top row split into left column */}
          {[0, 1].map((i) => (
            <Fragment key={`top-pair-${i}`}>
              {topLeft[i] ? (
                <DemonWedgeSlotCard slot={topLeft[i]} elementKey={elementKey} side="left" showTrackAdjust={showTrackAdjust} />
              ) : (
                <div />
              )}
              {bottomLeft[i] ? (
                <DemonWedgeSlotCard slot={bottomLeft[i]} elementKey={elementKey} side="right" showTrackAdjust={showTrackAdjust} />
              ) : (
                <div />
              )}
            </Fragment>
          ))}

          {/* Center wedge */}
          <div className="col-span-2 flex justify-center py-2">
            <DemonWedgeCenterSlot centerItem={centerItem} affinity={affinity} elementKey={elementKey} lang={lang} />
          </div>

          {/* Bottom rows — desktop bottom row split into right column */}
          {[0, 1].map((i) => (
            <Fragment key={`bottom-pair-${i}`}>
              {topRight[i] ? (
                <DemonWedgeSlotCard slot={topRight[i]} elementKey={elementKey} side="left" showTrackAdjust={showTrackAdjust} />
              ) : (
                <div />
              )}
              {bottomRight[i] ? (
                <DemonWedgeSlotCard slot={bottomRight[i]} elementKey={elementKey} side="right" showTrackAdjust={showTrackAdjust} />
              ) : (
                <div />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function BuildTabContent({
  builds,
  characterElement,
  selectedLanguage,
  onNavigateToStats,
  skillIcons,
}: {
  builds: CharacterBuild[];
  characterElement: string;
  selectedLanguage: string;
  onNavigateToStats?: () => void;
  skillIcons?: { skill1: { publicPath: string | null }; skill2: { publicPath: string | null }; skill3: { publicPath: string | null } };
}) {
  const t = useTranslations('characterDetail');
  const [activeBuildIndex, setActiveBuildIndex] = useState(0);
  const [showTrackAdjust, setShowTrackAdjust] = useState(true);

  if (builds.length === 0) {
    return (
      <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5 md:p-8 text-center">
        <Swords className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 text-sm text-slate-400">
          {t('noBuildAvailable')}
        </p>
      </section>
    );
  }

  const build = builds[activeBuildIndex] ?? builds[0];

  const hasWeapons = build.weapons.melee.length > 0 || build.weapons.ranged.length > 0;
  const hasDemonWedges = build.demonWedges.slots.length > 0;
  const hasConsonance = build.consonanceWeapon !== null;
  const hasTeam = build.team.length > 0;
  const hasGenimon = build.genimon.length > 0;
  const hasStats = build.statsPriority.length > 0;
  const hasSkills = build.skillPriority.length > 0;
  const hasNotes = Object.keys(build.notes).length > 0;

  return (
    <div className="space-y-3 md:space-y-5">
      {/* Build selector (if multiple) */}
      {builds.length > 1 && (
        <div className="flex gap-2">
          {builds.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveBuildIndex(i)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                i === activeBuildIndex
                  ? "border border-indigo-400/40 bg-indigo-500/20 text-indigo-100"
                  : "border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <BuildLocalizedText texts={b.buildName} lang={selectedLanguage} />
            </button>
          ))}
        </div>
      )}

      {/* --- Weapons --- */}
      {hasWeapons && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
            <Swords className="h-4 w-4 text-indigo-400/80" />
            {t('weaponsTitle')}
          </h2>
          <div className="mt-4 space-y-4">
            {(["melee", "ranged"] as const).map((type) => {
              const weapons = build.weapons[type];
              if (weapons.length === 0) return null;
              return (
                <div key={type}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                    {type === "melee" ? t('weaponMelee') : t('weaponRanged')}
                  </h3>
                  <div className="space-y-2">
                    {weapons.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-950/55 px-4 py-3"
                      >
                        {w.item ? (
                          <Link
                            href={w.item.href}
                            className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-indigo-200"
                          >
                            <img
                              src={w.item.icon}
                              alt=""
                              className="h-10 w-10 shrink-0 object-contain"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-100">
                                {w.item.name}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                <BuildLocalizedText texts={w.note} lang={selectedLanguage} />
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <p className="text-sm text-slate-500">{t('weaponItemNotFound')}</p>
                        )}
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            w.rank === "best"
                              ? "border border-amber-400/40 bg-amber-500/15 text-amber-200"
                              : "border border-slate-600/80 bg-slate-800/40 text-slate-300"
                          }`}
                        >
                          {w.rank === "best" ? t('weaponBest') : t('weaponAlt')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- Demon Wedges (game layout) --- */}
      {hasDemonWedges && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
              <Shield className="h-4 w-4 text-indigo-400/80" />
              {t('demonWedgesTitle')}
            </h2>
            {build.demonWedges.slots.some((s) => s.track !== null) && (
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => setShowTrackAdjust((prev) => !prev)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    showTrackAdjust
                      ? "border border-amber-400/50 bg-amber-500/15 text-amber-200"
                      : "border border-slate-600/80 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: showTrackAdjust ? "#fbbf24" : "#64748b" }} />
                  {t('demonWedgeTrackAdjust')}
                </button>
                <div className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-64 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-xs leading-relaxed text-slate-400 shadow-[0_20px_40px_rgba(2,6,23,0.65)] group-hover:block">
                  {t('demonWedgeTrackTooltip')}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6">
            <DemonWedgeLayout
              slots={build.demonWedges.slots}
              centerItem={build.demonWedges.centerItem}
              affinity={build.demonWedges.affinity}
              elementKey={characterElement}
              lang={selectedLanguage}
              showTrackAdjust={showTrackAdjust}
            />
          </div>
          {Object.keys(build.demonWedges.note).length > 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              <BuildLocalizedText texts={build.demonWedges.note} lang={selectedLanguage} />
            </p>
          )}

        </section>
      )}

      {/* --- Consonance Weapon --- */}
      {hasConsonance && build.consonanceWeapon && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
            <Swords className="h-4 w-4 text-indigo-400/80" />
            {t('consonanceTitle')}
          </h2>
          {build.consonanceWeapon.slots.length > 0 && (() => {
            const cw = build.consonanceWeapon!;
            const weaponIcon = cw.icon;

            const renderSlot = (s: typeof cw.slots[number], idx: number, clip: string) => {
              const card = (
                <div
                  className="relative flex h-36 w-[6.5rem] items-center justify-center border-2 border-purple-500/50 shadow-lg shadow-purple-500/20 sm:h-44 sm:w-32"
                  style={{ clipPath: clip, background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,20,50,0.95))" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/15 to-purple-900/30" style={{ clipPath: clip }} />
                  <img src={s.icon} alt={s.name} className="h-14 w-14 object-contain drop-shadow-lg sm:h-[4.5rem] sm:w-[4.5rem]" />
                </div>
              );
              return (
                <div key={idx} className="group relative flex flex-col items-center gap-1.5">
                  {s.href ? (
                    <Link href={s.href} className="block transition-transform duration-150 hover:scale-105">{card}</Link>
                  ) : card}
                  <p className="max-w-[8rem] truncate text-center text-xs text-slate-300">{s.name}</p>
                  <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-sm shadow-[0_20px_40px_rgba(2,6,23,0.65)] group-hover:block">
                    <p className="font-medium text-slate-100">{s.name}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                      <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-200">#{s.modId}</span>
                      {s.rarity !== null && (
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">{s.rarity}★</span>
                      )}
                    </div>
                    {s.description && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">{s.description}</p>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div className="mt-6 flex flex-col items-center gap-6">
                {/* Desktop */}
                <div className="hidden items-center justify-center gap-6 md:flex">
                  <div className="flex gap-3">
                    {cw.slots.slice(0, 2).map((s, i) => renderSlot(s, i, CLIP_LEFT))}
                  </div>
                  <div className="group relative">
                    <button
                      type="button"
                      onClick={onNavigateToStats}
                      className="flex flex-col items-center gap-2 px-4 transition-transform duration-150 hover:scale-105"
                    >
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-purple-400/50 bg-purple-500/10 shadow-lg shadow-purple-500/20 sm:h-32 sm:w-32">
                        {weaponIcon ? (
                          <img src={weaponIcon} alt="" className="h-16 w-16 object-contain drop-shadow-lg sm:h-20 sm:w-20" />
                        ) : (
                          <Swords className="h-12 w-12 text-purple-300 sm:h-14 sm:w-14" />
                        )}
                      </div>
                      <p className="max-w-[10rem] text-center text-sm font-medium text-purple-200">
                        <BuildLocalizedText texts={cw.name} lang={selectedLanguage} />
                      </p>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-56 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-sm shadow-[0_20px_40px_rgba(2,6,23,0.65)] group-hover:block">
                      <p className="font-medium text-purple-200">
                        <BuildLocalizedText texts={cw.name} lang={selectedLanguage} />
                      </p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {t('consonanceTooltip')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {cw.slots.slice(2, 4).map((s, i) => renderSlot(s, i, CLIP_RIGHT))}
                  </div>
                </div>
                {/* Mobile */}
                <div className="grid w-full grid-cols-2 place-items-center gap-4 md:hidden">
                  {cw.slots.map((s, i) => renderSlot(s, i, i < 2 ? CLIP_LEFT : CLIP_RIGHT))}
                  <div className="col-span-2 flex flex-col items-center gap-1">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-purple-400/50 bg-purple-500/10">
                      {weaponIcon ? (
                        <img src={weaponIcon} alt="" className="h-12 w-12 object-contain" />
                      ) : (
                        <Swords className="h-10 w-10 text-purple-300" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-purple-200">
                      <BuildLocalizedText texts={cw.name} lang={selectedLanguage} />
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* --- Stats priority --- */}
      {hasStats && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
            <BarChart3 className="h-4 w-4 text-indigo-400/80" />
            {t('statsPriorityTitle')}
          </h2>
          <ol className="mt-4 space-y-2">
            {build.statsPriority.map((stat, i) => (
              <li
                key={stat}
                className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-950/55 px-4 py-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/25 text-xs font-bold text-indigo-200">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-100">
                  {ATTR_LABELS[stat] ?? stat}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* --- Team --- */}
      {hasTeam && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
            <Sparkles className="h-4 w-4 text-indigo-400/80" />
            {t('teamTitle')}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {build.team.map((tm, i) => {
              const ec = tm.character
                ? ELEMENT_COLORS[tm.character.element.key] ?? ELEMENT_COLORS.Water
                : ELEMENT_COLORS.Water;
              return (
                <div
                  key={i}
                  className={`rounded-lg border ${ec.border} ${ec.bg} p-3`}
                >
                  {tm.character ? (
                    <Link
                      href={tm.character.href}
                      className="flex items-center gap-3 transition-colors hover:text-indigo-200"
                    >
                      {tm.character.portrait && (
                        <img
                          src={tm.character.portrait}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-full border border-slate-600 object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {tm.character.name}
                        </p>
                        <p className="text-xs text-slate-300">{tm.role}</p>
                        <p className="truncate text-xs text-slate-400">
                          <BuildLocalizedText texts={tm.note} lang={selectedLanguage} />
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <p className="text-sm text-slate-500">{t('teamCharNotFound')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- Genimon --- */}
      {hasGenimon && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <h2 className="text-base md:text-lg font-semibold text-white">{t('genimonTitle')}</h2>
          <div className="mt-4 space-y-2">
            {build.genimon.map((g, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-950/55 px-4 py-3"
              >
                {g.item ? (
                  <Link
                    href={g.item.href}
                    className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-indigo-200"
                  >
                    <img
                      src={g.item.icon}
                      alt=""
                      className="h-10 w-10 shrink-0 object-contain"
                    />
                    <p className="truncate text-sm font-medium text-slate-100">{g.item.name}</p>
                  </Link>
                ) : (
                  <p className="text-sm text-slate-500">{t('genimonNotFound')}</p>
                )}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    g.rank === "best"
                      ? "border border-amber-400/40 bg-amber-500/15 text-amber-200"
                      : "border border-slate-600/80 bg-slate-800/40 text-slate-300"
                  }`}
                >
                  {g.rank === "best" ? "Best" : "Alt"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- Skill priority --- */}
      {hasSkills && (() => {
        const rgb = ELEMENT_RGB[characterElement] ?? ELEMENT_RGB.Water;
        const sorted = build.skillPriority.slice().sort((a, b) => b.priority - a.priority);
        return (
          <section className="relative py-6">
            <h2 className="mb-8 text-base md:text-lg font-semibold text-white">{t('skillPriorityTitle')}</h2>

            <div className="relative ml-4 md:ml-8">
              {/* Vertical connecting vine */}
              <div
                className="absolute left-7 top-0 bottom-0 w-px"
                style={{ background: `linear-gradient(to bottom, rgba(${rgb}, 0.4), rgba(${rgb}, 0.08) 80%, transparent)` }}
              />

              <div className="flex flex-col gap-10">
                {sorted.map((s, i) => {
                  const idx = s.skillIndex;
                  const iconKey = idx === 1 ? "skill1" : idx === 2 ? "skill2" : idx === 3 ? "skill3" : null;
                  const iconSrc = iconKey ? skillIcons?.[iconKey]?.publicPath : null;
                  const isTop = i === 0;

                  return (
                    <div
                      key={i}
                      className="relative flex items-center gap-5"
                      style={{ paddingLeft: `${i * 20}px` }}
                    >
                      {/* Floating circle */}
                      <div
                        className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                        style={{
                          border: `2px solid rgba(${rgb}, ${isTop ? 0.6 : 0.2})`,
                          boxShadow: isTop ? `0 0 20px rgba(${rgb}, 0.25), inset 0 0 12px rgba(${rgb}, 0.1)` : "none",
                          background: isTop
                            ? `radial-gradient(circle at center, rgba(${rgb}, 0.12), rgba(15, 23, 42, 0.9))`
                            : "rgba(15, 23, 42, 0.6)",
                        }}
                      >
                        {iconSrc ? (
                          <img
                            src={iconSrc}
                            alt=""
                            className="h-8 w-8 object-contain drop-shadow-lg"
                            style={isTop ? { filter: `drop-shadow(0 0 6px rgba(${rgb}, 0.5))` } : undefined}
                          />
                        ) : (
                          <span className={`text-xl font-bold ${isTop ? "text-white" : "text-slate-500"}`}>
                            {i + 1}
                          </span>
                        )}

                        {/* Priority rank badge */}
                        <div
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            background: isTop ? `rgba(${rgb}, 0.8)` : "rgba(71, 85, 105, 0.8)",
                            color: isTop ? "#0f172a" : "#cbd5e1",
                          }}
                        >
                          {i + 1}
                        </div>
                      </div>

                      {/* Skill info floating to the right */}
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium ${isTop ? "text-base text-white" : "text-sm text-slate-300"}`}>
                          <BuildLocalizedText texts={s.skillName} lang={selectedLanguage} />
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, j) => (
                              <span
                                key={j}
                                className={`text-[10px] ${j < s.priority ? "text-amber-400" : "text-slate-700"}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="truncate text-xs text-slate-500">
                            <BuildLocalizedText texts={s.note} lang={selectedLanguage} />
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* --- Notes --- */}
      {hasNotes && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <h2 className="text-base md:text-lg font-semibold text-white">{t('notesTitle')}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            <BuildLocalizedText texts={build.notes} lang={selectedLanguage} />
          </p>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CharacterDetailClient({
  catalog,
  character,
  levelUpCurves,
  builds = [],
}: CharacterDetailClientProps) {
  const t = useTranslations('characterDetail');
  const tc = useTranslations('common');
  const [favoriteChars] = useAtom(charactersFavoritesAtom);
  const [, toggleFavorite] = useAtom(toggleCharacterFavoriteAtom);

  // --- Language state ---
  const preferredLanguage = normalizeLanguageCodes(
    [catalog.defaultDetailLanguage],
    catalog.availableLanguages,
    ["FR", "EN"],
  )[0];

  const selectedLanguageParser = useMemo(
    () =>
      parseAsStringLiteral(catalog.availableLanguages)
        .withDefault(preferredLanguage)
        .withOptions({ clearOnDefault: false }),
    [catalog.availableLanguages, preferredLanguage],
  );
  const [selectedLanguage, setSelectedLanguage] = useQueryState(
    "lang",
    selectedLanguageParser,
  );

  const translation = useMemo(
    () =>
      getCharacterTranslation(
        character,
        selectedLanguage,
        catalog.availableLanguages,
      ),
    [character, selectedLanguage, catalog.availableLanguages],
  );

  // --- Tab state ---
  const tabParser = useMemo(
    () => parseAsStringLiteral(TAB_IDS).withDefault("stats" as const),
    [],
  );
  const [activeTab, setActiveTab] = useQueryState("tab", tabParser);

  // --- Character metadata ---
  const isFavorite = favoriteChars.has(character.id);
  const elementStyle = ELEMENT_COLORS[character.element.key];
  const elementIcon = ELEMENT_ICONS[character.element.key];
  const rarityColor = RARITY_COLORS[character.rarity ?? 0] ?? "text-slate-300";

  // --- Portraits ---
  const availablePortraits = useMemo(() => {
    const types: PortraitType[] = ["gacha", "head", "icon", "bust", "phantom", "charpiece"];
    return types.filter((type) => character.portraits[type].publicPath !== null);
  }, [character.portraits]);

  const [activePortrait, setActivePortrait] = useState<PortraitType>(
    availablePortraits.includes("gacha") ? "gacha" : availablePortraits[0] ?? "head",
  );
  const [zoomedPortrait, setZoomedPortrait] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const activePortraitSrc = character.portraits[activePortrait]?.publicPath;

  // --- Prev/Next navigation ---
  const allCharacters = useMemo(() => getAllCharacters(), []);
  const currentIndex = allCharacters.findIndex((c) => c.id === character.id);
  const prevCharacter = currentIndex > 0 ? allCharacters[currentIndex - 1] : null;
  const nextCharacter =
    currentIndex < allCharacters.length - 1 ? allCharacters[currentIndex + 1] : null;

  // --- Stats computation ---
  const maxLevel = character.maxLevel ?? 80;
  const [level, setLevel] = useState(maxLevel);

  const computedStats = useMemo(() => {
    const bs = character.baseStats;
    return {
      atk: getStatAtLevel(bs.atk, bs.atkGrowCurve, level, levelUpCurves),
      def: getStatAtLevel(bs.def, bs.defGrowCurve, level, levelUpCurves),
      maxHp: getStatAtLevel(bs.maxHp, bs.maxHpGrowCurve, level, levelUpCurves),
      maxES: getStatAtLevel(bs.maxES, bs.maxESGrowCurve, level, levelUpCurves),
      maxSp: bs.maxSp,
    };
  }, [character.baseStats, level, levelUpCurves]);

  const maxLevelStats = useMemo(() => {
    const bs = character.baseStats;
    return {
      atk: getStatAtLevel(bs.atk, bs.atkGrowCurve, maxLevel, levelUpCurves),
      def: getStatAtLevel(bs.def, bs.defGrowCurve, maxLevel, levelUpCurves),
      maxHp: getStatAtLevel(bs.maxHp, bs.maxHpGrowCurve, maxLevel, levelUpCurves),
      maxES: getStatAtLevel(bs.maxES, bs.maxESGrowCurve, maxLevel, levelUpCurves),
      maxSp: bs.maxSp,
    };
  }, [character.baseStats, maxLevel, levelUpCurves]);

  const atkLabel = `ATQ ${character.element.label}`;
  const atkBarColor = ELEMENT_BAR_COLORS[character.element.key] ?? "from-slate-600 to-slate-400";

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ================================================================= */}
      {/* Top bar + Hero section (always visible, above tabs)               */}
      {/* ================================================================= */}
      <section className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-4 md:p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/characters"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {tc('backToList')}
            </Link>
            <button
              type="button"
              onClick={() => toggleFavorite(character.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isFavorite
                  ? "text-rose-300 hover:text-rose-200"
                  : "text-slate-300 hover:text-rose-300"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${isFavorite ? "fill-rose-400 text-rose-400" : ""}`}
              />
              {isFavorite ? tc('removeFavorite') : tc('addFavorite')}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {prevCharacter && (
              <Link
                href={`/characters/${prevCharacter.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600/80 px-2 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
                aria-label={t('previousCharacter', { name: prevCharacter.internalName })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            {nextCharacter && (
              <Link
                href={`/characters/${nextCharacter.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600/80 px-2 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
                aria-label={t('nextCharacter', { name: nextCharacter.internalName })}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
              <Languages className="h-4 w-4 text-indigo-400/80" />
              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="bg-transparent text-sm text-slate-100 outline-none"
              >
                {catalog.availableLanguages.map((code) => (
                  <option key={code} value={code} className="bg-slate-900">
                    {getLanguageLabel(code)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hero section */}
        <div className="mt-4 md:mt-6 flex flex-col gap-4 md:gap-6 lg:flex-row">
          {/* Portrait */}
          <div className="relative flex w-full shrink-0 flex-col items-center lg:w-64">
            <div className="relative w-full overflow-hidden rounded-2xl border border-indigo-500/25 bg-slate-950/70">
              {activePortraitSrc ? (
                <img
                  src={activePortraitSrc}
                  alt={`${translation.name ?? character.internalName} - ${PORTRAIT_LABELS[activePortrait]}`}
                  className="max-h-[420px] w-full object-contain"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center">
                  <span className="text-6xl font-bold text-slate-700">
                    {character.internalName[0]}
                  </span>
                </div>
              )}
              {activePortraitSrc && (
                <button
                  type="button"
                  onClick={() =>
                    setZoomedPortrait({
                      src: activePortraitSrc,
                      alt: `${translation.name ?? character.internalName} - ${PORTRAIT_LABELS[activePortrait]}`,
                    })
                  }
                  className="absolute bottom-3 right-3 rounded-full border border-slate-700 bg-slate-900/90 p-2 text-slate-200 transition-all hover:border-indigo-400/60 hover:bg-indigo-500/80 hover:text-white"
                  aria-label="Agrandir le portrait"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              )}
            </div>

            {availablePortraits.length > 1 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {availablePortraits.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActivePortrait(type)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activePortrait === type
                        ? "border border-indigo-400/60 bg-indigo-500/25 text-indigo-100"
                        : "border border-slate-700/60 bg-slate-950/60 text-slate-300 hover:border-indigo-400/30 hover:text-white"
                    }`}
                  >
                    {PORTRAIT_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-indigo-400/80">
                Personnage #{character.charId}
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-white">
                {translation.name ?? character.internalName}
              </h1>
              {translation.subtitle && (
                <p className="mt-1 text-sm md:text-base text-slate-300">
                  {translation.subtitle}
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 text-xs">
              {elementStyle && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${elementStyle.border} ${elementStyle.bg} ${elementStyle.text}`}
                >
                  {elementIcon ? (
                    <img
                      src={elementIcon}
                      alt={character.element.label}
                      className="h-4 w-4 object-contain"
                    />
                  ) : null}
                  {character.element.label}
                </span>
              )}

              {character.rarity && (
                <span
                  className={`rounded-full border border-slate-600/80 px-3 py-1 font-medium ${rarityColor}`}
                >
                  {"★".repeat(character.rarity)} {character.rarity} etoiles
                </span>
              )}

              {character.weaponTags.map((wt) => (
                <span
                  key={wt}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-cyan-100"
                >
                  <Swords className="h-3 w-3" />
                  {wt}
                </span>
              ))}

              {character.consonanceWeapons?.length > 0 &&
                character.consonanceWeapons.map((cw) => {
                  const cwName =
                    cw.translations[selectedLanguage]?.name ??
                    cw.translations.EN?.name ??
                    cw.translations.FR?.name ??
                    `CW #${cw.weaponId}`;
                  return (
                    <span
                      key={cw.weaponId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-500/15 px-3 py-1 text-purple-200"
                    >
                      {cw.icon.publicPath ? (
                        <img src={cw.icon.publicPath} alt="" className="h-4 w-4 object-contain" />
                      ) : (
                        <Swords className="h-3 w-3" />
                      )}
                      {cwName}
                    </span>
                  );
                })}

              {translation.campName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                  <Shield className="h-3 w-3" />
                  {translation.campName}
                </span>
              )}

              {character.maxLevel && (
                <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                  Max Lv {character.maxLevel}
                </span>
              )}
            </div>

            {/* Additional info */}
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {translation.force && (
                <div>
                  <dt className="text-slate-400">Force / Organisation</dt>
                  <dd className="text-slate-100">{translation.force}</dd>
                </div>
              )}
              {translation.birthday && (
                <div>
                  <dt className="text-slate-400">Origine / Nation</dt>
                  <dd className="text-slate-100">{translation.birthday}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-400">Nom interne</dt>
                <dd className="text-slate-100">{character.internalName}</dd>
              </div>
              <div>
                <dt className="text-slate-400">ID</dt>
                <dd className="text-slate-100">{character.charId}</dd>
              </div>
              {character.gender !== null && (
                <div>
                  <dt className="text-slate-400">Genre</dt>
                  <dd className="text-slate-100">
                    {character.gender ? "Feminin" : "Masculin"}
                  </dd>
                </div>
              )}
              {character.unlockRequiredPiece && (
                <div>
                  <dt className="text-slate-400">Pieces pour debloquer</dt>
                  <dd className="mt-1.5">
                    <div className="group/intron relative inline-flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab("intron")}
                        className="relative flex h-16 w-16 items-center justify-center rounded-lg border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/10 transition-transform duration-150 hover:scale-105"
                        style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.95))" }}
                      >
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-indigo-500/15 to-indigo-900/30" />
                        {character.portraits.charpiece?.publicPath ? (
                          <img
                            src={character.portraits.charpiece.publicPath}
                            alt="Intron"
                            className="relative h-10 w-10 object-contain drop-shadow-lg"
                          />
                        ) : (
                          <Layers className="relative h-8 w-8 text-indigo-300" />
                        )}
                      </button>
                      <p className="text-center text-xs text-slate-300">×{character.unlockRequiredPiece}</p>
                      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-56 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-sm shadow-[0_20px_40px_rgba(2,6,23,0.65)] group-hover/intron:block">
                        <p className="font-medium text-slate-100">Piece d&apos;intron</p>
                        <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                          <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-200">#{character.charPieceId}</span>
                          <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-200">{character.intronLevels.length} niveaux</span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          {character.unlockRequiredPiece} pieces necessaires par niveau d&apos;intron. Cliquez pour voir les details.
                        </p>
                      </div>
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Tab bar                                                           */}
      {/* ================================================================= */}
      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-700/70 bg-slate-900/55 p-1.5">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === id
                ? "border border-indigo-400/40 bg-indigo-500/20 text-indigo-100"
                : "border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* ================================================================= */}
      {/* Tab content                                                       */}
      {/* ================================================================= */}

      {/* ---------- Stats / Attributs tab ---------- */}
      {activeTab === "stats" && (
        <section className="space-y-3 md:space-y-5">
          {/* Level slider */}
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">Niveau</h3>
              <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-lg font-bold tabular-nums text-indigo-100">
                {level}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="shrink-0 text-xs text-slate-500">1</span>
              <input
                type="range"
                min={1}
                max={maxLevel}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-800 accent-indigo-500"
              />
              <span className="shrink-0 text-xs text-slate-500">{maxLevel}</span>
            </div>
          </div>

          {/* Base stats */}
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Stats de base
            </h3>
            <div className="mt-4 space-y-3">
              <StatBar
                label={atkLabel}
                value={computedStats.atk}
                maxValue={maxLevelStats.atk}
                icon={
                  elementIcon ? (
                    <img src={elementIcon} alt="" className="h-5 w-5 object-contain" />
                  ) : (
                    <Swords className="h-4 w-4 text-slate-400" />
                  )
                }
                barColorClass={atkBarColor}
              />
              <StatBar
                label="PV Max"
                value={computedStats.maxHp}
                maxValue={maxLevelStats.maxHp}
                icon={<Heart className="h-4 w-4 text-green-400" />}
                barColorClass="from-green-600/80 to-green-400/60"
              />
              <StatBar
                label="Bouclier"
                value={computedStats.maxES}
                maxValue={maxLevelStats.maxES}
                icon={<Shield className="h-4 w-4 text-blue-400" />}
                barColorClass="from-blue-600/80 to-blue-400/60"
              />
              <StatBar
                label="DEF"
                value={computedStats.def}
                maxValue={maxLevelStats.def}
                icon={<Shield className="h-4 w-4 text-amber-400" />}
                barColorClass="from-amber-600/80 to-amber-400/60"
              />
              <StatBar
                label="Lucidite max"
                value={computedStats.maxSp}
                maxValue={maxLevelStats.maxSp}
                icon={<Sparkles className="h-4 w-4 text-violet-400" />}
                barColorClass="from-violet-600/80 to-violet-400/60"
              />
            </div>
          </div>

          {/* Addon attrs (ascension bonuses) */}
          {character.addonAttrs.length > 0 && (
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Bonus d&apos;ascension
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {character.addonAttrs.map((attr) => (
                  <div
                    key={attr.attrId}
                    className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-950/50 px-3 py-2.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/80">
                      <img
                        src={attr.iconPath}
                        alt=""
                        className="h-5 w-5 object-contain brightness-0 invert"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-300">
                        {ATTR_LABELS[attr.attrName] ?? attr.attrName}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-indigo-200">
                      {formatAddonValue(attr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended attrs + Positioning */}
          <div className="grid gap-3 md:gap-5 lg:grid-cols-2">
            {character.recommendAttr.length > 0 && (
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Attributs recommandes
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {character.recommendAttr.map((attr) => (
                    <span
                      key={attr}
                      className="rounded-full border border-slate-600/60 bg-slate-800/60 px-3 py-1 text-xs text-slate-200"
                    >
                      {ATTR_LABELS[attr] ?? attr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {character.positioning.length > 0 && (
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Positionnement
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {character.positioning.map((pos) => {
                    const style = POSITIONING_STYLES[pos];
                    return (
                      <span
                        key={pos}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          style?.className ?? "border-slate-600/60 text-slate-300"
                        }`}
                      >
                        {style?.label ?? pos}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ascension levels */}
          {character.ascensionLevels.length > 0 && (
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Paliers d&apos;ascension
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-1">
                {character.ascensionLevels.map((lvl, i) => (
                  <div key={lvl} className="flex items-center gap-1">
                    <span
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium tabular-nums ${
                        level >= lvl
                          ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-100"
                          : "border-slate-700/50 bg-slate-800/50 text-slate-400"
                      }`}
                    >
                      Nv. {lvl}
                    </span>
                    {i < character.ascensionLevels.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Skill Icons */}
          {(character.skillIcons.skill1.publicPath || character.skillIcons.skill2.publicPath || character.skillIcons.skill3.publicPath) && (
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
              <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
                <Sparkles className="h-4 w-4 text-indigo-400/80" />
                Competences
              </h2>
              <div className="mt-4 flex flex-wrap gap-4">
                {([["skill1", "Comp. 1"], ["skill2", "Comp. 2"], ["skill3", "Comp. 3"]] as const).map(([key, label]) => {
                  const icon = character.skillIcons[key].publicPath;
                  if (!icon) return null;
                  return (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-600/60 bg-slate-800/80">
                        <img src={icon} alt={label} className="h-10 w-10 object-contain" />
                      </div>
                      <span className="text-xs text-slate-400">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consonance Weapon info box */}
          {character.consonanceWeapons?.length > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 md:p-5">
              <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
                <Swords className="h-4 w-4 text-purple-400/80" />
                {t('consonanceTitle')}
              </h2>
              <div className="mt-4 space-y-3">
                {character.consonanceWeapons.map((cw) => {
                  const cwName =
                    cw.translations[selectedLanguage]?.name ??
                    cw.translations.EN?.name ??
                    cw.translations.FR?.name ??
                    `#${cw.weaponId}`;
                  return (
                    <div key={cw.weaponId} className="flex items-center gap-4">
                      {cw.icon.publicPath && (
                        <img src={cw.icon.publicPath} alt={cwName} className="h-16 w-16 shrink-0 object-contain drop-shadow-lg" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-purple-200">{cwName}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                          <span className="rounded-full border border-purple-400/40 bg-purple-500/10 px-2 py-0.5 text-purple-200">
                            {cw.rarity}★
                          </span>
                          <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                            Nv. max 80
                          </span>
                          <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                            ID {cw.weaponId}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---------- Build tab ---------- */}
      {activeTab === "build" && (
        <BuildTabContent
          builds={builds}
          characterElement={character.element.key}
          selectedLanguage={selectedLanguage}
          onNavigateToStats={() => setActiveTab("stats")}
          skillIcons={character.skillIcons}
        />
      )}

      {/* ---------- Portraits tab ---------- */}
      {activeTab === "portraits" && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <h2 className="text-base md:text-base md:text-lg font-semibold text-white">Galerie de portraits</h2>
          {availablePortraits.length > 1 ? (
            <div className="mt-3 md:mt-4 grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {availablePortraits.map((type) => {
                const src = character.portraits[type].publicPath;
                if (!src) return null;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setZoomedPortrait({
                        src,
                        alt: `${translation.name ?? character.internalName} - ${PORTRAIT_LABELS[type]}`,
                      })
                    }
                    className="group overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/60 transition-colors hover:border-indigo-400/40"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={src}
                        alt={`${PORTRAIT_LABELS[type]}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition-colors group-hover:bg-slate-950/30">
                        <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </div>
                    <p className="px-2 py-1.5 text-center text-xs text-slate-300">
                      {PORTRAIT_LABELS[type]}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Aucun portrait supplementaire disponible.
            </p>
          )}
        </section>
      )}

      {/* ---------- Intron tab ---------- */}
      {activeTab === "intron" && (() => {
        const rgb = ELEMENT_RGB[character.element.key] ?? ELEMENT_RGB.Water;
        const intronLevels = character.intronLevels;
        const bustSrc = character.portraits.bust?.publicPath;
        // Vertical offsets (%) from top for each circle
        const CIRCLE_Y = [2, 16, 32, 48, 64, 80];
        // Horizontal offsets — symmetric: 1↔6, 2↔5, 3↔4
        const CIRCLE_X = [8, 42, 62, 62, 42, 8];

        return (
          <section className="py-6">
            <h2 className="mb-8 flex items-center gap-2 text-base md:text-lg font-semibold text-white">
              <Layers className="h-4 w-4 text-indigo-400/80" />
              Niveaux d&apos;intron
            </h2>
            {intronLevels.length > 0 ? (
              <div className="flex gap-6 md:gap-10">
                {/* Left: bust portrait */}
                {bustSrc && (
                  <div className="hidden shrink-0 md:block" style={{ width: "480px" }}>
                    <img
                      src={bustSrc}
                      alt={character.internalName}
                      className="h-auto w-full object-contain"
                      style={{ filter: `drop-shadow(0 0 50px rgba(${rgb}, 0.25))` }}
                    />
                  </div>
                )}

                {/* Right: floating circles constellation */}
                <div className="relative min-h-[520px] flex-1">
                  {/* SVG connecting lines */}
                  <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    {intronLevels.map((_, idx) => {
                      if (idx === 0) return null;
                      const x1 = (CIRCLE_X[idx - 1] ?? 0) + 5;
                      const y1 = (CIRCLE_Y[idx - 1] ?? 0) + 5;
                      const x2 = (CIRCLE_X[idx] ?? 0) + 5;
                      const y2 = (CIRCLE_Y[idx] ?? 0) + 5;
                      const mx = (x1 + x2) / 2;
                      return (
                        <path
                          key={`line-${idx}`}
                          d={`M ${x1}% ${y1}% Q ${mx}% ${(y1 + y2) / 2}% ${x2}% ${y2}%`}
                          fill="none"
                          stroke={`rgba(${rgb}, 0.15)`}
                          strokeWidth="1"
                          strokeDasharray="4 6"
                        />
                      );
                    })}
                  </svg>

                  {/* Circles */}
                  {intronLevels.map((intronLevel, idx) => {
                    const num = idx + 1;
                    const iconSrc = num >= 1 && num <= 6 ? `/assets/ui/intron/intron-${num}.png` : null;
                    const isFirst = idx === 0;

                    return (
                      <div
                        key={`intron-${num}`}
                        className="absolute flex items-center gap-3"
                        style={{
                          left: `${CIRCLE_X[idx] ?? 0}%`,
                          top: `${CIRCLE_Y[idx] ?? 0}%`,
                        }}
                      >
                        {/* Glowing circle */}
                        <div
                          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full"
                          style={{
                            border: `2px solid rgba(${rgb}, ${isFirst ? 0.7 : 0.2})`,
                            boxShadow: isFirst
                              ? `0 0 28px rgba(${rgb}, 0.35), 0 0 56px rgba(${rgb}, 0.12), inset 0 0 16px rgba(${rgb}, 0.12)`
                              : `0 0 10px rgba(${rgb}, 0.06)`,
                            background: isFirst
                              ? `radial-gradient(circle at center, rgba(${rgb}, 0.18), rgba(15, 23, 42, 0.9))`
                              : "rgba(15, 23, 42, 0.4)",
                          }}
                        >
                          {iconSrc ? (
                            <img
                              src={iconSrc}
                              alt={`Intron ${num}`}
                              className="h-14 w-14 object-contain"
                              style={isFirst ? { filter: `drop-shadow(0 0 8px rgba(${rgb}, 0.6))` } : undefined}
                            />
                          ) : (
                            <span className="text-xl font-bold text-slate-500">{num}</span>
                          )}
                        </div>

                        {/* Label */}
                        <div>
                          <p className={`text-xs font-medium ${isFirst ? "text-white" : "text-slate-500"}`}>
                            Intron {num}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            {intronLevel.resourceNum} pieces
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Aucune donnee d&apos;intron disponible.
              </p>
            )}
          </section>
        );
      })()}

      {/* ---------- Translations tab ---------- */}
      {activeTab === "translations" && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
          <h2 className="flex items-center gap-2 text-base md:text-base md:text-lg font-semibold text-white">
            <Languages className="h-5 w-5 text-indigo-400/80" />
            Traductions
          </h2>
          <div className="mt-3 md:mt-4 grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {catalog.availableLanguages.map((langCode) => {
              const tr = character.translations[langCode];
              if (!tr) return null;
              const isActive = langCode === selectedLanguage;
              return (
                <button
                  type="button"
                  key={langCode}
                  onClick={() => setSelectedLanguage(langCode)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    isActive
                      ? "border-indigo-400/50 bg-indigo-500/10"
                      : "border-slate-700/60 bg-slate-950/55 hover:border-indigo-400/30"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    {getLanguageLabel(langCode)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-100">
                    {tr.name ?? "N/A"}
                  </p>
                  {tr.subtitle && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {tr.subtitle}
                    </p>
                  )}
                  {tr.campName && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {tr.campName}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- Technical tab ---------- */}
      {activeTab === "tech" && (
        <section className="grid gap-3 md:gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
            <h2 className="text-base md:text-base md:text-lg font-semibold text-white">Text keys</h2>
            <dl className="mt-3 md:mt-4 space-y-2 md:space-y-3 text-sm">
              {Object.entries(character.textKeys).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-slate-400">{key}</dt>
                  <dd className="text-slate-100">{value ?? "N/A"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
            <h2 className="text-base md:text-base md:text-lg font-semibold text-white">Donnees techniques</h2>
            <dl className="mt-3 md:mt-4 space-y-2 md:space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">ID personnage</dt>
                <dd className="text-slate-100">{character.id}</dd>
              </div>
              <div>
                <dt className="text-slate-400">charId</dt>
                <dd className="text-slate-100">{character.charId}</dd>
              </div>
              <div>
                <dt className="text-slate-400">internalName</dt>
                <dd className="text-slate-100">{character.internalName}</dd>
              </div>
              <div>
                <dt className="text-slate-400">sortPriority</dt>
                <dd className="text-slate-100">{character.sortPriority ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">colorVar</dt>
                <dd className="text-slate-100">{character.colorVar ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">charPieceId</dt>
                <dd className="text-slate-100">{character.charPieceId ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Camp key</dt>
                <dd className="text-slate-100">{character.camp.key}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Camp icon (game)</dt>
                <dd className="break-all text-slate-100">
                  {character.camp.iconGamePath ?? "N/A"}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {/* ================================================================= */}
      {/* Portrait zoom modal                                               */}
      {/* ================================================================= */}
      {zoomedPortrait && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setZoomedPortrait(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Portrait agrandi : ${zoomedPortrait.alt}`}
        >
          <div
            className="max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900/95 shadow-[0_25px_60px_rgba(2,6,23,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 px-4 py-3">
              <p className="text-sm font-medium text-slate-100">
                {zoomedPortrait.alt}
              </p>
              <button
                type="button"
                onClick={() => setZoomedPortrait(null)}
                className="rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label={tc('close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-950/80 p-2">
              <img
                src={zoomedPortrait.src}
                alt={zoomedPortrait.alt}
                className="max-h-[75vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
