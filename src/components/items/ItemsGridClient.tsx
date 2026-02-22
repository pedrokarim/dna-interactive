"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Heart, Languages, Search, SlidersHorizontal, X, ZoomIn } from "lucide-react";
import { useAtom } from "jotai";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  getItemTranslation,
  getLanguageLabel,
  normalizeLanguageCodes,
} from "@/lib/items/catalog";
import type { ItemCategory, ItemRecord } from "@/lib/items/types";
import {
  itemsFavoritesAtom,
  itemsFiltersStorageAtom,
  toggleItemFavoriteAtom,
} from "@/lib/store";

type ArchiveFilter = "all" | "withArchive" | "withoutArchive";
type SortMode = "id" | "rarityAsc" | "rarityDesc";
const ARCHIVE_FILTER_VALUES = ["all", "withArchive", "withoutArchive"] as const;
const SORT_MODE_VALUES = ["id", "rarityAsc", "rarityDesc"] as const;
const PAGE_SIZE_VALUES = [12, 24, 48, 96] as const;

type ItemsGridClientProps = {
  category: ItemCategory;
  items: ItemRecord[];
  favoritesOnly?: boolean;
};

function isArchiveFilter(value: string): value is ArchiveFilter {
  return value === "all" || value === "withArchive" || value === "withoutArchive";
}

function isSortMode(value: string): value is SortMode {
  return value === "id" || value === "rarityAsc" || value === "rarityDesc";
}

function translationSearchText(item: ItemRecord, availableLanguages: string[]): string {
  const values: string[] = [`${item.modId}`];
  if (item.archiveId !== null) {
    values.push(`${item.archiveId}`);
  }

  for (const langCode of availableLanguages) {
    const translation = item.translations[langCode];
    if (!translation) {
      continue;
    }
    if (translation.modName) {
      values.push(translation.modName);
    }
    if (translation.demonWedgeName) {
      values.push(translation.demonWedgeName);
    }
    if (translation.functionLabel) {
      values.push(translation.functionLabel);
    }
    if (translation.passiveEffectsDescription) {
      values.push(translation.passiveEffectsDescription);
    }
    if (translation.archiveName) {
      values.push(translation.archiveName);
    }
  }

  return values.join(" ").toLowerCase();
}

function numberOr(value: number | null, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function toFavoriteKey(categoryId: string, itemId: string): string {
  return `${categoryId}:${itemId}`;
}

function isAllowedPageSize(value: number): value is (typeof PAGE_SIZE_VALUES)[number] {
  return PAGE_SIZE_VALUES.includes(value as (typeof PAGE_SIZE_VALUES)[number]);
}

function sameStringArray(a: string[] | undefined, b: string[]): boolean {
  if (!a || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
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

  if (left > 2) {
    items.push("...");
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < totalPages - 1) {
    items.push("...");
  }

  items.push(totalPages);
  return items;
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

export default function ItemsGridClient({
  category,
  items,
  favoritesOnly = false,
}: ItemsGridClientProps) {
  const [persistedItemsFilters, setPersistedItemsFilters] = useAtom(itemsFiltersStorageAtom);
  const [favoriteItems] = useAtom(itemsFavoritesAtom);
  const [, toggleItemFavorite] = useAtom(toggleItemFavoriteAtom);
  const isModsCategory = category.id === "mods";

  const defaultLanguages = normalizeLanguageCodes(
    category.defaultGridLanguages,
    category.availableLanguages,
    ["FR", "EN"],
  );
  const persisted = persistedItemsFilters[category.id];

  const [queryFilters, setQueryFilters] = useQueryStates({
    q: parseAsString,
    langs: parseAsArrayOf(parseAsString),
    rarity: parseAsString,
    polarity: parseAsString,
    itype: parseAsString,
    isub: parseAsString,
    archive: parseAsStringLiteral(ARCHIVE_FILTER_VALUES),
    sort: parseAsStringLiteral(SORT_MODE_VALUES),
    size: parseAsInteger,
    page: parseAsInteger,
  });
  const hasUrlFilters =
    queryFilters.q !== null ||
    queryFilters.langs !== null ||
    queryFilters.rarity !== null ||
    queryFilters.polarity !== null ||
    queryFilters.itype !== null ||
    queryFilters.isub !== null ||
    queryFilters.archive !== null ||
    queryFilters.sort !== null ||
    queryFilters.size !== null ||
    queryFilters.page !== null;

  const search = queryFilters.q ?? (hasUrlFilters ? "" : persisted?.search ?? "");
  const selectedLanguages = normalizeLanguageCodes(
    queryFilters.langs ??
      (hasUrlFilters ? defaultLanguages : persisted?.selectedLanguages ?? defaultLanguages),
    category.availableLanguages,
    defaultLanguages,
  );
  const rarityFilter = queryFilters.rarity ?? (hasUrlFilters ? "all" : persisted?.rarityFilter ?? "all");
  const polarityFilter =
    queryFilters.polarity ?? (hasUrlFilters ? "all" : persisted?.polarityFilter ?? "all");
  const itemTypeFilter =
    queryFilters.itype ?? (hasUrlFilters ? "all" : persisted?.itemTypeFilter ?? "all");
  const itemSubTypeFilter =
    queryFilters.isub ?? (hasUrlFilters ? "all" : persisted?.itemSubTypeFilter ?? "all");

  const rawArchiveFilter =
    queryFilters.archive ?? (hasUrlFilters ? "all" : persisted?.archiveFilter ?? "all");
  const archiveFilter: ArchiveFilter = isArchiveFilter(rawArchiveFilter) ? rawArchiveFilter : "all";

  const rawSortMode = queryFilters.sort ?? (hasUrlFilters ? "id" : persisted?.sortMode ?? "id");
  const sortMode: SortMode = isSortMode(rawSortMode) ? rawSortMode : "id";

  const rawPageSize = queryFilters.size ?? (hasUrlFilters ? 24 : persisted?.pageSize ?? 24);
  const pageSize = isAllowedPageSize(rawPageSize) ? rawPageSize : 24;

  const rawCurrentPage = queryFilters.page ?? (hasUrlFilters ? 1 : persisted?.currentPage ?? 1);
  const currentPage = Number.isFinite(rawCurrentPage) && rawCurrentPage > 0 ? rawCurrentPage : 1;

  const [previewIcon, setPreviewIcon] = useState<{
    src: string;
    alt: string;
    modId: number;
  } | null>(null);

  const updateQueryFilters = (overrides: {
    q?: string;
    langs?: string[];
    rarity?: string;
    polarity?: string;
    itype?: string;
    isub?: string;
    archive?: ArchiveFilter;
    sort?: SortMode;
    size?: number;
    page?: number;
  }): void => {
    const next = {
      q: search,
      langs: selectedLanguages,
      rarity: rarityFilter,
      polarity: polarityFilter,
      itype: itemTypeFilter,
      isub: itemSubTypeFilter,
      archive: archiveFilter,
      sort: sortMode,
      size: pageSize,
      page: currentPage,
      ...overrides,
    };

    void setQueryFilters({
      q: next.q,
      langs: next.langs,
      rarity: next.rarity,
      polarity: next.polarity,
      itype: next.itype,
      isub: next.isub,
      archive: next.archive,
      sort: next.sort,
      size: next.size,
      page: next.page,
    });
  };

  const rarityOptions = useMemo(() => {
    const values = new Set<number>();
    for (const item of items) {
      if (typeof item.stats.rarity === "number") {
        values.add(item.stats.rarity);
      }
    }
    return Array.from(values).sort((a, b) => a - b);
  }, [items]);

  const polarityOptions = useMemo(() => {
    const values = new Set<number>();
    for (const item of items) {
      if (typeof item.stats.polarity === "number") {
        values.add(item.stats.polarity);
      }
    }
    return Array.from(values).sort((a, b) => a - b);
  }, [items]);

  const itemTypeOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of items) {
      const value = item.fields.Type;
      if (typeof value === "string" && value.trim().length > 0) {
        values.add(value.trim());
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const itemSubTypeOptions = useMemo(() => {
    const values = new Set<string>();
    for (const item of items) {
      const value = item.fields.ResourceSType;
      if (typeof value === "string" && value.trim().length > 0) {
        values.add(value.trim());
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const hasArchiveData = useMemo(() => items.some((item) => item.archiveId !== null), [items]);

  const categoryFavoriteCount = useMemo(() => {
    return items.filter((item) => favoriteItems.has(toFavoriteKey(category.id, item.id))).length;
  }, [items, favoriteItems, category.id]);

  const searchable = useMemo(
    () =>
      items.map((item) => ({
        item,
        searchText: translationSearchText(item, category.availableLanguages),
      })),
    [items, category.availableLanguages],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = searchable
      .filter(({ item, searchText }) => {
        const favoriteKey = toFavoriteKey(category.id, item.id);
        if (favoritesOnly && !favoriteItems.has(favoriteKey)) {
          return false;
        }

        if (normalizedSearch.length > 0 && !searchText.includes(normalizedSearch)) {
          return false;
        }

        if (rarityFilter !== "all" && `${item.stats.rarity ?? ""}` !== rarityFilter) {
          return false;
        }

        if (polarityFilter !== "all" && `${item.stats.polarity ?? ""}` !== polarityFilter) {
          return false;
        }

        if (
          itemTypeFilter !== "all" &&
          `${typeof item.fields.Type === "string" ? item.fields.Type : ""}` !== itemTypeFilter
        ) {
          return false;
        }

        if (
          itemSubTypeFilter !== "all" &&
          `${typeof item.fields.ResourceSType === "string" ? item.fields.ResourceSType : ""}` !==
            itemSubTypeFilter
        ) {
          return false;
        }

        if (archiveFilter === "withArchive" && item.archiveId === null) {
          return false;
        }
        if (archiveFilter === "withoutArchive" && item.archiveId !== null) {
          return false;
        }

        return true;
      })
      .map(({ item }) => item);

    filtered.sort((a, b) => {
      if (sortMode === "rarityAsc") {
        return (
          numberOr(a.stats.rarity, Number.MAX_SAFE_INTEGER) -
          numberOr(b.stats.rarity, Number.MAX_SAFE_INTEGER)
        );
      }
      if (sortMode === "rarityDesc") {
        return (
          numberOr(b.stats.rarity, Number.MIN_SAFE_INTEGER) -
          numberOr(a.stats.rarity, Number.MIN_SAFE_INTEGER)
        );
      }
      return a.modId - b.modId;
    });

    return filtered;
  }, [
    search,
    rarityFilter,
    polarityFilter,
    itemTypeFilter,
    itemSubTypeFilter,
    archiveFilter,
    sortMode,
    searchable,
    category.id,
    favoriteItems,
    favoritesOnly,
  ]);

  const unselectedLanguages = category.availableLanguages.filter(
    (code) => !selectedLanguages.includes(code),
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginationItems = useMemo(
    () => buildPaginationItems(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages],
  );
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const paginatedItems = filteredItems.slice(pageStart, pageEnd);

  useEffect(() => {
    if (!hasUrlFilters && !persisted) {
      return;
    }

    const next = {
      search,
      selectedLanguages,
      rarityFilter,
      polarityFilter,
      itemTypeFilter,
      itemSubTypeFilter,
      archiveFilter,
      sortMode,
      pageSize,
      currentPage: safeCurrentPage,
    };

    setPersistedItemsFilters((prev) => {
      const previous = prev[category.id];
      const isSame =
        previous?.search === next.search &&
        previous?.rarityFilter === next.rarityFilter &&
        previous?.polarityFilter === next.polarityFilter &&
        previous?.itemTypeFilter === next.itemTypeFilter &&
        previous?.itemSubTypeFilter === next.itemSubTypeFilter &&
        previous?.archiveFilter === next.archiveFilter &&
        previous?.sortMode === next.sortMode &&
        previous?.pageSize === next.pageSize &&
        previous?.currentPage === next.currentPage &&
        sameStringArray(previous?.selectedLanguages, next.selectedLanguages);

      if (isSame) {
        return prev;
      }

      return {
        ...prev,
        [category.id]: next,
      };
    });
  }, [
    search,
    selectedLanguages,
    rarityFilter,
    polarityFilter,
    itemTypeFilter,
    itemSubTypeFilter,
    archiveFilter,
    sortMode,
    pageSize,
    safeCurrentPage,
    hasUrlFilters,
    persisted,
    category.id,
    setPersistedItemsFilters,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      void setQueryFilters({ page: totalPages });
    }
  }, [currentPage, totalPages, setQueryFilters]);

  const addLanguage = (code: string) => {
    if (!code) {
      return;
    }
    const next = selectedLanguages.includes(code)
      ? selectedLanguages
      : normalizeLanguageCodes([...selectedLanguages, code], category.availableLanguages, selectedLanguages);
    updateQueryFilters({ langs: next, page: 1 });
  };

  const removeLanguage = (code: string) => {
    if (selectedLanguages.length <= 1) {
      return;
    }
    const next = selectedLanguages.filter((lang) => lang !== code);
    updateQueryFilters({ langs: next, page: 1 });
  };

  const resetFilters = () => {
    updateQueryFilters({
      q: "",
      langs: defaultLanguages,
      rarity: "all",
      polarity: "all",
      itype: "all",
      isub: "all",
      archive: "all",
      sort: "id",
      size: 24,
      page: 1,
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-500/20 bg-slate-900/55 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-400/80">
              {favoritesOnly ? "Favoris" : "Categorie"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              {favoritesOnly ? `Favoris ${category.title}` : category.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{category.description}</p>
            <p className="mt-3 text-sm text-slate-400">
              {favoritesOnly
                ? `${filteredItems.length} favori(s) affiche(s) sur ${categoryFavoriteCount}`
                : `${filteredItems.length} / ${items.length} items`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/items"
              className="rounded-lg border border-slate-600/70 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white"
            >
              Retour categories
            </Link>
            {favoritesOnly ? (
              <Link
                href={`/items/${category.slug}`}
                className="rounded-lg border border-slate-600/70 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white"
              >
                Retour liste
              </Link>
            ) : (
              <Link
                href="/items/favoris"
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition-colors hover:bg-rose-500/20"
              >
                <Heart className="h-4 w-4" />
                Favoris ({categoryFavoriteCount})
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2">
            <Search className="h-4 w-4 text-indigo-400/80" />
            <input
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                updateQueryFilters({ q: value, page: 1 });
              }}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
               placeholder={
                 isModsCategory
                   ? "Rechercher par id, nom MOD, Demon Wedge..."
                   : "Rechercher par id, nom, description..."
               }
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {rarityOptions.length > 0 && (
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400/80" />
                Rarete
              </div>
              <select
                value={rarityFilter}
                onChange={(event) => {
                  updateQueryFilters({ rarity: event.target.value, page: 1 });
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
              >
                <option value="all">Toutes</option>
                {rarityOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          )}

          {polarityOptions.length > 0 && (
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400/80" />
                Polarite
              </div>
              <select
                value={polarityFilter}
                onChange={(event) => {
                  updateQueryFilters({ polarity: event.target.value, page: 1 });
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
              >
                <option value="all">Toutes</option>
                {polarityOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasArchiveData && (
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
              <div className="mb-1 text-xs text-slate-400">Archive</div>
              <select
                value={archiveFilter}
                onChange={(event) => {
                  updateQueryFilters({
                    archive: event.target.value as ArchiveFilter,
                    page: 1,
                  });
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
              >
                <option value="all">Toutes</option>
                <option value="withArchive">Avec archive</option>
                <option value="withoutArchive">Sans archive</option>
              </select>
            </div>
          )}

          {itemTypeOptions.length > 0 && (
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
              <div className="mb-1 text-xs text-slate-400">Type</div>
              <select
                value={itemTypeFilter}
                onChange={(event) => {
                  updateQueryFilters({ itype: event.target.value, page: 1 });
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
              >
                <option value="all">Tous</option>
                {itemTypeOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          )}

          {itemSubTypeOptions.length > 0 && (
            <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
              <div className="mb-1 text-xs text-slate-400">Sous-type</div>
              <select
                value={itemSubTypeFilter}
                onChange={(event) => {
                  updateQueryFilters({ isub: event.target.value, page: 1 });
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
              >
                <option value="all">Tous</option>
                {itemSubTypeOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 text-xs text-slate-400">Tri</div>
            <select
              value={sortMode}
              onChange={(event) => {
                updateQueryFilters({
                  sort: event.target.value as SortMode,
                  page: 1,
                });
              }}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="id">Par id</option>
              <option value="rarityAsc">Rarete croissante</option>
              <option value="rarityDesc">Rarete decroissante</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
          <p>
            Affichage {filteredItems.length === 0 ? 0 : pageStart + 1}-
            {Math.min(pageEnd, filteredItems.length)} sur {filteredItems.length}
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

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/45 p-10 text-center">
          <p className="text-lg text-slate-200">
            {favoritesOnly
              ? "Aucun favori ne correspond aux filtres."
              : "Aucun item ne correspond aux filtres actuels."}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {favoritesOnly
              ? "Ajoute des favoris depuis la liste des items, ou ajuste les filtres."
              : "Ajuste les filtres ou la recherche."}
          </p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedItems.map((item) => {
            const lead = getItemTranslation(
              item,
              selectedLanguages[0],
              category.availableLanguages,
            );
            const elementalAffinity = resolveElementalAffinity(item, lead.typeCompatibilityNames);
            const iconSrc = item.icon.publicPath ?? item.icon.placeholderPath ?? "/marker-default.svg";
            const favoriteKey = toFavoriteKey(category.id, item.id);
            const isFavorite = favoriteItems.has(favoriteKey);

            return (
              <Link
                key={item.id}
                href={`/items/${category.slug}/${item.id}`}
                className="group rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-slate-900/75"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-slate-950/80 p-2">
                    <div className="relative h-full w-full">
                      <div className="h-full w-full overflow-hidden rounded-lg">
                        <img
                          src={iconSrc}
                          alt={`${category.technicalName} ${item.modId}`}
                          className="max-h-full max-w-full object-contain transition-transform duration-200 hover:scale-110"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setPreviewIcon({
                            src: iconSrc,
                            alt: lead.modName ?? `${category.displayName} ${item.modId}`,
                            modId: item.modId,
                          });
                        }}
                        className="absolute -bottom-3 -right-3 z-10 rounded-full border border-slate-700 bg-slate-900/95 p-1 text-slate-200 shadow-sm transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/80 hover:text-white"
                        aria-label={`Agrandir l'icone de ${category.technicalName} ${item.modId}`}
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-indigo-400/80">
                      {category.technicalName} #{item.modId}
                    </p>
                    <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-indigo-100">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        {elementalAffinity?.iconSrc ? (
                          <img
                            src={elementalAffinity.iconSrc}
                            alt=""
                            aria-hidden="true"
                            className="h-5 w-5 shrink-0 object-contain"
                          />
                        ) : null}
                        <span className="truncate">
                          {lead.modName ?? `${category.displayName} ${item.modId}`}
                        </span>
                      </span>
                    </h3>
                    <p className="truncate text-xs text-slate-400">
                      {lead.functionLabel ?? (isModsCategory ? "Demon Wedge" : category.displayName)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleItemFavorite(favoriteKey);
                    }}
                    aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    className={`rounded-full p-1.5 transition-colors ${
                      isFavorite
                        ? "text-rose-400 hover:text-rose-300"
                        : "text-slate-500 hover:text-rose-300"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-400 text-rose-400" : ""}`} />
                  </button>
                  <ChevronRight className="mt-1 h-4 w-4 text-slate-400 transition-colors group-hover:text-indigo-300" />
                </div>

                <div className="mt-4 space-y-2">
                  {selectedLanguages.map((langCode) => {
                    const translation = item.translations[langCode];
                    return (
                      <div
                        key={`${item.id}-${langCode}`}
                        className="rounded-lg border border-slate-700/60 bg-slate-950/55 px-3 py-2"
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          {getLanguageLabel(langCode)}
                        </p>
                        <p className="truncate text-sm font-medium text-slate-100">
                          {translation?.modName ?? "N/A"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {translation?.demonWedgeName
                            ? `${category.displayName} ${translation.demonWedgeName}`
                            : translation?.functionLabel ??
                              (isModsCategory ? "Nom Demon Wedge indisponible" : "Libelle indisponible")}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    ID {item.modId}
                  </span>
                  {elementalAffinity ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 text-cyan-100">
                      {elementalAffinity.iconSrc ? (
                        <img
                          src={elementalAffinity.iconSrc}
                          alt={elementalAffinity.label}
                          className="h-3.5 w-3.5 object-contain"
                        />
                      ) : null}
                      {elementalAffinity.label}
                    </span>
                  ) : null}
                  {typeof item.stats.rarity === "number" && (
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Rarete {item.stats.rarity}
                  </span>
                  )}
                  {typeof item.stats.polarity === "number" && (
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Polarite {item.stats.polarity}
                  </span>
                  )}
                  {typeof item.stats.maxLevel === "number" && (
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Max Lv {item.stats.maxLevel}
                  </span>
                  )}
                  {typeof item.stats.cost === "number" && (
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Cout {item.stats.cost}
                  </span>
                  )}
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {filteredItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
          <p className="text-sm text-slate-300">
            Affichage {filteredItems.length === 0 ? 0 : pageStart + 1}-
            {Math.min(pageEnd, filteredItems.length)} sur {filteredItems.length}
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
                onClick={() => {
                  const nextPage = Math.max(1, safeCurrentPage - 1);
                  updateQueryFilters({ page: nextPage });
                }}
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
                onClick={() => {
                  const nextPage = Math.min(totalPages, safeCurrentPage + 1);
                  updateQueryFilters({ page: nextPage });
                }}
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
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Par page</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  updateQueryFilters({
                    size: Number(event.target.value),
                    page: 1,
                  });
                }}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {previewIcon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewIcon(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Apercu de l'icone ${category.technicalName} ${previewIcon.modId}`}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-4 shadow-[0_25px_60px_rgba(2,6,23,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-100">{previewIcon.alt}</p>
              <button
                type="button"
                onClick={() => setPreviewIcon(null)}
                className="rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label="Fermer l'apercu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-indigo-500/20 bg-slate-950/80 p-4">
              <img
                src={previewIcon.src}
                alt={previewIcon.alt}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
