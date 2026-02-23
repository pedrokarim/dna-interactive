"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  getCharacterTranslation,
  getLanguageLabel,
  normalizeLanguageCodes,
} from "@/lib/characters/catalog";
import type { CharacterRecord, CharactersCatalog } from "@/lib/characters/types";
import {
  charactersFavoritesAtom,
  charactersFiltersStorageAtom,
  toggleCharacterFavoriteAtom,
} from "@/lib/store";

type SortMode = "default" | "name" | "element" | "rarity";
const SORT_MODE_VALUES = ["default", "name", "element", "rarity"] as const;
const PAGE_SIZE_VALUES = [12, 24, 48] as const;

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

const RARITY_COLORS: Record<number, { border: string; text: string }> = {
  5: { border: "border-amber-400/50", text: "text-amber-300" },
  4: { border: "border-violet-400/50", text: "text-violet-300" },
  3: { border: "border-blue-400/50", text: "text-blue-300" },
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
  const values: string[] = [
    character.internalName,
    character.element.key,
    character.element.label,
    character.camp.key,
    ...character.weaponTags,
    `${character.charId}`,
  ];
  for (const langCode of availableLanguages) {
    const translation = character.translations[langCode];
    if (!translation) continue;
    if (translation.name) values.push(translation.name);
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
  const [persistedFilters, setPersistedFilters] = useAtom(charactersFiltersStorageAtom);
  const [favoriteChars] = useAtom(charactersFavoritesAtom);
  const [, toggleFavorite] = useAtom(toggleCharacterFavoriteAtom);

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
        if (elementFilter !== "all" && character.element.key !== elementFilter) {
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
    <div className="space-y-8">
      {/* Header + filters */}
      <section className="rounded-2xl border border-indigo-500/20 bg-slate-900/55 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-400/80">
              Personnages
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Personnages Duet Night Abyss
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Base de donnees des personnages jouables : elements, armes, factions, portraits et
              traductions multilingues.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              {filteredCharacters.length} / {characters.length} personnages
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
              <Heart className="h-4 w-4" />
              Favoris ({favoriteCount})
            </span>
          </div>
        </div>

        {/* Search + languages */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2">
            <Search className="h-4 w-4 text-indigo-400/80" />
            <input
              value={search}
              onChange={(event) =>
                updateQueryFilters({ q: event.target.value, page: 1 })
              }
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Rechercher par nom, element, arme, faction..."
            />
          </label>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              <Languages className="h-4 w-4 text-indigo-400/80" />
              Langues affichees
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedLanguages.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-500/35 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100"
                >
                  {getLanguageLabel(code)}
                  {selectedLanguages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(code)}
                      className="rounded-full p-0.5 text-indigo-100/80 transition-colors hover:bg-indigo-400/20 hover:text-white"
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
                className="rounded-lg border border-slate-600/80 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none"
              >
                <option value="">Ajouter langue...</option>
                {unselectedLanguages.map((code) => (
                  <option key={code} value={code}>
                    {getLanguageLabel(code)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter selects */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400/80" />
              Element
            </div>
            <select
              value={elementFilter}
              onChange={(event) =>
                updateQueryFilters({ element: event.target.value, page: 1 })
              }
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">Tous</option>
              {catalog.elements.map((el) => (
                <option key={el.key} value={el.key}>
                  {el.label} ({el.key})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400/80" />
              Arme
            </div>
            <select
              value={weaponFilter}
              onChange={(event) =>
                updateQueryFilters({ weapon: event.target.value, page: 1 })
              }
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">Toutes</option>
              {catalog.weaponTypes.map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400/80" />
              Faction
            </div>
            <select
              value={campFilter}
              onChange={(event) =>
                updateQueryFilters({ camp: event.target.value, page: 1 })
              }
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">Toutes</option>
              {catalog.camps.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.key}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 text-xs text-slate-400">Tri</div>
            <select
              value={sortMode}
              onChange={(event) =>
                updateQueryFilters({
                  sort: event.target.value as SortMode,
                  page: 1,
                })
              }
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="default">Par defaut</option>
              <option value="name">Par nom</option>
              <option value="element">Par element</option>
              <option value="rarity">Par rarete</option>
            </select>
          </div>
        </div>

        {/* Result count + reset */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
          <p>
            Affichage {filteredCharacters.length === 0 ? 0 : pageStart + 1}-
            {Math.min(pageEnd, filteredCharacters.length)} sur {filteredCharacters.length}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
          >
            Reinitialiser filtres
          </button>
        </div>
      </section>

      {/* Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/45 p-10 text-center">
          <p className="text-lg text-slate-200">
            Aucun personnage ne correspond aux filtres actuels.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Ajuste les filtres ou la recherche.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedCharacters.map((character) => {
            const lead = getCharacterTranslation(
              character,
              selectedLanguages[0],
              catalog.availableLanguages,
            );
            const headSrc = character.portraits.head.publicPath;
            const iconSrc = character.portraits.icon.publicPath;
            const isFavorite = favoriteChars.has(character.id);
            const elementStyle = ELEMENT_COLORS[character.element.key];
            const elementIcon = ELEMENT_ICONS[character.element.key];
            const rarityStyle = RARITY_COLORS[character.rarity ?? 0];

            return (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className={`group relative overflow-hidden rounded-2xl border bg-slate-900/55 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900/75 ${
                  rarityStyle
                    ? `${rarityStyle.border} hover:border-opacity-70`
                    : "border-slate-700/70 hover:border-indigo-400/40"
                }`}
              >
                {/* Portrait */}
                <div className="relative aspect-square overflow-hidden bg-slate-950/80">
                  {headSrc ? (
                    <img
                      src={headSrc}
                      alt={lead.name ?? character.internalName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : iconSrc ? (
                    <div className="flex h-full w-full items-center justify-center p-8">
                      <img
                        src={iconSrc}
                        alt={lead.name ?? character.internalName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-4xl font-bold text-slate-700">
                        {character.internalName[0]}
                      </span>
                    </div>
                  )}

                  {/* Element badge */}
                  {elementStyle && (
                    <span
                      className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${elementStyle.border} ${elementStyle.bg} ${elementStyle.text} backdrop-blur-sm`}
                    >
                      {elementIcon ? (
                        <img
                          src={elementIcon}
                          alt={character.element.label}
                          className="h-4 w-4 object-contain"
                        />
                      ) : null}
                    </span>
                  )}

                  {/* Rarity stars */}
                  {character.rarity && (
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${
                        rarityStyle
                          ? `${rarityStyle.border} bg-slate-950/70 ${rarityStyle.text}`
                          : "border border-slate-600/60 bg-slate-950/70 text-slate-300"
                      }`}
                    >
                      {"★".repeat(character.rarity)}
                    </span>
                  )}

                  {/* Zoom button */}
                  {headSrc && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewPortrait({
                          src: headSrc,
                          alt: lead.name ?? character.internalName,
                        });
                      }}
                      className="absolute bottom-2 right-2 rounded-full border border-slate-700 bg-slate-900/90 p-1.5 text-slate-200 opacity-0 shadow-sm transition-all hover:border-indigo-400/60 hover:bg-indigo-500/80 hover:text-white group-hover:opacity-100"
                      aria-label={`Agrandir le portrait de ${lead.name ?? character.internalName}`}
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-indigo-100">
                        {lead.name ?? character.internalName}
                      </h3>
                      <p className="truncate text-xs text-slate-400">
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
                      aria-label={
                        isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                      }
                      className={`shrink-0 rounded-full p-1.5 transition-colors ${
                        isFavorite
                          ? "text-rose-400 hover:text-rose-300"
                          : "text-slate-500 hover:text-rose-300"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isFavorite ? "fill-rose-400 text-rose-400" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Language translations */}
                  {selectedLanguages.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {selectedLanguages.map((langCode) => {
                        const translation = character.translations[langCode];
                        return (
                          <div
                            key={`${character.id}-${langCode}`}
                            className="rounded-lg border border-slate-700/60 bg-slate-950/55 px-2.5 py-1.5"
                          >
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                              {getLanguageLabel(langCode)}
                            </p>
                            <p className="truncate text-sm font-medium text-slate-100">
                              {translation?.name ?? "N/A"}
                            </p>
                            {translation?.subtitle && (
                              <p className="truncate text-xs text-slate-400">
                                {translation.subtitle}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    {lead.campName && (
                      <span className="rounded-full border border-slate-600/70 px-2 py-0.5 text-slate-300">
                        {lead.campName}
                      </span>
                    )}
                    <ChevronRight className="ml-auto mt-0.5 h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-indigo-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {/* Pagination */}
      {filteredCharacters.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
          <p className="text-sm text-slate-300">
            Affichage {filteredCharacters.length === 0 ? 0 : pageStart + 1}-
            {Math.min(pageEnd, filteredCharacters.length)} sur{" "}
            {filteredCharacters.length}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateQueryFilters({ page: 1 })}
                disabled={safeCurrentPage === 1}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Premiere page"
              >
                {"<<"}
              </button>
              <button
                type="button"
                onClick={() =>
                  updateQueryFilters({ page: Math.max(1, safeCurrentPage - 1) })
                }
                disabled={safeCurrentPage === 1}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Page precedente"
              >
                {"<"}
              </button>

              {paginationItems.map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1 text-xs text-slate-500"
                    aria-hidden="true"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${page}`}
                    type="button"
                    onClick={() => updateQueryFilters({ page })}
                    className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                      page === safeCurrentPage
                        ? "border-indigo-400/70 bg-indigo-500/25 text-indigo-100"
                        : "border-slate-700 text-slate-200 hover:border-indigo-400/40 hover:text-white"
                    }`}
                    aria-label={`Aller a la page ${page}`}
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
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Page suivante"
              >
                {">"}
              </button>
              <button
                type="button"
                onClick={() => updateQueryFilters({ page: totalPages })}
                disabled={safeCurrentPage === totalPages}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Derniere page"
              >
                {">>"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
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
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewPortrait(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Apercu du portrait de ${previewPortrait.alt}`}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-4 shadow-[0_25px_60px_rgba(2,6,23,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-100">
                {previewPortrait.alt}
              </p>
              <button
                type="button"
                onClick={() => setPreviewPortrait(null)}
                className="rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label="Fermer l'apercu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center overflow-hidden rounded-xl border border-indigo-500/20 bg-slate-950/80">
              <img
                src={previewPortrait.src}
                alt={previewPortrait.alt}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
