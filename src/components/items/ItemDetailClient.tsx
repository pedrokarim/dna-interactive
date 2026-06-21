"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, Heart, Languages } from "lucide-react";
import { useAtom } from "jotai";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import {
  getGenimonVariants,
  getItemTranslation,
  getLanguageLabel,
  normalizeLanguageCodes,
} from "@/lib/items/catalog";
import type { ItemCategory, ItemRawField, ItemRecord, ItemResolvedAttribute } from "@/lib/items/types";
import type { RelatedDraftRecipe } from "@/lib/items/drafts";
import { resolveDraftTextByLanguage } from "@/lib/items/drafts";
import { itemsFavoritesAtom, toggleItemFavoriteAtom } from "@/lib/store";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaStatRow } from "@/components/dna/StatRow";
import { DnaStars } from "@/components/dna/RarityStars";
import { DnaTag } from "@/components/dna/Tag";
import { ELEMENTS, type ElementKey } from "@/components/dna/elements";
import { WeaponFusionTrack } from "@/components/items/WeaponFusionTrack";

const GOLD_HEX = "#c2a86a";

/** Teinte hex tirée de l'affinité élémentaire d'un mod (UI_Attr_Fire → pyro…), sinon or. */
function elementHexFromKey(key: string | undefined): string {
  if (!key) return GOLD_HEX;
  const stripped = key.replace(/^UI_Attr_/, "").replace(/_Name$/, "") as ElementKey;
  return ELEMENTS[stripped]?.hex ?? GOLD_HEX;
}

type ItemDetailClientProps = {
  category: ItemCategory;
  item: ItemRecord;
  relatedDrafts?: RelatedDraftRecipe[];
};

function formatRawFieldValue(value: ItemRawField): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value === null) {
    return "null";
  }
  return `${value}`;
}

function RawFieldsSection({ fieldEntries }: { fieldEntries: [string, ItemRawField][] }) {
  const [open, setOpen] = useState(false);
  const ti = useTranslations('itemDetail');

  return (
    <DnaPanel>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <h2 className="font-display text-xl text-parch">{ti('rawFieldsTitle')}</h2>
        <ChevronDown
          className={`h-5 w-5 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-white/10 px-5 pb-5">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="py-2 pr-4 font-medium">Field</th>
                <th className="py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel">
              {fieldEntries.map(([field, value]) => (
                <tr key={field}>
                  <td className="whitespace-nowrap py-2 pr-4 text-parch/85">{field}</td>
                  <td className="py-2 text-parch">{formatRawFieldValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DnaPanel>
  );
}

function formatDynamicNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return `${value}`;
  }
  const absolute = Math.abs(value);
  if (absolute >= 1000) {
    return Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
  }
  if (Number.isInteger(value)) {
    return `${value}`;
  }
  const digits = absolute >= 1 ? 2 : 4;
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

function formatRateValue(rate: number): string {
  return `${formatDynamicNumber(rate * 100)}%`;
}

function normalizeScalingLevels(item: ItemRecord): number[] {
  const fromScaling = item.scaling.availableLevels
    .filter((value) => Number.isInteger(value) && value >= 0)
    .sort((a, b) => a - b);
  if (fromScaling.length > 0) {
    return fromScaling;
  }

  const maxFromStats = typeof item.stats.maxLevel === "number" ? item.stats.maxLevel : 0;
  return Array.from({ length: Math.max(0, maxFromStats) + 1 }, (_, index) => index);
}

function nearestAllowedLevel(value: number, allowed: number[]): number {
  if (allowed.length === 0) {
    return 0;
  }
  if (allowed.includes(value)) {
    return value;
  }

  let nearest = allowed[0];
  let distance = Math.abs(allowed[0] - value);
  for (let i = 1; i < allowed.length; i += 1) {
    const candidate = allowed[i];
    const candidateDistance = Math.abs(candidate - value);
    if (candidateDistance < distance) {
      nearest = candidate;
      distance = candidateDistance;
    }
  }
  return nearest;
}

function formatResolvedAttributeValue(attribute: ItemResolvedAttribute): string {
  const chunks: string[] = [];
  if (typeof attribute.rate === "number") {
    chunks.push(`+${formatRateValue(attribute.rate)}`);
  } else if (typeof attribute.rawRate === "string" || typeof attribute.rawRate === "number") {
    chunks.push(`${attribute.rawRate}`);
  }

  if (typeof attribute.value === "number") {
    chunks.push(`+${formatDynamicNumber(attribute.value)}`);
  } else if (typeof attribute.rawValue === "string" || typeof attribute.rawValue === "number") {
    chunks.push(`${attribute.rawValue}`);
  }

  return chunks.length > 0 ? chunks.join(" | ") : "N/A";
}

/** Retire les balises rich-text du jeu (<H>, </>, <Polarity>, <color=…>…) — pur formatage, jamais du texte affichable. */
function stripGameRichText(text: string): string {
  return text.replace(/<\/?[A-Za-z][^>]*>|<\/>/g, "");
}

function renderTextWithDynamicMentions(
  rawText: string,
  level: number,
  valuesByIndex: Record<string, number>,
): ReactNode[] {
  const text = stripGameRichText(rawText);
  const tokenRegex = /#(\d+)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const fullToken = match[0];
    const index = match[1];
    const start = match.index;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    const resolved = valuesByIndex[index];
    const inlineValue = resolved !== undefined ? formatDynamicNumber(resolved) : fullToken;
    parts.push(
      <span key={`mention-${start}-${fullToken}`} className="group relative inline-flex align-middle">
        <span className="mx-0.5 rounded-sm border border-gold/35 bg-gold/20 px-1.5 py-0.5 font-medium text-gold">
          {inlineValue}
        </span>
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-sm border border-white/10 bg-ink/95 px-2 py-1 text-[11px] text-parch shadow-[0_8px_20px_rgba(0,0,0,0.45)] group-hover:block">
          {resolved !== undefined
            ? `#${index} | Niveau ${level}: ${formatDynamicNumber(resolved)}`
            : `#${index} | Niveau ${level}: valeur indisponible`}
        </span>
      </span>,
    );

    lastIndex = start + fullToken.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function formatElementKeyFallback(key: string): string {
  return key
    .replace(/^UI_Attr_/, "")
    .replace(/_Name$/, "")
    .replaceAll("_", " ");
}

function resolveElementalAffinity(
  item: ItemRecord,
  translatedTypeCompatibilityNames: string[],
): { key: string; label: string; iconSrc: string | null } | null {
  const index = item.typeCompatibility.textKeys.findIndex((key) => key.startsWith("UI_Attr_"));
  if (index === -1) {
    return null;
  }

  const key = item.typeCompatibility.textKeys[index];
  const icon = item.typeCompatibility.tags.find((tag) => tag.key === key)?.icon;
  const translatedLabel = translatedTypeCompatibilityNames[index];

  return {
    key,
    label:
      typeof translatedLabel === "string" && translatedLabel.trim().length > 0
        ? translatedLabel
        : formatElementKeyFallback(key),
    iconSrc: icon?.publicPath ?? icon?.placeholderPath ?? null,
  };
}

type ParsedBattlePetAttribute = {
  attrName: string;
  rate: string | null;
  value: string | null;
};

function parseBattlePetAttributes(value: ItemRawField | undefined): ParsedBattlePetAttribute[] {
  if (typeof value !== "string") {
    return [];
  }

  const normalized = value.replaceAll("\r", "");
  const objectRegex = /\{[^{}]*AttrName\s*=\s*"([^"]+)"[^{}]*\}/gm;
  const attributes: ParsedBattlePetAttribute[] = [];
  let match: RegExpExecArray | null;

  while ((match = objectRegex.exec(normalized)) !== null) {
    const chunk = match[0];
    const attrName = match[1];
    const rateMatch = chunk.match(/\bRate\s*=\s*(?:"([^"]+)"|(-?\d+(?:\.\d+)?))/);
    const valueMatch = chunk.match(/\bValue\s*=\s*(?:"([^"]+)"|(-?\d+(?:\.\d+)?))/);

    attributes.push({
      attrName,
      rate: rateMatch?.[1] ?? rateMatch?.[2] ?? null,
      value: valueMatch?.[1] ?? valueMatch?.[2] ?? null,
    });
  }

  return attributes;
}

export default function ItemDetailClient({ category, item, relatedDrafts = [] }: ItemDetailClientProps) {
  const t = useTranslations('itemDetail');
  const tc = useTranslations('common');
  const [favoriteItems] = useAtom(itemsFavoritesAtom);
  const [, toggleItemFavorite] = useAtom(toggleItemFavoriteAtom);
  const isModsCategory = category.id === "mods";
  const isGenimonsCategory = category.id === "genimons";
  const isWeaponsCategory = category.id === "weapons";
  // Passif dont les valeurs varient avec le niveau du slider (mods = niveau, armes = niveau de fusion/doublon).
  const hasLeveledPassive = isModsCategory || isWeaponsCategory;
  const preferredLanguage = normalizeLanguageCodes(
    [category.defaultDetailLanguage],
    category.availableLanguages,
    ["FR", "EN"],
  )[0];

  const selectedLanguageParser = useMemo(
    () =>
      parseAsStringLiteral(category.availableLanguages)
        .withDefault(preferredLanguage)
        .withOptions({ clearOnDefault: false }),
    [category.availableLanguages, preferredLanguage],
  );
  const [selectedLanguage, setSelectedLanguage] = useQueryState("lang", selectedLanguageParser);

  const translation = useMemo(
    () => getItemTranslation(item, selectedLanguage, category.availableLanguages),
    [item, selectedLanguage, category.availableLanguages],
  );
  const levelOptions = useMemo(() => normalizeScalingLevels(item), [item]);
  const defaultLevel =
    levelOptions.includes(item.scaling.defaultLevel) ? item.scaling.defaultLevel : levelOptions[0] ?? 0;
  const levelParser = useMemo(
    () =>
      parseAsInteger
        .withDefault(defaultLevel)
        .withOptions({ clearOnDefault: false }),
    [defaultLevel],
  );
  const [selectedLevelRaw, setSelectedLevelRaw] = useQueryState("lvl", levelParser);
  const selectedLevel = nearestAllowedLevel(
    typeof selectedLevelRaw === "number" ? selectedLevelRaw : defaultLevel,
    levelOptions,
  );
  const selectedLevelValues = item.scaling.valuesByLevel[String(selectedLevel)] ?? {};
  const selectedLevelAttributes = item.scaling.attributesByLevel[String(selectedLevel)] ?? [];
  const selectedLevelAttributesVisible = selectedLevelAttributes.filter(
    (attribute) =>
      attribute.attrName !== null ||
      attribute.rate !== null ||
      attribute.value !== null ||
      attribute.rawRate !== null ||
      attribute.rawValue !== null,
  );
  const dynamicValueEntries = Object.entries(selectedLevelValues).sort(
    ([a], [b]) => Number(a) - Number(b),
  );
  const dynamicValuesByIndex = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [index, value] of dynamicValueEntries) {
      out[index] = value;
    }
    return out;
  }, [dynamicValueEntries]);
  const sliderMinLevel = levelOptions[0] ?? 0;
  const sliderMaxLevel = levelOptions[levelOptions.length - 1] ?? sliderMinLevel;
  const hasScalingData =
    sliderMaxLevel > 0 ||
    dynamicValueEntries.length > 0 ||
    selectedLevelAttributesVisible.length > 0;

  const iconSrc = item.icon.publicPath ?? item.icon.placeholderPath ?? "/marker-default.svg";
  const affinityIconSrc = item.affinity.icon.publicPath ?? item.affinity.icon.placeholderPath;
  const selectedTolerance =
    item.tolerance.valuesByLevel[String(selectedLevel)] ??
    item.tolerance.baseCost;
  const fieldEntries = Object.entries(item.fields)
    .filter(([field]) => field.toLowerCase() !== "descvalues")
    .sort(([a], [b]) => a.localeCompare(b));
  const passiveEffectsRaw =
    item.fields.PassiveEffects === undefined ? "N/A" : formatRawFieldValue(item.fields.PassiveEffects);
  const battlePetId = typeof item.fields.BattlePetId === "number" ? item.fields.BattlePetId : null;
  const supportSkillId =
    typeof item.fields.BattlePet_SupportSkillId === "number" ? item.fields.BattlePet_SupportSkillId : null;
  const battlePetType =
    typeof item.fields.BattlePet_PetType === "string" ? item.fields.BattlePet_PetType : null;
  const resourceSType =
    typeof item.fields.ResourceSType === "string" ? item.fields.ResourceSType : null;
  const genimonBreakLevels =
    Array.isArray(item.fields.PetBreakLevels)
      ? item.fields.PetBreakLevels.filter((value): value is number => typeof value === "number")
      : [];
  const genimonBreakEntryNums =
    Array.isArray(item.fields.PetBreakEntryNums)
      ? item.fields.PetBreakEntryNums.filter((value): value is number => typeof value === "number")
      : [];
  const genimonCollectRewardExp =
    typeof item.fields.PetCollectRewardExp === "number" ? item.fields.PetCollectRewardExp : null;
  const genimonMaxLevelExp =
    typeof item.fields.PetLevelMaxExpAtMaxLevel === "number"
      ? item.fields.PetLevelMaxExpAtMaxLevel
      : null;
  const genimonTotalExpAtMax =
    typeof item.fields.PetTotalExpAtMaxLevel === "number" ? item.fields.PetTotalExpAtMaxLevel : null;
  const resolvedAddModMultiplier =
    typeof item.fields.BattlePet_ResolvedAddModMultiplier === "string"
      ? item.fields.BattlePet_ResolvedAddModMultiplier
      : null;
  const genimonAttributes = useMemo(
    () =>
      parseBattlePetAttributes(
        item.fields.BattlePet_ResolvedAddAttrs ?? item.fields.BattlePet_AddAttrs,
      ),
    [item.fields.BattlePet_ResolvedAddAttrs, item.fields.BattlePet_AddAttrs],
  );
  const variantSiblings = useMemo(
    () => (isGenimonsCategory ? getGenimonVariants(item) : []),
    [isGenimonsCategory, item],
  );
  const hasAffinityData =
    Boolean(
      affinityIconSrc ||
        translation.affinityName ||
        item.affinity.char ||
        typeof item.stats.polarity === "number",
    );
  const elementalAffinity = resolveElementalAffinity(item, translation.typeCompatibilityNames);
  const textKeyNameLabel =
    category.id === "mods"
      ? "modNameKey"
      : category.id === "genimons"
        ? "genimonNameKey"
      : category.id === "weapons"
        ? "weaponNameKey"
        : category.id === "resources" || category.id === "fishing"
          ? "resourceNameKey"
          : "nameKey";
  const textKeyRows: Array<{ label: string; value: string | null }> = [
    {
      label: textKeyNameLabel,
      value: item.textKeys.modNameKey,
    },
    {
      label: "descriptionKey",
      value: item.textKeys.descriptionKey,
    },
    {
      label: "functionKey",
      value: item.textKeys.functionKey,
    },
  ];
  if (isModsCategory || isGenimonsCategory) {
    textKeyRows.push({
      label: "passiveEffectsDescKey",
      value: item.textKeys.passiveEffectsDescKey,
    });
  }
  if (isModsCategory) {
    textKeyRows.push(
      {
        label: "demonWedgeKey",
        value: item.textKeys.demonWedgeKey,
      },
      {
        label: "affinityNameKey",
        value: item.textKeys.affinityNameKey,
      },
      {
        label: "archiveNameKey",
        value: item.textKeys.archiveNameKey,
      },
    );
  }
  const showPassiveDescription = isModsCategory || isGenimonsCategory || isWeaponsCategory;
  const passiveDescriptionHasDynamicTokens =
    typeof translation.passiveEffectsDescription === "string" &&
    /#\d+/.test(translation.passiveEffectsDescription);
  const favoriteKey = `${category.id}:${item.id}`;
  const isFavorite = favoriteItems.has(favoriteKey);

  // Stats de combat des armes (depuis fields, peuplées par l'extraction BattleWeapon).
  const weaponElement =
    isWeaponsCategory && typeof item.fields.Element === "string"
      ? ELEMENTS[item.fields.Element as ElementKey] ?? null
      : null;
  const weaponBaseAtk =
    isWeaponsCategory && typeof item.fields.BaseATK === "number" ? item.fields.BaseATK : null;
  const weaponMaxAtk =
    isWeaponsCategory && typeof item.fields.ATKMax === "number" ? item.fields.ATKMax : null;
  const weaponCri =
    isWeaponsCategory && typeof item.fields.CRI === "number" ? item.fields.CRI : null;
  const weaponCrd =
    isWeaponsCategory && typeof item.fields.CRD === "number" ? item.fields.CRD : null;

  const elHex = weaponElement?.hex ?? elementHexFromKey(elementalAffinity?.key);
  const tinted = elHex !== GOLD_HEX;
  const displayName = translation.modName ?? `${category.displayName} ${item.modId}`;
  const subtitle = translation.demonWedgeName
    ? `${category.displayName} ${translation.demonWedgeName}`
    : translation.functionLabel ?? (isModsCategory ? "Demon Wedge" : category.displayName);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/items/${category.slug}`}
            className="inline-flex items-center gap-2 border border-line/25 bg-panel/55 px-3 py-2 text-sm text-parch backdrop-blur-sm transition-colors hover:border-gold/40 hover:bg-panel/80"
          >
            <ArrowLeft className="h-4 w-4" />
            {tc('backToList')}
          </Link>
          <button
            type="button"
            onClick={() => toggleItemFavorite(favoriteKey)}
            className={`inline-flex items-center gap-2 border px-3 py-2 text-sm backdrop-blur-sm transition-colors ${
              isFavorite
                ? "border-crimson-bright/50 bg-crimson/10 text-crimson-bright"
                : "border-line/25 bg-panel/55 text-parch/85 hover:border-crimson-bright/40 hover:text-crimson-bright"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-crimson-bright text-crimson-bright" : ""}`} />
            {isFavorite ? tc('removeFavorite') : tc('addFavorite')}
          </button>
        </div>

        <div className="flex items-center gap-2 border border-line/25 bg-panel/55 px-3 py-2 backdrop-blur-sm">
          <Languages className="h-4 w-4 text-gold/80" />
          <select
            value={selectedLanguage}
            onChange={(event) => {
              setSelectedLanguage(event.target.value);
            }}
            aria-label="Langue"
            className="bg-transparent text-sm text-parch outline-none"
          >
            {category.availableLanguages.map((code) => (
              <option key={code} value={code} className="bg-panel">
                {getLanguageLabel(code)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero : stage teinté par l'élément + colonne de stats */}
      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_360px]">
        {/* Stage : médaillon icône + bandeau nom */}
        <div
          className="relative flex min-h-[360px] items-center justify-center overflow-hidden border border-white/10"
          style={{ background: `radial-gradient(60% 60% at 50% 40%, ${elHex}22, transparent 60%), linear-gradient(180deg, rgba(20,19,17,0.4), rgba(8,7,6,0.62))` }}
        >
          {/* Bandeau nom (overlay) */}
          <div className="absolute left-4 top-4 z-10 max-w-[82%] md:left-6 md:top-6">
            <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-gold">
              {category.technicalName} #{item.modId}
            </p>
            <h1 className="mt-0.5 font-display text-4xl text-parch md:text-5xl [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">
              {displayName}
            </h1>
            <p className="mt-0.5 font-display text-lg italic text-muted">{subtitle}</p>
            {typeof item.stats.rarity === "number" ? (
              <DnaStars value={item.stats.rarity} className="mt-1.5 text-sm" />
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {elementalAffinity ? (
                <span
                  className="inline-flex items-center gap-1.5 border px-2.5 py-1 font-caps text-[0.58rem] uppercase tracking-[0.14em]"
                  style={{ borderColor: `${elHex}66`, background: `${elHex}1f`, color: elHex }}
                >
                  {elementalAffinity.iconSrc ? (
                    <img src={elementalAffinity.iconSrc} alt="" className="h-5 w-5 object-contain" />
                  ) : null}
                  {elementalAffinity.label}
                </span>
              ) : null}
              {weaponElement ? (
                <span
                  className="inline-flex items-center gap-1.5 border px-2.5 py-1 font-caps text-[0.58rem] uppercase tracking-[0.14em]"
                  style={{ borderColor: `${elHex}66`, background: `${elHex}1f`, color: elHex }}
                >
                  <img src={weaponElement.icon} alt="" className="h-5 w-5 object-contain" />
                  {weaponElement.label}
                </span>
              ) : null}
              {item.variants?.isPremium ? <DnaTag>Premium</DnaTag> : null}
            </div>
          </div>

          {/* Sol lumineux */}
          <span
            aria-hidden
            className="absolute bottom-[10%] left-1/2 h-12 w-56 -translate-x-1/2 rounded-[50%] blur-md"
            style={{ background: `radial-gradient(ellipse, ${elHex}3a, transparent 70%)` }}
          />
          {/* Halo + médaillon icône */}
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
            style={{ background: `radial-gradient(circle, ${elHex}33, transparent 64%)` }}
          />
          <div
            className="relative z-[1] grid h-44 w-44 place-items-center rounded-full border bg-ink/40 md:h-52 md:w-52"
            style={{ borderColor: `${elHex}66`, boxShadow: `0 0 44px -10px ${elHex}, inset 0 0 30px -12px ${elHex}` }}
          >
            <img
              src={iconSrc}
              alt={`${category.technicalName} ${item.modId}`}
              className="h-[64%] w-[64%] object-contain drop-shadow-[0_10px_26px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Stepper de fusion (doublons) intégré au stage, façon écran d'arme du jeu */}
          {isWeaponsCategory && hasScalingData ? (
            <div className="absolute right-3 top-1/2 z-[2] -translate-y-1/2 md:right-5">
              <WeaponFusionTrack
                levels={levelOptions}
                value={selectedLevel}
                accentHex={tinted ? elHex : undefined}
                onChange={(level) => void setSelectedLevelRaw(level)}
              />
            </div>
          ) : null}
        </div>

        {/* Colonne de stats */}
        <aside className="flex flex-col gap-4">
          <DnaPanel className="p-4 md:p-5">
            <DnaSectionLabel>{category.technicalName} #{item.modId}</DnaSectionLabel>
            {hasScalingData ? (
              <div className="mt-3 flex items-end justify-between border-b border-white/6 pb-3">
                <div
                  className="font-caps text-2xl font-semibold leading-none"
                  style={{ color: tinted ? elHex : undefined }}
                >
                  {selectedLevel}
                  <small className="text-sm text-muted-2"> / {sliderMaxLevel}</small>
                </div>
                <div className="text-right font-caps text-[0.52rem] uppercase leading-tight tracking-[0.14em] text-muted">
                  {isWeaponsCategory ? <>Niveau<br />de fusion</> : <>Niveau<br />actif</>}
                </div>
              </div>
            ) : null}
            <div className="mt-1">
              {typeof item.stats.rarity === "number" ? (
                <DnaStatRow label="Rareté" value={<DnaStars value={item.stats.rarity} />} />
              ) : null}
              {hasAffinityData ? (
                <DnaStatRow
                  label="Affinité"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {affinityIconSrc ? (
                        <img src={affinityIconSrc} alt="" className="h-5 w-5 object-contain" />
                      ) : null}
                      {translation.affinityName ?? `Polarité ${item.stats.polarity ?? "N/A"}`}
                      {item.affinity.char ? ` (${item.affinity.char})` : ""}
                    </span>
                  }
                />
              ) : null}
              {elementalAffinity ? (
                <DnaStatRow
                  label="Affinité élémentaire"
                  accent={tinted ? elHex : undefined}
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {elementalAffinity.iconSrc ? (
                        <img src={elementalAffinity.iconSrc} alt="" className="h-5 w-5 object-contain" />
                      ) : null}
                      {elementalAffinity.label}
                    </span>
                  }
                />
              ) : null}
              {weaponElement ? (
                <DnaStatRow
                  label="Élément"
                  accent={tinted ? elHex : undefined}
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <img src={weaponElement.icon} alt="" className="h-5 w-5 object-contain" />
                      {weaponElement.label}
                    </span>
                  }
                />
              ) : null}
              {weaponBaseAtk !== null ? (
                <DnaStatRow
                  label="ATK"
                  accent={tinted ? elHex : undefined}
                  value={
                    weaponMaxAtk !== null && weaponMaxAtk !== weaponBaseAtk
                      ? `${weaponBaseAtk} → ${weaponMaxAtk}`
                      : `${weaponBaseAtk}`
                  }
                />
              ) : null}
              {weaponCri !== null ? (
                <DnaStatRow label="Taux critique" value={formatRateValue(weaponCri)} />
              ) : null}
              {weaponCrd !== null ? (
                <DnaStatRow label="Dégâts critiques" value={formatRateValue(weaponCrd)} />
              ) : null}
              {typeof item.stats.cost === "number" ? (
                <DnaStatRow label="Coût" value={item.stats.cost} />
              ) : null}
              {typeof item.stats.maxLevel === "number" ? (
                <DnaStatRow label="Niveau max" value={item.stats.maxLevel} />
              ) : null}
              {isModsCategory ? (
                <DnaStatRow label="Tolérance" value={selectedTolerance ?? "N/A"} className="border-b-0" />
              ) : null}
            </div>
          </DnaPanel>

          {hasScalingData && !isWeaponsCategory ? (
            <DnaPanel className="p-4">
              <DnaSectionLabel>Niveau de progression</DnaSectionLabel>
              <div className="mt-3 flex items-center justify-between font-caps text-xs uppercase tracking-[0.14em] text-muted">
                <span>Lv {selectedLevel}</span>
                <span>Max {sliderMaxLevel}</span>
              </div>
              <input
                type="range"
                min={sliderMinLevel}
                max={sliderMaxLevel}
                step={1}
                value={selectedLevel}
                onChange={(event) => {
                  const requested = Number(event.target.value);
                  const nextLevel = nearestAllowedLevel(requested, levelOptions);
                  void setSelectedLevelRaw(nextLevel);
                }}
                className="mt-2 w-full cursor-pointer"
                style={{ accentColor: tinted ? elHex : GOLD_HEX }}
                aria-label={`Niveau du ${category.technicalName}`}
              />
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                <span>Défaut {item.scaling.defaultLevel}</span>
                <span>Max {item.scaling.maxLevel}</span>
                <span>Dyn {dynamicValueEntries.length}</span>
              </div>
            </DnaPanel>
          ) : null}
        </aside>
      </div>

      {/* Variantes (genimon) */}
      {isGenimonsCategory && variantSiblings.length > 1 ? (
        <DnaPanel className="p-3 md:p-5">
          <DnaSectionLabel>Variantes</DnaSectionLabel>
          <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2 md:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {variantSiblings.map((sibling) => {
              const isCurrent = sibling.id === item.id;
              const siblingTranslation = getItemTranslation(sibling, selectedLanguage, category.availableLanguages);
              const siblingIsPremium = sibling.variants?.isPremium ?? false;
              const siblingIcon = sibling.icon.publicPath ?? sibling.icon.placeholderPath ?? "/marker-default.svg";
              return (
                <Link
                  key={sibling.id}
                  href={`/items/${category.slug}/${sibling.id}`}
                  className={`flex items-center gap-3 rounded-sm border px-3 py-2 transition-colors ${
                    isCurrent
                      ? "border-gold/50 bg-gold/10"
                      : "border-white/10 bg-ink/55 hover:border-gold/40"
                  } ${siblingIsPremium ? "ring-1 ring-gold/30" : ""}`}
                >
                  <img src={siblingIcon} alt="" className="h-10 w-10 shrink-0 object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-parch">
                      {siblingTranslation.modName ?? `#${sibling.modId}`}
                    </p>
                    {siblingIsPremium ? <span className="text-xs text-gold">Premium</span> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </DnaPanel>
      ) : null}

      <section className="grid gap-3 md:gap-4 lg:grid-cols-3">
        <DnaPanel className="p-4 md:p-5 lg:col-span-2">
          <DnaSectionLabel>Description</DnaSectionLabel>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-parch/85">
            {translation.description
              ? renderTextWithDynamicMentions(
                  translation.description,
                  selectedLevel,
                  dynamicValuesByIndex,
                )
              : "No description available in the selected language."}
          </p>
          {showPassiveDescription ? (
            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="font-caps text-[0.66rem] uppercase tracking-[0.24em] text-gold/80">
                {isModsCategory
                  ? `Description effet passif (niveau ${selectedLevel})`
                  : isWeaponsCategory
                    ? `Effet de fusion (niveau ${selectedLevel})`
                    : "Description trait passif"}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-parch/85">
                {translation.passiveEffectsDescription
                  ? renderTextWithDynamicMentions(
                      translation.passiveEffectsDescription,
                      selectedLevel,
                      dynamicValuesByIndex,
                    )
                  : "No passive effects description available in the selected language."}
              </p>
              {passiveDescriptionHasDynamicTokens ? (
                <p className="mt-2 text-xs text-muted-2">
                  Survole les valeurs en surbrillance pour voir le token source <code>#n</code>.
                </p>
              ) : null}
              <details className="mt-3 rounded-sm border border-white/10 bg-ink/55 p-3">
                <summary className="cursor-pointer select-none text-xs uppercase tracking-[0.18em] text-parch/85">
                  {hasLeveledPassive
                    ? `Variables dynamiques (niveau ${selectedLevel})`
                    : "Variables dynamiques"}
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dynamicValueEntries.length > 0 ? (
                    dynamicValueEntries.map(([index, value]) => (
                      <DnaTag key={`dynamic-${index}`}>
                        #{index} = {formatDynamicNumber(value)}
                      </DnaTag>
                    ))
                  ) : (
                    <span className="text-xs text-muted-2">Aucune variable dynamique pour ce niveau.</span>
                  )}
                </div>
              </details>
            </div>
          ) : null}

          {isModsCategory ? (
            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="font-caps text-[0.66rem] uppercase tracking-[0.24em] text-gold/80">
                Attributs resolus (niveau {selectedLevel})
              </h3>
              {selectedLevelAttributesVisible.length === 0 ? (
                <p className="mt-2 text-sm text-muted-2">Aucun attribut scalable detecte.</p>
              ) : (
                <div className="mt-2">
                  {selectedLevelAttributesVisible.map((attribute, index) => (
                    <DnaStatRow
                      key={`resolved-attr-${attribute.attrName ?? "unknown"}-${index}`}
                      accent={tinted ? elHex : undefined}
                      label={
                        <span className="flex flex-col">
                          <span className="text-parch">{attribute.attrName ?? "Attr"}</span>
                          {attribute.allowModMultiplier ? (
                            <span className="text-[11px] text-muted-2">
                              Multiplicateur : {attribute.allowModMultiplier}
                            </span>
                          ) : null}
                        </span>
                      }
                      value={formatResolvedAttributeValue(attribute)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {isGenimonsCategory ? (
            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="font-caps text-[0.66rem] uppercase tracking-[0.24em] text-gold/80">
                Attributs du trait passif
              </h3>
              {genimonAttributes.length === 0 ? (
                <p className="mt-2 text-sm text-muted-2">Aucun attribut resolu detecte.</p>
              ) : (
                <div className="mt-2">
                  {genimonAttributes.map((attribute, index) => {
                    const pieces: string[] = [];
                    if (attribute.rate) {
                      pieces.push(`Rate: ${attribute.rate}`);
                    }
                    if (attribute.value) {
                      pieces.push(`Value: ${attribute.value}`);
                    }
                    return (
                      <DnaStatRow
                        key={`genimon-attr-${attribute.attrName}-${index}`}
                        accent={tinted ? elHex : undefined}
                        label={<span className="text-parch">{attribute.attrName}</span>}
                        value={
                          pieces.length > 0
                            ? renderTextWithDynamicMentions(
                                pieces.join(" | "),
                                selectedLevel,
                                dynamicValuesByIndex,
                              )
                            : "N/A"
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </DnaPanel>

        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>Localized Info</DnaSectionLabel>
          <dl className="mt-3 md:mt-4 space-y-2 md:space-y-3 text-sm">
            <div>
              <dt className="text-muted">Label fonction</dt>
              <dd className="text-parch">{translation.functionLabel ?? "N/A"}</dd>
            </div>
            {resourceSType ? (
              <div>
                <dt className="text-muted">Type ressource</dt>
                <dd className="text-parch">{resourceSType}</dd>
              </div>
            ) : null}
            {isModsCategory ? (
              <>
                <div>
                  <dt className="text-muted">Nom archive</dt>
                  <dd className="text-parch">{translation.archiveName ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Affinite</dt>
                  <dd className="text-parch">
                    {translation.affinityName ?? "N/A"}
                    {item.affinity.char ? ` (${item.affinity.char})` : ""}
                  </dd>
                </div>
                {elementalAffinity ? (
                  <div>
                    <dt className="text-muted">Affinite elementaire</dt>
                    <dd className="inline-flex items-center gap-2 text-parch">
                      {elementalAffinity.iconSrc ? (
                        <img
                          src={elementalAffinity.iconSrc}
                          alt={elementalAffinity.label}
                          className="h-5 w-5 object-contain"
                        />
                      ) : null}
                      {elementalAffinity.label}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-muted">PassiveEffects</dt>
                  <dd className="text-parch">{passiveEffectsRaw}</dd>
                </div>
                <div>
                  <dt className="text-muted">Archive id</dt>
                  <dd className="text-parch">{item.archiveId ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Tolerance (niveau {selectedLevel})</dt>
                  <dd className="text-parch">{selectedTolerance ?? "N/A"}</dd>
                </div>
              </>
            ) : null}
            {isGenimonsCategory ? (
              <>
                <div>
                  <dt className="text-muted">Battle Pet ID</dt>
                  <dd className="text-parch">{battlePetId ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Support Skill ID</dt>
                  <dd className="text-parch">{supportSkillId ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Battle Pet Type</dt>
                  <dd className="text-parch">{battlePetType ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Trait key</dt>
                  <dd className="text-parch">{item.textKeys.passiveEffectsDescKey ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">PassiveEffects (raw)</dt>
                  <dd className="text-parch">{passiveEffectsRaw}</dd>
                </div>
                <div>
                  <dt className="text-muted">Paliers ascension</dt>
                  <dd className="text-parch">
                    {genimonBreakLevels.length > 0 ? genimonBreakLevels.join(" / ") : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Etapes ascension</dt>
                  <dd className="text-parch">
                    {genimonBreakEntryNums.length > 0 ? genimonBreakEntryNums.join(", ") : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">EXP collecte (rupture)</dt>
                  <dd className="text-parch">{genimonCollectRewardExp ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">EXP max du niveau max</dt>
                  <dd className="text-parch">{genimonMaxLevelExp ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">EXP totale vers niveau max</dt>
                  <dd className="text-parch">{genimonTotalExpAtMax ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">AddModMultiplier (resolu)</dt>
                  <dd className="whitespace-pre-wrap text-parch">
                    {resolvedAddModMultiplier ?? "N/A"}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>

        </DnaPanel>
      </section>

      <section className="grid gap-3 md:gap-4 lg:grid-cols-2">
        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>Text keys</DnaSectionLabel>
          <dl className="mt-3 md:mt-4 space-y-2 md:space-y-3 text-sm">
            {textKeyRows.map((row) => (
              <div key={row.label}>
                <dt className="text-muted">{row.label}</dt>
                <dd className="text-parch">{row.value ?? "N/A"}</dd>
              </div>
            ))}
          </dl>
        </DnaPanel>

        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>Technical</DnaSectionLabel>
          <dl className="mt-3 md:mt-4 space-y-2 md:space-y-3 text-sm">
            <div>
              <dt className="text-muted">id</dt>
              <dd className="text-parch">{item.id}</dd>
            </div>
            <div>
              <dt className="text-muted">game icon path</dt>
              <dd className="break-all text-parch">{item.icon.gamePath ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-muted">public icon path</dt>
              <dd className="break-all text-parch">{item.icon.publicPath ?? "N/A"}</dd>
            </div>
            {isModsCategory ? (
              <>
                <div>
                  <dt className="text-muted">affinity icon path</dt>
                  <dd className="break-all text-parch">{item.affinity.icon.publicPath ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-muted">tolerance base / step</dt>
                  <dd className="text-parch">
                    {item.tolerance.baseCost ?? "N/A"} / {item.tolerance.costChange ?? "N/A"}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </DnaPanel>
      </section>

      {relatedDrafts.length > 0 && (
        <DnaPanel className="p-4 md:p-5">
          <DnaSectionLabel>Plans associes</DnaSectionLabel>
          <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
            {relatedDrafts.map((draft) => {
              const draftName =
                resolveDraftTextByLanguage(draft.productName, selectedLanguage, category.availableLanguages) ??
                `Plan #${draft.draftId}`;
              const iconSrc = draft.productIcon.publicPath ?? draft.productIcon.placeholderPath;
              return (
                <Link
                  key={`${draft.draftId}-${draft.relation}`}
                  href={draft.href}
                  className="flex items-center gap-3 rounded-sm border border-white/10 bg-ink/55 px-4 py-3 transition-colors hover:border-gold/40 hover:bg-panel/75"
                >
                  {iconSrc && (
                    <img src={iconSrc} alt="" className="h-8 w-8 shrink-0 object-contain" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-parch">{draftName}</p>
                    <p className="text-xs text-muted">
                      Plan #{draft.draftId}
                      {" — "}
                      {draft.relation === "product" ? "Fabrique cet item" : "Utilise cet item comme ingredient"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-muted" />
                </Link>
              );
            })}
          </div>
        </DnaPanel>
      )}

      <RawFieldsSection fieldEntries={fieldEntries} />
    </div>
  );
}
