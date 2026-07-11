"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Heart,
  Languages,
  Search,
  SlidersHorizontal,
  X,
  ZoomIn,
} from "lucide-react";
import { useAtom } from "jotai";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  getCharacterSlug,
  getCharacterTranslation,
  getLanguageLabel,
  normalizeLanguageCodes,
} from "@/lib/characters/catalog";
import type { CharacterRecord, CharactersCatalog } from "@/lib/characters/types";
import { resolveCharacterDisplayName } from "@/lib/characters/catalog";
import {
  charactersFavoritesAtom,
  charactersFiltersStorageAtom,
  toggleCharacterFavoriteAtom,
} from "@/lib/store";
import FilterChips from "@/components/list/FilterChips";
import ViewModeToggle from "@/components/list/ViewModeToggle";
import { useListViewMode } from "@/components/list/useListViewMode";
import { DnaCharacterCard } from "@/components/dna/CharacterCard";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";
import { useDialogA11y } from "@/components/dna/useDialogA11y";
import { cn } from "@/components/dna/cn";
import type { ElementKey } from "@/components/dna/elements";

type SortMode = "default" | "name" | "element" | "rarity";
const SORT_MODE_VALUES = ["default", "name", "element", "rarity"] as const;
const PAGE_SIZE_VALUES = [12, 24, 48] as const;

const ELEMENT_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  Fire: { border: "border-pyro/50", bg: "bg-pyro/15", text: "text-pyro" },
  Water: { border: "border-hydro/50", bg: "bg-hydro/15", text: "text-hydro" },
  Thunder: { border: "border-electro/50", bg: "bg-electro/15", text: "text-electro" },
  Wind: { border: "border-anemo/50", bg: "bg-anemo/15", text: "text-anemo" },
  Light: { border: "border-lumino/50", bg: "bg-lumino/15", text: "text-lumino" },
  Dark: { border: "border-umbro/50", bg: "bg-umbro/15", text: "text-umbro" },
};

const ELEMENT_ICONS: Record<string, string> = {
  Fire: "/assets/items/mods/T_Armory_Fire.png",
  Water: "/assets/items/mods/T_Armory_Water.png",
  Thunder: "/assets/items/mods/T_Armory_Thunder.png",
  Wind: "/assets/items/mods/T_Armory_Wind.png",
  Light: "/assets/items/mods/T_Armory_Light.png",
  Dark: "/assets/items/mods/T_Armory_Dark.png",
};

const RARITY_COLORS: Record<number, { border: string; text: string }> = {
  5: { border: "border-gold/50", text: "text-gold-bright" },
  4: { border: "border-electro/50", text: "text-electro" },
  3: { border: "border-hydro/50", text: "text-hydro" },
};

type CharactersGridClientProps = {
  catalog: CharactersCatalog;
  characters: CharacterRecord[];
};

function isSortMode(value: string): value is SortMode {
  return SORT_MODE_VALUES.includes(value as SortMode);
}

function isAllowedPageSize(value: number): value is (typeof PAGE_SIZE_VALUES)[number] {
  return PAGE_SIZE_VALUES.includes(value as (typeof PAGE_SIZE_VALUES)[number]);
}

function sameStringArray(a: string[] | undefined, b: string[]): boolean {
  if (!a || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function buildPaginationItems(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const items: Array<number | "..."> = [1];
  let left = Math.max(2, currentPage - 1);
  let right = Math.min(totalPages - 1, currentPage + 1);
  if (currentPage <= 3) {
    left = 2;
    right = 4;
  } else if (currentPage >= totalPages - 2) {
    left = totalPages - 3;
    right = totalPages - 1;
  }
  if (left > 2) items.push("...");
  for (let page = left; page <= right; page += 1) items.push(page);
  if (right < totalPages - 1) items.push("...");
  items.push(totalPages);
  return items;
}

function characterSearchText(
  character: CharacterRecord,
  availableLanguages: string[],
): string {
  const elements = character.elements ?? [character.element];
  const values: string[] = [
    character.internalName,
    ...elements.flatMap((e) => [e.key, e.label]),
    character.camp.key,
    ...character.weaponTags,
    `${character.charId}`,
  ];
  for (const langCode of availableLanguages) {
    const translation = character.translations[langCode];
    if (!translation) continue;
    // resolveCharacterDisplayName remplace les noms-template "{nickname}"
    // par le nom marketing, sinon la recherche sur les protagonistes Umbro
    // ne matcherait jamais "Phoxhunter".
    const displayName = resolveCharacterDisplayName(character, langCode);
    if (displayName) values.push(displayName);
    if (translation.subtitle) values.push(translation.subtitle);
    if (translation.campName) values.push(translation.campName);
    if (translation.force) values.push(translation.force);
  }
  return values.join(" ").toLowerCase();
}

export default function CharactersGridClient({
  catalog,
  characters,
}: CharactersGridClientProps) {
  const t = useTranslations('characters');
  const tc = useTranslations('common');
  const [persistedFilters, setPersistedFilters] = useAtom(charactersFiltersStorageAtom);
  const [favoriteChars] = useAtom(charactersFavoritesAtom);
  const [, toggleFavorite] = useAtom(toggleCharacterFavoriteAtom);
  const [viewMode, setViewMode] = useListViewMode("characters", "simplified");

  const defaultLanguages = normalizeLanguageCodes(
    catalog.defaultGridLanguages,
    catalog.availableLanguages,
    ["FR", "EN"],
  );

  const [queryFilters, setQueryFilters] = useQueryStates({
    q: parseAsString,
    langs: parseAsArrayOf(parseAsString),
    element: parseAsString,
    weapon: parseAsString,
    camp: parseAsString,
    sort: parseAsStringLiteral(SORT_MODE_VALUES),
    size: parseAsInteger,
    page: parseAsInteger,
  });

  const hasUrlFilters =
    queryFilters.q !== null ||
    queryFilters.langs !== null ||
    queryFilters.element !== null ||
    queryFilters.weapon !== null ||
    queryFilters.camp !== null ||
    queryFilters.sort !== null ||
    queryFilters.size !== null ||
    queryFilters.page !== null;

  const search = queryFilters.q ?? (hasUrlFilters ? "" : persistedFilters.search ?? "");
  const selectedLanguages = normalizeLanguageCodes(
    queryFilters.langs ??
      (hasUrlFilters ? defaultLanguages : persistedFilters.selectedLanguages?.length ? persistedFilters.selectedLanguages : defaultLanguages),
    catalog.availableLanguages,
    defaultLanguages,
  );
  const elementFilter =
    queryFilters.element ?? (hasUrlFilters ? "all" : persistedFilters.elementFilter ?? "all");
  const weaponFilter =
    queryFilters.weapon ?? (hasUrlFilters ? "all" : persistedFilters.weaponFilter ?? "all");
  const campFilter =
    queryFilters.camp ?? (hasUrlFilters ? "all" : persistedFilters.campFilter ?? "all");
  const rawSortMode =
    queryFilters.sort ?? (hasUrlFilters ? "default" : persistedFilters.sortMode ?? "default");
  const sortMode: SortMode = isSortMode(rawSortMode) ? rawSortMode : "default";
  const rawPageSize =
    queryFilters.size ?? (hasUrlFilters ? 24 : persistedFilters.pageSize ?? 24);
  const pageSize = isAllowedPageSize(rawPageSize) ? rawPageSize : 24;
  const rawCurrentPage =
    queryFilters.page ?? (hasUrlFilters ? 1 : persistedFilters.currentPage ?? 1);
  const currentPage =
    Number.isFinite(rawCurrentPage) && rawCurrentPage > 0 ? rawCurrentPage : 1;

  const [previewPortrait, setPreviewPortrait] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(previewPanelRef, {
    open: previewPortrait !== null,
    onClose: () => setPreviewPortrait(null),
  });

  const updateQueryFilters = (overrides: {
    q?: string;
    langs?: string[];
    element?: string;
    weapon?: string;
    camp?: string;
    sort?: SortMode;
    size?: number;
    page?: number;
  }): void => {
    const next = {
      q: search,
      langs: selectedLanguages,
      element: elementFilter,
      weapon: weaponFilter,
      camp: campFilter,
      sort: sortMode,
      size: pageSize,
      page: currentPage,
      ...overrides,
    };
    void setQueryFilters({
      q: next.q,
      langs: next.langs,
      element: next.element,
      weapon: next.weapon,
      camp: next.camp,
      sort: next.sort,
      size: next.size,
      page: next.page,
    });
  };

  const favoriteCount = useMemo(
    () => characters.filter((c) => favoriteChars.has(c.id)).length,
    [characters, favoriteChars],
  );

  const searchable = useMemo(
    () =>
      characters.map((character) => ({
        character,
        searchText: characterSearchText(character, catalog.availableLanguages),
      })),
    [characters, catalog.availableLanguages],
  );

  const filteredCharacters = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = searchable
      .filter(({ character, searchText }) => {
        if (normalizedSearch.length > 0 && !searchText.includes(normalizedSearch)) {
          return false;
        }
        if (
          elementFilter !== "all" &&
          !(character.elements ?? [character.element]).some(
            (e) => e.key === elementFilter,
          )
        ) {
          return false;
        }
        if (weaponFilter !== "all" && !character.weaponTags.includes(weaponFilter)) {
          return false;
        }
        if (campFilter !== "all" && character.camp.key !== campFilter) {
          return false;
        }
        return true;
      })
      .map(({ character }) => character);

    filtered.sort((a, b) => {
      if (sortMode === "name") {
        const langCode = selectedLanguages[0] ?? "EN";
        const nameA = a.translations[langCode]?.name ?? a.internalName;
        const nameB = b.translations[langCode]?.name ?? b.internalName;
        return nameA.localeCompare(nameB);
      }
      if (sortMode === "element") {
        const cmp = a.element.key.localeCompare(b.element.key);
        if (cmp !== 0) return cmp;
        return (a.sortPriority ?? 9999) - (b.sortPriority ?? 9999);
      }
      if (sortMode === "rarity") {
        const rarA = a.rarity ?? 0;
        const rarB = b.rarity ?? 0;
        if (rarA !== rarB) return rarB - rarA;
        return (a.sortPriority ?? 9999) - (b.sortPriority ?? 9999);
      }
      return (a.sortPriority ?? 9999) - (b.sortPriority ?? 9999);
    });

    return filtered;
  }, [search, elementFilter, weaponFilter, campFilter, sortMode, searchable, selectedLanguages]);

  const unselectedLanguages = catalog.availableLanguages.filter(
    (code) => !selectedLanguages.includes(code),
  );

  const totalPages = Math.max(1, Math.ceil(filteredCharacters.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginationItems = useMemo(
    () => buildPaginationItems(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages],
  );
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const paginatedCharacters = filteredCharacters.slice(pageStart, pageEnd);

  useEffect(() => {
    if (!hasUrlFilters && !persistedFilters) return;
    const next = {
      search,
      elementFilter,
      weaponFilter,
      campFilter,
      selectedLanguages,
      sortMode,
      pageSize,
      currentPage: safeCurrentPage,
    };
    setPersistedFilters((prev) => {
      const isSame =
        prev.search === next.search &&
        prev.elementFilter === next.elementFilter &&
        prev.weaponFilter === next.weaponFilter &&
        prev.campFilter === next.campFilter &&
        prev.sortMode === next.sortMode &&
        prev.pageSize === next.pageSize &&
        prev.currentPage === next.currentPage &&
        sameStringArray(prev.selectedLanguages, next.selectedLanguages);
      if (isSame) return prev;
      return next;
    });
  }, [
    search,
    elementFilter,
    weaponFilter,
    campFilter,
    selectedLanguages,
    sortMode,
    pageSize,
    safeCurrentPage,
    hasUrlFilters,
    persistedFilters,
    setPersistedFilters,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      void setQueryFilters({ page: totalPages });
    }
  }, [currentPage, totalPages, setQueryFilters]);

  const addLanguage = (code: string) => {
    if (!code) return;
    const next = selectedLanguages.includes(code)
      ? selectedLanguages
      : normalizeLanguageCodes(
          [...selectedLanguages, code],
          catalog.availableLanguages,
          selectedLanguages,
        );
    updateQueryFilters({ langs: next, page: 1 });
  };

  const removeLanguage = (code: string) => {
    if (selectedLanguages.length <= 1) return;
    const next = selectedLanguages.filter((lang) => lang !== code);
    updateQueryFilters({ langs: next, page: 1 });
  };

  const resetFilters = () => {
    updateQueryFilters({
      q: "",
      langs: defaultLanguages,
      element: "all",
      weapon: "all",
      camp: "all",
      sort: "default",
      size: 24,
      page: 1,
    });
  };

  return (
    <div className="space-y-4 md:space-y-8">
      {/* En-tête gabarit — eyebrow mono + titre + compteur en équerres */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-gold">
            {`// ${t('headerLabel')}`}
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">
            {t('title')}
          </h1>
          <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
          <p className="mt-3 max-w-2xl text-sm text-parch/75">{t('description')}</p>
        </div>
        <div className="relative shrink-0 px-5 py-3">
          <DnaCornerBrackets size={16} />
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-semibold tabular-nums text-parch">
              {filteredCharacters.length}
            </span>
            <span className="font-caps text-[0.55rem] uppercase leading-tight tracking-[0.2em] text-muted">
              {t('headerLabel')}
            </span>
          </div>
        </div>
      </div>

      {/* Barre d'outils + filtres */}
      <section className="border border-line/20 bg-panel/55 p-4 md:p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {t('count', { filtered: filteredCharacters.length, total: characters.length })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              labels={{
                simplified: tc('viewSimplified'),
                list: tc('viewList'),
                detailed: tc('viewDetailed'),
                group: tc('viewMode'),
              }}
            />
            <span className="inline-flex items-center gap-2 rounded-sm border border-crimson/40 bg-crimson/10 px-4 py-2 text-sm text-crimson-bright">
              <Heart className="h-4 w-4" />
              {tc('favorites')} ({favoriteCount})
            </span>
          </div>
        </div>

        {/* Search + languages */}
        <div className="mt-4 md:mt-6 grid gap-3 md:gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-sm border border-white/10 bg-ink/60 px-3 py-2">
            <Search className="h-4 w-4 text-gold/80" />
            <input
              value={search}
              onChange={(event) =>
                updateQueryFilters({ q: event.target.value, page: 1 })
              }
              className="w-full bg-transparent text-sm text-parch outline-none placeholder:text-muted-2"
              placeholder={t('searchPlaceholder')}
            />
          </label>

          <div className="rounded-sm border border-white/10 bg-ink/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted">
              <Languages className="h-4 w-4 text-gold/80" />
              {tc('displayedLanguages')}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedLanguages.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 rounded-sm border border-gold/35 bg-gold/10 px-3 py-1 text-xs text-gold"
                >
                  {getLanguageLabel(code)}
                  {selectedLanguages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(code)}
                      className="rounded-full p-0.5 text-gold/80 transition-colors hover:bg-gold/20 hover:text-parch"
                      aria-label={`Supprimer la langue ${code}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              <select
                value=""
                onChange={(event) => addLanguage(event.target.value)}
                aria-label={tc('addLanguage')}
                className="rounded-sm border border-white/10 bg-panel px-2 py-1 text-xs text-parch outline-none"
              >
                <option value="">{tc('addLanguage')}</option>
                {unselectedLanguages.map((code) => (
                  <option key={code} value={code}>
                    {getLanguageLabel(code)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
          <FilterChips
            label={t('filterElement')}
            icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/80" />}
            options={catalog.elements.map((el) => ({
              value: el.key,
              label: `${el.label} (${el.key})`,
              iconSrc: ELEMENT_ICONS[el.key] ?? null,
            }))}
            value={elementFilter}
            onChange={(value) => updateQueryFilters({ element: value, page: 1 })}
            allLabel={tc('all')}
          />

          <FilterChips
            label={t('filterWeapon')}
            icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/80" />}
            options={catalog.weaponTypes.map((wt) => ({ value: wt, label: wt }))}
            value={weaponFilter}
            onChange={(value) => updateQueryFilters({ weapon: value, page: 1 })}
            allLabel={tc('allFeminine')}
          />

          <FilterChips
            label={t('filterFaction')}
            icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/80" />}
            options={catalog.camps.map((c) => ({ value: c.key, label: c.key }))}
            value={campFilter}
            onChange={(value) => updateQueryFilters({ camp: value, page: 1 })}
            allLabel={tc('allFeminine')}
          />

          <div className="rounded-sm border border-white/10 bg-ink/60 p-2 sm:max-w-xs">
            <div className="mb-1 text-xs text-muted">{tc('sort')}</div>
            <select
              value={sortMode}
              onChange={(event) =>
                updateQueryFilters({
                  sort: event.target.value as SortMode,
                  page: 1,
                })
              }
              aria-label={tc('sort')}
              className="w-full rounded-sm border border-white/10 bg-panel px-2 py-1.5 text-sm text-parch"
            >
              <option value="default">{t('sortDefault')}</option>
              <option value="name">{t('sortName')}</option>
              <option value="element">{t('sortElement')}</option>
              <option value="rarity">{t('sortRarity')}</option>
            </select>
          </div>
        </div>

        {/* Result count + reset */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-ink/60 px-3 py-2 text-sm text-parch/85">
          <p>
            {tc('displayRange', { start: filteredCharacters.length === 0 ? 0 : pageStart + 1, end: Math.min(pageEnd, filteredCharacters.length), total: filteredCharacters.length })}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-sm border border-white/10 px-3 py-1 text-xs text-parch/85 transition-colors hover:border-gold/40 hover:text-parch"
          >
            {tc('resetFilters')}
          </button>
        </div>
      </section>

      {/* Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="rounded-sm border border-white/10 bg-panel/45 p-6 md:p-10 text-center">
          <p className="text-base md:text-lg text-parch">
            {t('noResults')}
          </p>
          <p className="mt-2 text-sm text-muted">
            {t('noResultsHint')}
          </p>
        </div>
      ) : (
        viewMode === "detailed" ? (
        <section className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {paginatedCharacters.map((character) => {
            const lead = getCharacterTranslation(
              character,
              selectedLanguages[0],
              catalog.availableLanguages,
            );
            const headSrc = character.portraits.head.publicPath;
            const iconSrc = character.portraits.icon.publicPath;
            const isFavorite = favoriteChars.has(character.id);
            const elements = character.elements ?? [character.element];
            const rarityStyle = RARITY_COLORS[character.rarity ?? 0];
            const displayName = lead.name ?? character.internalName;

            return (
              <Link
                key={character.id}
                href={`/characters/${getCharacterSlug(character)}`}
                className={`group relative overflow-hidden border bg-panel/55 transition-all duration-200 hover:-translate-y-0.5 hover:bg-panel/75 ${
                  rarityStyle
                    ? `${rarityStyle.border} hover:border-opacity-70`
                    : "border-white/10 hover:border-gold/40"
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-ink/80">
                  {headSrc ? (
                    <img
                      src={headSrc}
                      alt={displayName}
                      width={200}
                      height={200}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : iconSrc ? (
                    <div className="flex h-full w-full items-center justify-center p-8">
                      <img
                        src={iconSrc}
                        alt={displayName}
                        width={200}
                        height={200}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-4xl font-bold text-muted-2">
                        {character.internalName[0]}
                      </span>
                    </div>
                  )}

                  {elements.length > 0 ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-ink/70 px-2 py-1.5 backdrop-blur-sm">
                      {elements.map((el) => {
                        const icon = ELEMENT_ICONS[el.key];
                        if (!icon) return null;
                        return (
                          <img
                            key={el.key}
                            src={icon}
                            alt={el.label}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                          />
                        );
                      })}
                    </span>
                  ) : null}

                  {character.rarity ? (
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${
                        rarityStyle
                          ? `${rarityStyle.border} bg-ink/70 ${rarityStyle.text}`
                          : "border border-white/10 bg-ink/70 text-parch/85"
                      }`}
                    >
                      {"★".repeat(character.rarity)}
                    </span>
                  ) : null}

                  {headSrc ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewPortrait({ src: headSrc, alt: displayName });
                      }}
                      className="absolute bottom-2 right-2 rounded-full border border-white/10 bg-panel/90 p-1.5 text-parch opacity-0 shadow-sm transition-all hover:border-gold/60 hover:bg-gold/80 hover:text-parch group-hover:opacity-100"
                      aria-label={t('zoomPortrait', { name: displayName })}
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-lg font-semibold text-parch transition-colors group-hover:text-gold-bright">
                        {displayName}
                      </h3>
                      <p className="truncate text-xs text-muted">
                        {character.weaponTags.join(" / ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleFavorite(character.id);
                      }}
                      aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                      className={`shrink-0 rounded-full p-1.5 transition-colors ${
                        isFavorite
                          ? "text-crimson-bright hover:text-crimson-bright"
                          : "text-muted-2 hover:text-crimson-bright"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFavorite ? "fill-crimson-bright text-crimson-bright" : ""}`}
                      />
                    </button>
                  </div>

                  {selectedLanguages.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {selectedLanguages.map((langCode) => {
                        const translation = character.translations[langCode];
                        return (
                          <div
                            key={`${character.id}-${langCode}`}
                            className="rounded-sm border border-white/10 bg-ink/55 px-2.5 py-1.5"
                          >
                            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                              {getLanguageLabel(langCode)}
                            </p>
                            <p className="truncate text-sm font-medium text-parch">
                              {translation?.name ?? "N/A"}
                            </p>
                            {translation?.subtitle && (
                              <p className="truncate text-xs text-muted">
                                {translation.subtitle}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    {lead.campName && (
                      <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                        {lead.campName}
                      </span>
                    )}
                    <ChevronRight className="ml-auto mt-0.5 h-3.5 w-3.5 text-muted-2 transition-colors group-hover:text-gold" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
        ) : viewMode === "list" ? (
        <ul className="space-y-2">
          {paginatedCharacters.map((character) => {
            const lead = getCharacterTranslation(
              character,
              selectedLanguages[0],
              catalog.availableLanguages,
            );
            const headSrc = character.portraits.head.publicPath;
            const iconSrc = character.portraits.icon.publicPath;
            const thumbSrc = headSrc ?? iconSrc;
            const isFavorite = favoriteChars.has(character.id);
            const elements = character.elements ?? [character.element];
            const rarityStyle = RARITY_COLORS[character.rarity ?? 0];
            const displayName = lead.name ?? character.internalName;

            return (
              <li key={character.id}>
                <Link
                  href={`/characters/${getCharacterSlug(character)}`}
                  className={`group flex items-center gap-4 border bg-panel/55 p-3 transition-all duration-200 hover:bg-panel/75 ${
                    rarityStyle
                      ? `${rarityStyle.border} hover:border-opacity-70`
                      : "border-white/10 hover:border-gold/40"
                  }`}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-ink/80">
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt={displayName}
                        width={64}
                        height={64}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-2">
                        {character.internalName[0]}
                      </div>
                    )}
                    {elements.length > 0 ? (
                      <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-ink/90 px-1 py-1">
                        {elements.map((el) => {
                          const icon = ELEMENT_ICONS[el.key];
                          if (!icon) return null;
                          return (
                            <img
                              key={el.key}
                              src={icon}
                              alt={el.label}
                              width={16}
                              height={16}
                              className="h-4 w-4 object-contain"
                            />
                          );
                        })}
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-lg font-semibold text-parch transition-colors group-hover:text-gold-bright">
                        {displayName}
                      </h3>
                      {character.rarity ? (
                        <span
                          className={`shrink-0 text-xs ${rarityStyle ? rarityStyle.text : "text-parch/85"}`}
                        >
                          {"★".repeat(character.rarity)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {elements.map((el) => {
                        const style = ELEMENT_COLORS[el.key];
                        const icon = ELEMENT_ICONS[el.key];
                        if (!style) return null;
                        return (
                          <span
                            key={el.key}
                            className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 ${style.border} ${style.bg} ${style.text}`}
                          >
                            {icon ? (
                              <img
                                src={icon}
                                alt=""
                                aria-hidden="true"
                                width={16}
                                height={16}
                                className="h-4 w-4 object-contain"
                              />
                            ) : null}
                            {el.label}
                          </span>
                        );
                      })}
                      {character.weaponTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85"
                        >
                          {tag}
                        </span>
                      ))}
                      {lead.campName ? (
                        <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                          {lead.campName}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleFavorite(character.id);
                      }}
                      aria-label={
                        isFavorite ? t('removeFromFavorites') : t('addToFavorites')
                      }
                      className={`rounded-full p-1.5 transition-colors ${
                        isFavorite
                          ? "text-crimson-bright hover:text-crimson-bright"
                          : "text-muted-2 hover:text-crimson-bright"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFavorite ? "fill-crimson-bright text-crimson-bright" : ""}`}
                      />
                    </button>
                    {headSrc ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setPreviewPortrait({ src: headSrc, alt: displayName });
                        }}
                        className="rounded-full border border-white/10 bg-panel/90 p-1.5 text-parch transition-colors hover:border-gold/60 hover:bg-gold/80 hover:text-parch"
                        aria-label={t('zoomPortrait', { name: displayName })}
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <ChevronRight className="h-4 w-4 text-muted-2 transition-colors group-hover:text-gold" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 xl:grid-cols-5 2xl:grid-cols-6">
          {paginatedCharacters.map((character) => {
            const lead = getCharacterTranslation(
              character,
              selectedLanguages[0],
              catalog.availableLanguages,
            );
            const headSrc = character.portraits.head.publicPath;
            const iconSrc = character.portraits.icon.publicPath;
            const portrait = character.portraits.gacha.publicPath ?? headSrc ?? iconSrc;
            const isFavorite = favoriteChars.has(character.id);
            const displayName = lead.name ?? character.internalName;

            return (
              <Link
                key={character.id}
                href={`/characters/${getCharacterSlug(character)}`}
                title={displayName}
                className="group/card relative block"
              >
                <DnaCharacterCard
                  name={displayName}
                  subtitle={lead.subtitle ?? undefined}
                  element={character.element.key as ElementKey}
                  elements={(character.elements ?? [character.element]).map((e) => e.key as ElementKey)}
                  rarity={character.rarity ?? 5}
                  weapons={character.weaponTags}
                  portrait={portrait}
                  topRight={
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleFavorite(character.id);
                      }}
                      aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                      className={cn(
                        "rounded-full bg-ink/60 p-1 backdrop-blur-sm transition-all",
                        isFavorite
                          ? "text-crimson-bright"
                          : "text-parch/85 opacity-0 hover:text-crimson-bright group-hover/card:opacity-100",
                      )}
                    >
                      <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-crimson-bright text-crimson-bright")} />
                    </button>
                  }
                >
                  {headSrc ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewPortrait({ src: headSrc, alt: displayName });
                      }}
                      className="absolute bottom-2 right-2 z-[4] rounded-full border border-white/10 bg-panel/90 p-1 text-parch opacity-0 transition-all hover:border-gold/60 hover:bg-gold/80 hover:text-ink group-hover/card:opacity-100"
                      aria-label={t('zoomPortrait', { name: displayName })}
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>
                  ) : null}
                </DnaCharacterCard>
              </Link>
            );
          })}
        </section>
        )
      )}

      {/* Pagination */}
      {filteredCharacters.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-panel/50 p-3">
          <p className="text-sm text-parch/85">
            {tc('displayRange', { start: filteredCharacters.length === 0 ? 0 : pageStart + 1, end: Math.min(pageEnd, filteredCharacters.length), total: filteredCharacters.length })}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateQueryFilters({ page: 1 })}
                disabled={safeCurrentPage === 1}
                className="rounded-sm border border-white/10 px-2 py-1 text-xs text-parch transition-colors hover:border-gold/40 hover:text-parch disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tc('paginationFirst')}
              >
                {"<<"}
              </button>
              <button
                type="button"
                onClick={() =>
                  updateQueryFilters({ page: Math.max(1, safeCurrentPage - 1) })
                }
                disabled={safeCurrentPage === 1}
                className="rounded-sm border border-white/10 px-2 py-1 text-xs text-parch transition-colors hover:border-gold/40 hover:text-parch disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tc('paginationPrevious')}
              >
                {"<"}
              </button>

              {paginationItems.map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1 text-xs text-muted-2"
                    aria-hidden="true"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${page}`}
                    type="button"
                    onClick={() => updateQueryFilters({ page })}
                    className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                      page === safeCurrentPage
                        ? "border-gold/70 bg-gold/25 text-gold"
                        : "border-white/10 text-parch hover:border-gold/40 hover:text-parch"
                    }`}
                    aria-label={tc('paginationGoTo', { page })}
                    aria-current={page === safeCurrentPage ? "page" : undefined}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  updateQueryFilters({
                    page: Math.min(totalPages, safeCurrentPage + 1),
                  })
                }
                disabled={safeCurrentPage === totalPages}
                className="rounded-sm border border-white/10 px-2 py-1 text-xs text-parch transition-colors hover:border-gold/40 hover:text-parch disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tc('paginationNext')}
              >
                {">"}
              </button>
              <button
                type="button"
                onClick={() => updateQueryFilters({ page: totalPages })}
                disabled={safeCurrentPage === totalPages}
                className="rounded-sm border border-white/10 px-2 py-1 text-xs text-parch transition-colors hover:border-gold/40 hover:text-parch disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tc('paginationLast')}
              >
                {">>"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">
                Par page
              </span>
              <select
                value={pageSize}
                onChange={(event) =>
                  updateQueryFilters({
                    size: Number(event.target.value),
                    page: 1,
                  })
                }
                aria-label="Par page"
                className="rounded-sm border border-white/10 bg-panel px-2 py-1 text-xs text-parch"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Portrait preview modal */}
      {previewPortrait && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewPortrait(null)}
        >
          <div
            ref={previewPanelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Apercu du portrait de ${previewPortrait.alt}`}
            className="w-full max-w-md border border-gold/30 bg-panel/95 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-parch">
                {previewPortrait.alt}
              </p>
              <button
                type="button"
                onClick={() => setPreviewPortrait(null)}
                className="rounded-full p-1 text-parch/85 transition-colors hover:bg-panel hover:text-parch"
                aria-label={tc('close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center overflow-hidden rounded-sm border border-gold/20 bg-ink/80">
              <img
                src={previewPortrait.src}
                alt={previewPortrait.alt}
                width={300}
                height={400}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
