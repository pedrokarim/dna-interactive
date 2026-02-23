"use client";

import Link from "next/link";
import { type ComponentType, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
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

const TAB_IDS = ["stats", "portraits", "intron", "translations", "tech"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_CONFIG: { id: TabId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "stats", label: "Attributs", icon: BarChart3 },
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
// Main component
// ---------------------------------------------------------------------------

export default function CharacterDetailClient({
  catalog,
  character,
  levelUpCurves,
}: CharacterDetailClientProps) {
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
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* Top bar + Hero section (always visible, above tabs)               */}
      {/* ================================================================= */}
      <section className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/characters"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour liste
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
              {isFavorite ? "Retirer favori" : "Ajouter favori"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {prevCharacter && (
              <Link
                href={`/characters/${prevCharacter.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600/80 px-2 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
                aria-label={`Personnage precedent : ${prevCharacter.internalName}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            {nextCharacter && (
              <Link
                href={`/characters/${nextCharacter.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-600/80 px-2 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
                aria-label={`Personnage suivant : ${nextCharacter.internalName}`}
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
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
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
              <h1 className="mt-1 text-3xl font-semibold text-white">
                {translation.name ?? character.internalName}
              </h1>
              {translation.subtitle && (
                <p className="mt-1 text-base text-slate-300">
                  {translation.subtitle}
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
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
                  <dd className="text-slate-100">
                    {character.unlockRequiredPiece} introns
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
        <section className="space-y-5">
          {/* Level slider */}
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
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
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
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
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
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
          <div className="grid gap-5 lg:grid-cols-2">
            {character.recommendAttr.length > 0 && (
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
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
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
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
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
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
        </section>
      )}

      {/* ---------- Portraits tab ---------- */}
      {activeTab === "portraits" && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="text-lg font-semibold text-white">Galerie de portraits</h2>
          {availablePortraits.length > 1 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
      {activeTab === "intron" && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="text-lg font-semibold text-white">
            Niveaux d&apos;intron
          </h2>
          {character.intronLevels.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-slate-400">
                Chaque niveau necessite {character.intronLevels[0]?.resourceNum ?? 30} pieces d&apos;intron (CharPiece #{character.charPieceId}).
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {character.intronLevels.map((intronLevel) => (
                  <div
                    key={`intron-${intronLevel.cardLevel}`}
                    className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-950/55 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        Niveau {intronLevel.cardLevel}
                      </p>
                      <p className="text-xs text-slate-400">
                        Resource #{intronLevel.resourceId}
                      </p>
                    </div>
                    <span className="rounded-full border border-indigo-500/35 bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-100">
                      {intronLevel.resourceNum} pieces
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Aucune donnee d&apos;intron disponible.
            </p>
          )}
        </section>
      )}

      {/* ---------- Translations tab ---------- */}
      {activeTab === "translations" && (
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Languages className="h-5 w-5 text-indigo-400/80" />
            Traductions
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.availableLanguages.map((langCode) => {
              const t = character.translations[langCode];
              if (!t) return null;
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
                    {t.name ?? "N/A"}
                  </p>
                  {t.subtitle && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {t.subtitle}
                    </p>
                  )}
                  {t.campName && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {t.campName}
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
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
            <h2 className="text-lg font-semibold text-white">Text keys</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {Object.entries(character.textKeys).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-slate-400">{key}</dt>
                  <dd className="text-slate-100">{value ?? "N/A"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
            <h2 className="text-lg font-semibold text-white">Donnees techniques</h2>
            <dl className="mt-4 space-y-3 text-sm">
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
                aria-label="Fermer"
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
