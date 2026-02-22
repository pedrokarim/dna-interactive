"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowLeft, Database, Heart, Languages, SlidersHorizontal, Tag } from "lucide-react";
import { useAtom } from "jotai";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import {
  getItemTranslation,
  getLanguageLabel,
  normalizeLanguageCodes,
} from "@/lib/items/catalog";
import type { ItemCategory, ItemRawField, ItemRecord, ItemResolvedAttribute } from "@/lib/items/types";
import { itemsFavoritesAtom, toggleItemFavoriteAtom } from "@/lib/store";

type ItemDetailClientProps = {
  category: ItemCategory;
  item: ItemRecord;
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

function renderTextWithDynamicMentions(
  text: string,
  level: number,
  valuesByIndex: Record<string, number>,
): ReactNode[] {
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
        <span className="mx-0.5 rounded-md border border-indigo-400/35 bg-indigo-500/20 px-1.5 py-0.5 font-medium text-indigo-100">
          {inlineValue}
        </span>
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700/90 bg-slate-950/95 px-2 py-1 text-[11px] text-slate-100 shadow-[0_8px_20px_rgba(2,6,23,0.45)] group-hover:block">
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

export default function ItemDetailClient({ category, item }: ItemDetailClientProps) {
  const [favoriteItems] = useAtom(itemsFavoritesAtom);
  const [, toggleItemFavorite] = useAtom(toggleItemFavoriteAtom);
  const isModsCategory = category.id === "mods";
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
  const resourceSType =
    typeof item.fields.ResourceSType === "string" ? item.fields.ResourceSType : null;
  const hasAffinityData =
    Boolean(
      affinityIconSrc ||
        translation.affinityName ||
        item.affinity.char ||
        typeof item.stats.polarity === "number",
    );
  const elementalAffinity = resolveElementalAffinity(item, translation.typeCompatibilityNames);
  const passiveDescriptionHasDynamicTokens =
    typeof translation.passiveEffectsDescription === "string" &&
    /#\d+/.test(translation.passiveEffectsDescription);
  const favoriteKey = `${category.id}:${item.id}`;
  const isFavorite = favoriteItems.has(favoriteKey);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/items/${category.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour liste
            </Link>
            <button
              type="button"
              onClick={() => toggleItemFavorite(favoriteKey)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isFavorite
                  ? "text-rose-300 hover:text-rose-200"
                  : "text-slate-300 hover:text-rose-300"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-400 text-rose-400" : ""}`} />
              {isFavorite ? "Retirer favori" : "Ajouter favori"}
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
            <Languages className="h-4 w-4 text-indigo-400/80" />
            <select
              value={selectedLanguage}
              onChange={(event) => {
                setSelectedLanguage(event.target.value);
              }}
              className="bg-transparent text-sm text-slate-100 outline-none"
            >
              {category.availableLanguages.map((code) => (
                <option key={code} value={code} className="bg-slate-900">
                  {getLanguageLabel(code)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/25 bg-slate-950/70 p-4">
            <img
              src={iconSrc}
              alt={`${category.technicalName} ${item.modId}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-400/80">
              {category.technicalName} #{item.modId}
            </p>
            <h1 className="text-3xl font-semibold text-white">
              <span className="inline-flex items-center gap-2">
                {elementalAffinity?.iconSrc ? (
                  <img
                    src={elementalAffinity.iconSrc}
                    alt=""
                    aria-hidden="true"
                    className="h-7 w-7 shrink-0 object-contain"
                  />
                ) : null}
                <span>{translation.modName ?? `${category.displayName} ${item.modId}`}</span>
              </span>
            </h1>
            <p className="text-sm text-slate-300">
              {translation.demonWedgeName
                ? `${category.displayName} ${translation.demonWedgeName}`
                : translation.functionLabel ??
                  (isModsCategory ? "No Demon Wedge translation for this language." : category.displayName)}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                ID {item.modId}
              </span>
              {typeof item.stats.rarity === "number" && (
                <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                  Rarity {item.stats.rarity}
                </span>
              )}
              {hasAffinityData ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                {affinityIconSrc ? (
                  <img
                    src={affinityIconSrc}
                    alt={translation.affinityName ?? `Affinity ${item.affinity.id ?? "?"}`}
                    className="h-4 w-4 object-contain"
                  />
                ) : null}
                <span>
                  {translation.affinityName ?? `Polarity ${item.stats.polarity ?? "N/A"}`}
                  {item.affinity.char ? ` (${item.affinity.char})` : ""}
                </span>
                </span>
              ) : null}
              {elementalAffinity ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                  {elementalAffinity.iconSrc ? (
                    <img
                      src={elementalAffinity.iconSrc}
                      alt={elementalAffinity.label}
                      className="h-4 w-4 object-contain"
                    />
                  ) : null}
                  {elementalAffinity.label}
                </span>
              ) : null}
              {typeof item.stats.maxLevel === "number" && (
                <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                  Max Level {item.stats.maxLevel}
                </span>
              )}
              {typeof item.stats.cost === "number" && (
                <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                  Cost {item.stats.cost}
                </span>
              )}
              {hasScalingData ? (
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-indigo-100">
                  Niveau actif {selectedLevel}
                </span>
              ) : null}
              {isModsCategory ? (
                <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                  Tolerance {selectedTolerance ?? "N/A"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {hasScalingData ? (
          <div className="mt-4 max-w-xl rounded-lg border border-slate-700/70 bg-slate-950/55 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-100">
                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400/80" />
                Niveau de progression
              </p>
              <p className="text-xs text-slate-300">
                Lv {selectedLevel} / {sliderMaxLevel}
              </p>
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
              className="mt-2 w-full accent-indigo-400"
              aria-label={`Niveau du ${category.technicalName}`}
            />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <span>Defaut {item.scaling.defaultLevel}</span>
              <span>Max {item.scaling.maxLevel}</span>
              <span>Dyn {dynamicValueEntries.length}</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {translation.description
              ? renderTextWithDynamicMentions(
                  translation.description,
                  selectedLevel,
                  dynamicValuesByIndex,
                )
              : "No description available in the selected language."}
          </p>
          {isModsCategory ? (
            <div className="mt-5 border-t border-slate-700/70 pt-4">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Description effet passif (niveau {selectedLevel})
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {translation.passiveEffectsDescription
                  ? renderTextWithDynamicMentions(
                      translation.passiveEffectsDescription,
                      selectedLevel,
                      dynamicValuesByIndex,
                    )
                  : "No passive effects description available in the selected language."}
              </p>
              {passiveDescriptionHasDynamicTokens ? (
                <p className="mt-2 text-xs text-slate-500">
                  Survole les valeurs en surbrillance pour voir le token source <code>#n</code>.
                </p>
              ) : null}
              <details className="mt-3 rounded-lg border border-slate-700/70 bg-slate-950/55 p-3">
                <summary className="cursor-pointer select-none text-xs uppercase tracking-[0.18em] text-slate-300">
                  Variables dynamiques (niveau {selectedLevel})
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dynamicValueEntries.length > 0 ? (
                    dynamicValueEntries.map(([index, value]) => (
                      <span
                        key={`dynamic-${index}`}
                        className="rounded-full border border-indigo-500/35 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-100"
                      >
                        #{index} = {formatDynamicNumber(value)}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Aucune variable dynamique pour ce niveau.</span>
                  )}
                </div>
              </details>
            </div>
          ) : null}

          {isModsCategory ? (
            <div className="mt-5 border-t border-slate-700/70 pt-4">
              <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                Attributs resolus (niveau {selectedLevel})
              </h3>
              {selectedLevelAttributesVisible.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Aucun attribut scalable detecte.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {selectedLevelAttributesVisible.map((attribute, index) => (
                    <div
                      key={`resolved-attr-${attribute.attrName ?? "unknown"}-${index}`}
                      className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-slate-100">{attribute.attrName ?? "Attr"}</p>
                      {attribute.allowModMultiplier && (
                        <p className="text-xs text-slate-500">
                          Multiplicateur: {attribute.allowModMultiplier}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-indigo-100">{formatResolvedAttributeValue(attribute)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="text-lg font-semibold text-white">Localized Info</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Label fonction</dt>
              <dd className="text-slate-100">{translation.functionLabel ?? "N/A"}</dd>
            </div>
            {resourceSType ? (
              <div>
                <dt className="text-slate-400">Type ressource</dt>
                <dd className="text-slate-100">{resourceSType}</dd>
              </div>
            ) : null}
            {isModsCategory ? (
              <>
                <div>
                  <dt className="text-slate-400">Nom archive</dt>
                  <dd className="text-slate-100">{translation.archiveName ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Affinite</dt>
                  <dd className="text-slate-100">
                    {translation.affinityName ?? "N/A"}
                    {item.affinity.char ? ` (${item.affinity.char})` : ""}
                  </dd>
                </div>
                {elementalAffinity ? (
                  <div>
                    <dt className="text-slate-400">Affinite elementaire</dt>
                    <dd className="inline-flex items-center gap-2 text-slate-100">
                      {elementalAffinity.iconSrc ? (
                        <img
                          src={elementalAffinity.iconSrc}
                          alt={elementalAffinity.label}
                          className="h-4 w-4 object-contain"
                        />
                      ) : null}
                      {elementalAffinity.label}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-slate-400">PassiveEffects</dt>
                  <dd className="text-slate-100">{passiveEffectsRaw}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Archive id</dt>
                  <dd className="text-slate-100">{item.archiveId ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Tolerance (niveau {selectedLevel})</dt>
                  <dd className="text-slate-100">{selectedTolerance ?? "N/A"}</dd>
                </div>
              </>
            ) : null}
          </dl>

        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Tag className="h-4 w-4 text-indigo-400/80" />
            Text keys
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">modNameKey</dt>
              <dd className="text-slate-100">{item.textKeys.modNameKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">descriptionKey</dt>
              <dd className="text-slate-100">{item.textKeys.descriptionKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">demonWedgeKey</dt>
              <dd className="text-slate-100">{item.textKeys.demonWedgeKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">functionKey</dt>
              <dd className="text-slate-100">{item.textKeys.functionKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">passiveEffectsDescKey</dt>
              <dd className="text-slate-100">{item.textKeys.passiveEffectsDescKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">affinityNameKey</dt>
              <dd className="text-slate-100">{item.textKeys.affinityNameKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">archiveNameKey</dt>
              <dd className="text-slate-100">{item.textKeys.archiveNameKey ?? "N/A"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Database className="h-4 w-4 text-indigo-400/80" />
            Technical
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">id</dt>
              <dd className="text-slate-100">{item.id}</dd>
            </div>
            <div>
              <dt className="text-slate-400">game icon path</dt>
              <dd className="break-all text-slate-100">{item.icon.gamePath ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">public icon path</dt>
              <dd className="break-all text-slate-100">{item.icon.publicPath ?? "N/A"}</dd>
            </div>
            {isModsCategory ? (
              <>
                <div>
                  <dt className="text-slate-400">affinity icon path</dt>
                  <dd className="break-all text-slate-100">{item.affinity.icon.publicPath ?? "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">tolerance base / step</dt>
                  <dd className="text-slate-100">
                    {item.tolerance.baseCost ?? "N/A"} / {item.tolerance.costChange ?? "N/A"}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
        <h2 className="text-lg font-semibold text-white">Raw fields</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="py-2 pr-4 font-medium">Field</th>
                <th className="py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fieldEntries.map(([field, value]) => (
                <tr key={field}>
                  <td className="whitespace-nowrap py-2 pr-4 text-slate-300">{field}</td>
                  <td className="py-2 text-slate-100">{formatRawFieldValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
