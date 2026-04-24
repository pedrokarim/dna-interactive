"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type ComponentType, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileImage,
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
import QuickBuildModal, { QuickBuildCard } from "@/components/characters/QuickBuildModal";
import { useAtom } from "jotai";
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
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
  CharacterSkill,
  CharacterSkillSet,
  CharactersCatalog,
  LevelUpCurves,
} from "@/lib/characters/types";
import { SKILL_LEVEL_MAX, SKILL_LEVEL_MIN } from "@/lib/characters/types";
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
  skillSet?: CharacterSkillSet | null;
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

const TAB_IDS = ["stats", "build", "skills", "portraits", "intron", "translations", "tech"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_CONFIG: { id: TabId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "stats", label: "Attributs", icon: BarChart3 },
  { id: "build", label: "Build", icon: Swords },
  { id: "skills", label: "Competences", icon: Sparkles },
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

      {/* Mobile layout — desktop top/bottom split, each row symmetric:
          - Top half (2 rows): each row pairs topLeft[i] (leans right) with topRight[i] (leans left)
          - Center wedge in the middle
          - Bottom half (2 rows): each row pairs bottomLeft[i] with bottomRight[i] */}
      <div className="flex w-full flex-col items-center gap-3 md:hidden">
        <div className="grid grid-cols-2 place-items-center gap-3">
          {[0, 1].map((i) => (
            <Fragment key={`mobile-top-${i}`}>
              {topLeft[i] ? (
                <DemonWedgeSlotCard slot={topLeft[i]} elementKey={elementKey} side="left" showTrackAdjust={showTrackAdjust} />
              ) : (
                <div />
              )}
              {topRight[i] ? (
                <DemonWedgeSlotCard slot={topRight[i]} elementKey={elementKey} side="right" showTrackAdjust={showTrackAdjust} />
              ) : (
                <div />
              )}
            </Fragment>
          ))}
        </div>

        <DemonWedgeCenterSlot centerItem={centerItem} affinity={affinity} elementKey={elementKey} lang={lang} />

        <div className="grid grid-cols-2 place-items-center gap-3">
          {[0, 1].map((i) => (
            <Fragment key={`mobile-bottom-${i}`}>
              {bottomLeft[i] ? (
                <DemonWedgeSlotCard slot={bottomLeft[i]} elementKey={elementKey} side="left" showTrackAdjust={showTrackAdjust} />
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

// ---------------------------------------------------------------------------
// Skills tab — per-skill card with name, description, stats, and combat terms
// ---------------------------------------------------------------------------

const SKILL_TYPE_LABELS: Record<string, string> = {
  Skill1: "Competence 1",
  Skill2: "Competence 2",
  Skill3: "Competence 3",
  Passive: "Passif",
  ExtraPassive: "Passif supplementaire",
  UltraPassive: "Passif ultime",
  Movement: "Mouvement",
  PhantomPassive: "Passif spectre",
};

function getSkillLocalized<T extends { translations: Record<string, unknown> }>(
  skill: T,
  lang: string,
): T["translations"][string] | null {
  const up = lang.toUpperCase();
  return (skill.translations[up] ??
    skill.translations.EN ??
    skill.translations.FR ??
    Object.values(skill.translations)[0] ??
    null) as T["translations"][string] | null;
}

// Render in-game markup: <H>text</> → highlighted span.
// Game text uses this format to mark special annotations (e.g. "deployed as Combat Partner").
function renderSkillMarkup(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /<H>([\s\S]*?)<\/>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={`h-${idx++}`} className="text-indigo-300">
        {match[1]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function SkillCard({
  skill,
  selectedLanguage,
  elementKey,
  skillLevel,
}: {
  skill: CharacterSkill;
  selectedLanguage: string;
  elementKey: string;
  skillLevel: number;
}) {
  const localized = getSkillLocalized(skill, selectedLanguage);
  if (!localized) return null;
  const typeLabel = skill.skillType ? SKILL_TYPE_LABELS[skill.skillType] ?? skill.skillType : null;
  const rgb = ELEMENT_RGB[elementKey] ?? ELEMENT_RGB.Water;

  // Group params by section if any
  const sections = localized.sections;
  const paramsInSections = new Set<number>();
  for (const s of sections) for (const i of s.indices) paramsInSections.add(i);
  const ungroupedParams = localized.params
    .map((p, i) => ({ param: p, index: i + 1 }))
    .filter((p) => !paramsInSections.has(p.index));

  return (
    <article className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/55">
      <header
        className="flex items-start gap-3 border-b border-slate-800/70 p-4"
        style={{
          background: `linear-gradient(135deg, rgba(${rgb}, 0.12), transparent 60%)`,
        }}
      >
        {skill.iconPublicPath ? (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-600/60 bg-slate-950/70"
            style={{ boxShadow: `0 0 24px rgba(${rgb}, 0.25)` }}
          >
            <img src={skill.iconPublicPath} alt="" className="h-10 w-10 object-contain" />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/70">
            <Sparkles className="h-5 w-5 text-slate-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">
              {localized.name ?? `#${skill.skillId}`}
            </h3>
            {typeLabel && (
              <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-200">
                {typeLabel}
              </span>
            )}
            <span className="rounded-full border border-slate-700/80 bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-400">
              ID {skill.skillId}
            </span>
          </div>
          {localized.description && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {renderSkillMarkup(localized.description)}
            </p>
          )}
        </div>
      </header>

      {(ungroupedParams.length > 0 || sections.length > 0) && (
        <div className="space-y-4 p-4">
          {ungroupedParams.length > 0 && (
            <SkillParamList
              items={ungroupedParams.map(({ param }) => param)}
              skillLevel={skillLevel}
            />
          )}
          {sections.map((section) => {
            const items = section.indices
              .map((idx) => localized.params[idx - 1])
              .filter((p): p is NonNullable<typeof p> => Boolean(p));
            if (items.length === 0) return null;
            return (
              <div key={section.headingKey}>
                {section.heading && (
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                    {section.heading}
                  </h4>
                )}
                <SkillParamList items={items} skillLevel={skillLevel} />
              </div>
            );
          })}
        </div>
      )}

      {localized.combatTerms.length > 0 && (
        <div className="border-t border-slate-800/70 bg-slate-950/30 p-4">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Termes
          </h4>
          <dl className="space-y-2">
            {localized.combatTerms.map((term) => (
              <div key={term.id} className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-100">
                  {term.name ?? term.id}
                </dt>
                {term.explanation && (
                  <dd className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-400">
                    {renderSkillMarkup(term.explanation)}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      )}
    </article>
  );
}

function SkillParamList({
  items,
  skillLevel,
}: {
  items: CharacterSkill["translations"][string]["params"];
  skillLevel: number;
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
      {items.map((p, idx) => {
        const value = p.valuesByLevel[String(skillLevel)] ?? null;
        return (
          <div key={`${p.labelKey ?? "row"}-${idx}`} className="flex items-baseline justify-between gap-2 border-b border-slate-800/40 py-1.5">
            <dt className="flex items-baseline gap-1.5 text-xs text-slate-400">
              <span>{p.label ?? p.labelKey ?? "—"}</span>
              {p.levelDependent && (
                <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-1.5 py-px text-[10px] font-medium text-indigo-300">
                  Lv
                </span>
              )}
            </dt>
            <dd className="text-sm font-semibold tabular-nums text-white">
              {value ?? (
                <span className="text-xs font-normal text-slate-500" title={p.formula}>
                  —
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function SkillsTabContent({
  skillSet,
  selectedLanguage,
  elementKey,
}: {
  skillSet: CharacterSkillSet | null;
  selectedLanguage: string;
  elementKey: string;
}) {
  const [skillLevel, setSkillLevel] = useState(SKILL_LEVEL_MAX);

  if (!skillSet || skillSet.skills.length === 0) {
    return (
      <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5 md:p-8 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 text-sm text-slate-400">
          Aucune competence disponible pour ce personnage.
        </p>
      </section>
    );
  }

  // Filter out skills that have no name in any language (shared/empty stubs like Eve's).
  const skills = skillSet.skills.filter((s) => {
    const localized = getSkillLocalized(s, selectedLanguage);
    return localized?.name || localized?.description;
  });

  if (skills.length === 0) {
    return (
      <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5 md:p-8 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 text-sm text-slate-400">
          Les competences de ce personnage ne sont pas encore traduites.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-slate-300">Niveau de competence</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Les valeurs marquees
              <span className="mx-1 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-1.5 py-0 align-middle text-[10px] font-medium text-indigo-300">Lv</span>
              varient selon le niveau de la competence.
            </p>
          </div>
          <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-lg font-bold tabular-nums text-indigo-100">
            {skillLevel}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="shrink-0 text-xs text-slate-500">{SKILL_LEVEL_MIN}</span>
          <input
            type="range"
            min={SKILL_LEVEL_MIN}
            max={SKILL_LEVEL_MAX}
            value={skillLevel}
            onChange={(e) => setSkillLevel(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-800 accent-indigo-500"
          />
          <span className="shrink-0 text-xs text-slate-500">{SKILL_LEVEL_MAX}</span>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4">
        {skills.map((skill) => (
          <SkillCard
            key={skill.skillId}
            skill={skill}
            selectedLanguage={selectedLanguage}
            elementKey={elementKey}
            skillLevel={skillLevel}
          />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Quick build card accordion — collapsed by default, shareable via ?build=open.
// If the URL lands with the param set to "open", we auto-scroll to it once.
// ---------------------------------------------------------------------------

function QuickBuildAccordion({
  character,
  build,
  lang,
}: {
  character: CharacterRecord;
  build: CharacterBuild;
  lang: string;
}) {
  const [open, setOpen] = useQueryState(
    "build",
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true }),
  );
  const cardRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (open && !scrolledRef.current && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      scrolledRef.current = true;
    }
  }, [open]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0b1225",
      });
      const link = document.createElement("a");
      const safeName = character.internalName.toLowerCase().replace(/[^a-z0-9]/g, "");
      link.download = `build-${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export build card", err);
    } finally {
      setDownloading(false);
    }
  }, [character.internalName]);

  return (
    <div
      ref={containerRef}
      id="quick-build"
      className="overflow-hidden rounded-xl border border-indigo-400/30 bg-indigo-500/5"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-indigo-500/10"
        aria-expanded={open}
        aria-controls="quick-build-panel"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-indigo-100">
          <FileImage className="h-4 w-4 text-indigo-300" />
          Carte build partageable
        </span>
        <div className="flex items-center gap-3">
          {open && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); handleDownload(); } }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-100 transition-colors hover:bg-indigo-500/30"
            >
              {downloading ? "Export..." : "Telecharger PNG"}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-indigo-300 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div
          id="quick-build-panel"
          className="overflow-auto bg-slate-950/40 p-3 md:p-4"
        >
          <div className="mx-auto w-fit">
            <QuickBuildCard
              character={character}
              build={build}
              lang={lang}
              cardRef={cardRef}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BuildTabContent({
  builds,
  character,
  characterElement,
  selectedLanguage,
  onNavigateToStats,
  skillIcons,
}: {
  builds: CharacterBuild[];
  character: CharacterRecord;
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
        <div className="flex flex-wrap gap-2">
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

      {/* Quick build card accordion — shareable via ?build=open */}
      <QuickBuildAccordion
        character={character}
        build={build}
        lang={selectedLanguage}
      />

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
                {/* Mobile — top row (slots 0/2), center weapon, bottom row (slots 1/3),
                    mirroring the DemonWedgeLayout mobile pattern */}
                <div className="flex w-full flex-col items-center gap-4 md:hidden">
                  <div className="grid w-full grid-cols-2 place-items-center gap-4">
                    {cw.slots[0] ? renderSlot(cw.slots[0], 0, CLIP_LEFT) : <div />}
                    {cw.slots[2] ? renderSlot(cw.slots[2], 2, CLIP_RIGHT) : <div />}
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateToStats}
                    className="flex flex-col items-center gap-1 transition-transform duration-150 active:scale-95"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-purple-400/50 bg-purple-500/10 shadow-lg shadow-purple-500/20">
                      {weaponIcon ? (
                        <img src={weaponIcon} alt="" className="h-12 w-12 object-contain drop-shadow-lg" />
                      ) : (
                        <Swords className="h-10 w-10 text-purple-300" />
                      )}
                    </div>
                    <p className="max-w-[10rem] text-center text-sm font-medium text-purple-200">
                      <BuildLocalizedText texts={cw.name} lang={selectedLanguage} />
                    </p>
                  </button>

                  <div className="grid w-full grid-cols-2 place-items-center gap-4">
                    {cw.slots[1] ? renderSlot(cw.slots[1], 1, CLIP_LEFT) : <div />}
                    {cw.slots[3] ? renderSlot(cw.slots[3], 3, CLIP_RIGHT) : <div />}
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
  skillSet,
}: CharacterDetailClientProps) {
  const t = useTranslations('characterDetail');
  const tc = useTranslations('common');
  const [favoriteChars] = useAtom(charactersFavoritesAtom);
  const [, toggleFavorite] = useAtom(toggleCharacterFavoriteAtom);

  // --- Language state ---
  const locale = useLocale();
  const preferredLanguage = useMemo(
    () =>
      normalizeLanguageCodes(
        [locale, catalog.defaultDetailLanguage],
        catalog.availableLanguages,
        ["FR", "EN"],
      )[0],
    [locale, catalog.defaultDetailLanguage, catalog.availableLanguages],
  );

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

  // --- Intron popover state ---
  const [activeIntronIdx, setActiveIntronIdx] = useState<number | null>(null);
  const [quickBuildOpen, setQuickBuildOpen] = useState(false);

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
            {builds.length > 0 && (
              <button
                type="button"
                onClick={() => setQuickBuildOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-2 text-sm font-medium text-indigo-100 transition-colors hover:bg-indigo-500/30"
              >
                <FileImage className="h-4 w-4" />
                Build rapide
              </button>
            )}
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
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors md:gap-2 md:px-4 md:py-2.5 md:text-sm ${
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
          character={character}
          characterElement={character.element.key}
          selectedLanguage={selectedLanguage}
          onNavigateToStats={() => setActiveTab("stats")}
          skillIcons={character.skillIcons}
        />
      )}

      {/* ---------- Skills tab ---------- */}
      {activeTab === "skills" && (
        <SkillsTabContent
          skillSet={skillSet ?? null}
          selectedLanguage={selectedLanguage}
          elementKey={character.element.key}
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
        const intronEffects = translation.intronEffects ?? [];
        // Horizontal offsets (%) — equal 31% step between consecutive circles
        // (1→2 and 2→3 identical), symmetric: 1↔6, 2↔5, 3↔4.
        // Index 6 (Intron VII) sits on the left column, between 1 (top) and 6 (bottom).
        const CIRCLE_X = [6, 37, 68, 68, 37, 6, 6];
        // Vertical offsets (%) — extra gap between top (1,2,3) and bottom (4,5,6).
        // Index 6 (Intron VII) is at the vertical midpoint of the left column.
        const CIRCLE_Y = [2, 16, 30, 54, 68, 82, 42];
        const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

        return (
          <section className="relative rounded-2xl border border-slate-800/60 bg-slate-950/40 md:min-h-[720px]">
            {/* Background clipping wrapper — only clips bust + glow so popovers can escape the section */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {/* z-0: Bust image as background — oversized, positioned left */}
              {bustSrc && (
                <div
                  className="absolute z-0 select-none hidden md:block"
                  style={{
                    left: "-6%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "60%",
                    height: "115%",
                  }}
                >
                  <img
                    src={bustSrc}
                    alt={character.internalName}
                    className="h-full w-full object-contain object-center"
                    style={{ filter: `drop-shadow(0 0 90px rgba(${rgb}, 0.45))` }}
                  />
                </div>
              )}

              {/* z-[1]: Element color ambient glow */}
              <div
                className="absolute inset-0 z-[1]"
                style={{
                  background: `radial-gradient(ellipse 55% 75% at 22% 50%, rgba(${rgb}, 0.2), transparent 70%)`,
                }}
              />
              <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
            </div>

            {/* z-[2]: Header title — centered on mobile, top-right on desktop */}
            <div className="relative z-[2] p-4 md:p-8 lg:p-10 flex md:justify-end">
              <div className="text-left md:text-right max-w-md">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3"
                  style={{
                    borderColor: `rgba(${rgb}, 0.35)`,
                    background: `rgba(${rgb}, 0.08)`,
                  }}
                >
                  <Layers className="h-3.5 w-3.5" style={{ color: `rgb(${rgb})` }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: `rgb(${rgb})` }}>
                    {t("intron.progressionBadge")}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {t("intron.title")}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {intronLevels.length > 0
                    ? t("intron.subtitle", { count: intronLevels.length })
                    : t("intron.empty")}
                </p>
                {intronLevels.length > 0 && (
                  <p className="mt-1 text-[11px] italic text-slate-500 hidden md:block">
                    {t("intron.helperHint")}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile list layout — vertical cards with effect text always visible */}
            {intronLevels.length > 0 && (
              <div className="relative z-[2] md:hidden px-4 pb-6 space-y-3">
                {intronLevels.map((intronLevel, idx) => {
                  const num = idx + 1;
                  const iconSrc = num >= 1 && num <= 6 ? `/assets/ui/intron/intron-${num}.png` : null;
                  const isFirst = idx === 0;
                  const isSeventh = idx === 6;
                  const isHighlighted = isFirst || isSeventh;
                  const romanNumeral = ROMAN_NUMERALS[idx] ?? "";
                  const effectText = intronEffects[idx] ?? null;

                  return (
                    <div
                      key={`intron-mobile-${num}`}
                      className="rounded-xl border bg-slate-950/70 p-3 backdrop-blur-sm"
                      style={{
                        borderColor: `rgba(${rgb}, ${isHighlighted ? 0.45 : 0.2})`,
                        boxShadow: isHighlighted
                          ? `0 0 24px rgba(${rgb}, 0.18), inset 0 0 20px rgba(${rgb}, 0.08)`
                          : undefined,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon circle */}
                        <div
                          className="relative flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full"
                          style={{
                            border: `2px solid rgba(${rgb}, ${isHighlighted ? 0.75 : 0.35})`,
                            background: isHighlighted
                              ? `radial-gradient(circle at center, rgba(${rgb}, 0.28), rgba(15, 23, 42, 0.95))`
                              : "rgba(15, 23, 42, 0.65)",
                            boxShadow: isHighlighted
                              ? `0 0 20px rgba(${rgb}, 0.45), inset 0 0 14px rgba(${rgb}, 0.18)`
                              : `0 0 10px rgba(${rgb}, 0.1)`,
                          }}
                        >
                          {iconSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={iconSrc}
                              alt=""
                              className="h-11 w-11 object-contain"
                              style={
                                isHighlighted
                                  ? { filter: `drop-shadow(0 0 10px rgba(${rgb}, 0.8))` }
                                  : { opacity: 0.75 }
                              }
                            />
                          ) : (
                            <span
                              className="text-xl font-black tracking-wider"
                              style={{
                                color: `rgb(${rgb})`,
                                textShadow: `0 0 8px rgba(${rgb}, 0.9)`,
                              }}
                            >
                              {romanNumeral}
                            </span>
                          )}
                          {!isSeventh && (
                            <div
                              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black"
                              style={{
                                background: isHighlighted ? `rgb(${rgb})` : "rgba(30, 41, 59, 0.95)",
                                color: isHighlighted ? "rgb(15, 23, 42)" : `rgba(${rgb}, 0.85)`,
                                border: `1px solid rgba(${rgb}, ${isHighlighted ? 0.9 : 0.5})`,
                              }}
                            >
                              {romanNumeral}
                            </div>
                          )}
                        </div>

                        {/* Header */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-bold text-white">
                              {t("intron.levelLabel", { num })}
                            </p>
                            {isFirst && (
                              <span
                                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                  background: `rgba(${rgb}, 0.2)`,
                                  color: `rgb(${rgb})`,
                                }}
                              >
                                {t("intron.baseBadge")}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {t("intron.pieces", { count: intronLevel.resourceNum })}
                          </p>
                        </div>
                      </div>

                      {/* Effect description */}
                      {effectText && (
                        <p
                          className="mt-3 text-xs leading-relaxed text-slate-300 whitespace-pre-line border-t pt-3"
                          style={{ borderColor: `rgba(${rgb}, 0.15)` }}
                        >
                          {effectText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop constellation layout */}
            {intronLevels.length > 0 && (
              <div className="relative z-[2] min-h-[560px] px-6 md:px-10 lg:px-16 pb-10 hidden md:block">
                <div className="relative ml-auto md:w-[55%] lg:w-[52%] h-[560px]">
                  {/* SVG connecting lines — organic curves */}
                  <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`intron-line-${character.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={`rgba(${rgb}, 0.5)`} />
                        <stop offset="100%" stopColor={`rgba(${rgb}, 0.12)`} />
                      </linearGradient>
                    </defs>
                    {intronLevels.map((_, idx) => {
                      // Skip idx 0 (no previous) and idx 6 (VII floats at the centre, unconnected).
                      if (idx === 0 || idx === 6) return null;
                      const x1 = (CIRCLE_X[idx - 1] ?? 0) + 7;
                      const y1 = (CIRCLE_Y[idx - 1] ?? 0) + 6;
                      const x2 = (CIRCLE_X[idx] ?? 0) + 7;
                      const y2 = (CIRCLE_Y[idx] ?? 0) + 6;
                      const mx = (x1 + x2) / 2;
                      return (
                        <path
                          key={`line-${idx}`}
                          d={`M ${x1}% ${y1}% Q ${mx}% ${(y1 + y2) / 2}% ${x2}% ${y2}%`}
                          fill="none"
                          stroke={`url(#intron-line-${character.id})`}
                          strokeWidth="1.5"
                          strokeDasharray="5 7"
                        />
                      );
                    })}
                  </svg>

                  {/* Circles */}
                  {intronLevels.map((intronLevel, idx) => {
                    const num = idx + 1;
                    const iconSrc = num >= 1 && num <= 6 ? `/assets/ui/intron/intron-${num}.png` : null;
                    const isFirst = idx === 0;
                    // Intron VII (idx=6) is the new high-tier addition — treated as "highlighted".
                    const isSeventh = idx === 6;
                    const isHighlighted = isFirst || isSeventh;
                    const romanNumeral = ROMAN_NUMERALS[idx] ?? "";
                    const effectText = intronEffects[idx] ?? null;
                    const isActive = activeIntronIdx === idx;
                    // Popover opens to the left for right-half circles, to the right for left-half.
                    const popoverOnLeft = (CIRCLE_X[idx] ?? 0) >= 40;

                    return (
                      <div
                        key={`intron-${num}`}
                        className="absolute flex items-center gap-3 group"
                        style={{
                          left: `${CIRCLE_X[idx] ?? 0}%`,
                          top: `${CIRCLE_Y[idx] ?? 0}%`,
                          zIndex: isActive ? 20 : 10,
                        }}
                        onMouseEnter={() => setActiveIntronIdx(idx)}
                        onMouseLeave={() => setActiveIntronIdx((prev) => (prev === idx ? null : prev))}
                      >
                        {/* Glowing circle */}
                        <button
                          type="button"
                          onClick={() =>
                            setActiveIntronIdx((prev) => (prev === idx ? null : idx))
                          }
                          className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                          style={{
                            border: `2px solid rgba(${rgb}, ${isActive || isHighlighted ? 0.85 : 0.25})`,
                            boxShadow:
                              isActive || isHighlighted
                                ? `0 0 40px rgba(${rgb}, 0.55), 0 0 80px rgba(${rgb}, 0.2), inset 0 0 24px rgba(${rgb}, 0.22)`
                                : `0 0 16px rgba(${rgb}, 0.1)`,
                            background:
                              isActive || isHighlighted
                                ? `radial-gradient(circle at center, rgba(${rgb}, 0.32), rgba(15, 23, 42, 0.95))`
                                : "rgba(15, 23, 42, 0.65)",
                            backdropFilter: "blur(6px)",
                          }}
                          aria-label={`Intron ${num}`}
                        >
                          {iconSrc ? (
                            <img
                              src={iconSrc}
                              alt=""
                              className="h-16 w-16 object-contain"
                              style={
                                isActive || isHighlighted
                                  ? { filter: `drop-shadow(0 0 12px rgba(${rgb}, 0.8))` }
                                  : { opacity: 0.7 }
                              }
                            />
                          ) : (
                            <span
                              className="text-3xl font-black tracking-wider"
                              style={{
                                color: `rgb(${rgb})`,
                                textShadow: `0 0 12px rgba(${rgb}, 0.9)`,
                              }}
                            >
                              {romanNumeral}
                            </span>
                          )}
                          {/* Roman numeral badge — hidden on circle 7 (the big roman is already in the centre) */}
                          {!isSeventh && (
                            <div
                              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
                              style={{
                                background: isActive || isHighlighted ? `rgb(${rgb})` : "rgba(30, 41, 59, 0.95)",
                                color: isActive || isHighlighted ? "rgb(15, 23, 42)" : `rgba(${rgb}, 0.8)`,
                                border: `1px solid rgba(${rgb}, ${isActive || isHighlighted ? 0.9 : 0.4})`,
                              }}
                            >
                              {romanNumeral}
                            </div>
                          )}
                        </button>

                        {/* Label */}
                        <div className="min-w-[120px]">
                          <div className="flex items-baseline gap-2">
                            <p className={`text-sm font-bold ${isActive || isHighlighted ? "text-white" : "text-slate-400"}`}>
                              {t("intron.levelLabel", { num })}
                            </p>
                            {isFirst && (
                              <span
                                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                  background: `rgba(${rgb}, 0.2)`,
                                  color: `rgb(${rgb})`,
                                }}
                              >
                                {t("intron.baseBadge")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t("intron.pieces", { count: intronLevel.resourceNum })}
                          </p>
                        </div>

                        {/* Popover with effect description */}
                        {isActive && effectText && (
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 ${
                              popoverOnLeft ? "right-full mr-4" : "left-full ml-4"
                            } w-[280px] sm:w-[320px] rounded-xl border bg-slate-950/95 p-4 shadow-[0_20px_50px_rgba(2,6,23,0.7)] backdrop-blur-md`}
                            style={{
                              borderColor: `rgba(${rgb}, 0.45)`,
                              boxShadow: `0 0 30px rgba(${rgb}, 0.25), 0 20px 50px rgba(2, 6, 23, 0.7)`,
                            }}
                            role="tooltip"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                                style={{
                                  background: `rgba(${rgb}, 0.2)`,
                                  color: `rgb(${rgb})`,
                                  border: `1px solid rgba(${rgb}, 0.4)`,
                                }}
                              >
                                {romanNumeral}
                              </span>
                              <p className="text-sm font-bold text-white">
                                {t("intron.levelLabel", { num })}
                              </p>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                              {effectText}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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
      {/* Quick Build modal                                                 */}
      {/* ================================================================= */}
      <QuickBuildModal
        character={character}
        builds={builds}
        lang={selectedLanguage}
        open={quickBuildOpen}
        onClose={() => setQuickBuildOpen(false)}
      />

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
