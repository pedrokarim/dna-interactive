"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Heart, Languages, Search, SlidersHorizontal, X, ZoomIn } from "lucide-react";
import { useAtom } from "jotai";
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

export default function ItemsGridClient({
  category,
  items,
  favoritesOnly = false,
}: ItemsGridClientProps) {
  const [persistedItemsFilters, setPersistedItemsFilters] = useAtom(itemsFiltersStorageAtom);
  const [favoriteItems] = useAtom(itemsFavoritesAtom);
  const [, toggleItemFavorite] = useAtom(toggleItemFavoriteAtom);

  const defaultLanguages = normalizeLanguageCodes(
    category.defaultGridLanguages,
    category.availableLanguages,
    ["FR", "EN"],
  );
  const persisted = persistedItemsFilters[category.id];

  const [search, setSearch] = useState<string>(persisted?.search ?? "");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() =>
    normalizeLanguageCodes(
      persisted?.selectedLanguages ?? defaultLanguages,
      category.availableLanguages,
      defaultLanguages,
    ),
  );
  const [rarityFilter, setRarityFilter] = useState<string>(persisted?.rarityFilter ?? "all");
  const [polarityFilter, setPolarityFilter] = useState<string>(persisted?.polarityFilter ?? "all");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>(
    isArchiveFilter(persisted?.archiveFilter ?? "") ? persisted.archiveFilter : "all",
  );
  const [sortMode, setSortMode] = useState<SortMode>(
    isSortMode(persisted?.sortMode ?? "") ? persisted.sortMode : "id",
  );
  const [pageSize, setPageSize] = useState<number>(
    [12, 24, 48, 96].includes(persisted?.pageSize ?? -1) ? (persisted?.pageSize ?? 24) : 24,
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number.isFinite(persisted?.currentPage) && (persisted?.currentPage ?? 0) > 0
      ? (persisted?.currentPage ?? 1)
      : 1,
  );
  const [previewIcon, setPreviewIcon] = useState<{
    src: string;
    alt: string;
    modId: number;
  } | null>(null);

  const saveFilters = (overrides: Partial<(typeof persistedItemsFilters)[string]>): void => {
    const next = {
      search,
      selectedLanguages,
      rarityFilter,
      polarityFilter,
      archiveFilter,
      sortMode,
      pageSize,
      currentPage,
      ...overrides,
    };
    setPersistedItemsFilters((prev) => ({
      ...prev,
      [category.id]: next,
    }));
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
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const paginatedItems = filteredItems.slice(pageStart, pageEnd);

  const addLanguage = (code: string) => {
    if (!code) {
      return;
    }
    setSelectedLanguages((prev) => {
      const next = prev.includes(code)
        ? prev
        : normalizeLanguageCodes([...prev, code], category.availableLanguages, prev);
      saveFilters({ selectedLanguages: next, currentPage: 1 });
      return next;
    });
    setCurrentPage(1);
  };

  const removeLanguage = (code: string) => {
    setSelectedLanguages((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      const next = prev.filter((lang) => lang !== code);
      saveFilters({ selectedLanguages: next, currentPage: 1 });
      return next;
    });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedLanguages(defaultLanguages);
    setRarityFilter("all");
    setPolarityFilter("all");
    setArchiveFilter("all");
    setSortMode("id");
    setPageSize(24);
    setCurrentPage(1);
    setPersistedItemsFilters((prev) => ({
      ...prev,
      [category.id]: {
        search: "",
        selectedLanguages: defaultLanguages,
        rarityFilter: "all",
        polarityFilter: "all",
        archiveFilter: "all",
        sortMode: "id",
        pageSize: 24,
        currentPage: 1,
      },
    }));
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
                setSearch(value);
                setCurrentPage(1);
                saveFilters({ search: value, currentPage: 1 });
              }}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Rechercher par id, nom MOD, Demon Wedge..."
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400/80" />
              Rarete
            </div>
            <select
              value={rarityFilter}
              onChange={(event) => {
                setRarityFilter(event.target.value);
                setCurrentPage(1);
                saveFilters({ rarityFilter: event.target.value, currentPage: 1 });
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

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400/80" />
              Polarite
            </div>
            <select
              value={polarityFilter}
              onChange={(event) => {
                setPolarityFilter(event.target.value);
                setCurrentPage(1);
                saveFilters({ polarityFilter: event.target.value, currentPage: 1 });
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

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 text-xs text-slate-400">Archive</div>
            <select
              value={archiveFilter}
              onChange={(event) => {
                setArchiveFilter(event.target.value as ArchiveFilter);
                setCurrentPage(1);
                saveFilters({
                  archiveFilter: event.target.value as ArchiveFilter,
                  currentPage: 1,
                });
              }}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">Toutes</option>
              <option value="withArchive">Avec archive</option>
              <option value="withoutArchive">Sans archive</option>
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 text-xs text-slate-400">Tri</div>
            <select
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value as SortMode);
                setCurrentPage(1);
                saveFilters({
                  sortMode: event.target.value as SortMode,
                  currentPage: 1,
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
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Par page
            </span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
                saveFilters({
                  pageSize: Number(event.target.value),
                  currentPage: 1,
                });
              }}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
            >
              Reinitialiser filtres
            </button>
          </div>
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
                          alt={`MOD ${item.modId}`}
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
                            alt: lead.modName ?? `Mod ${item.modId}`,
                            modId: item.modId,
                          });
                        }}
                        className="absolute -bottom-3 -right-3 z-10 rounded-full border border-slate-700 bg-slate-900/95 p-1 text-slate-200 shadow-sm transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/80 hover:text-white"
                        aria-label={`Agrandir l'icone du MOD ${item.modId}`}
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-indigo-400/80">
                      MOD #{item.modId}
                    </p>
                    <h3 className="truncate text-lg font-semibold text-white transition-colors group-hover:text-indigo-100">
                      {lead.modName ?? `Mod ${item.modId}`}
                    </h3>
                    <p className="truncate text-xs text-slate-400">
                      {lead.functionLabel ?? "Demon Wedge"}
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
                            ? `Demon Wedge ${translation.demonWedgeName}`
                            : "Nom Demon Wedge indisponible"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Rarete {item.stats.rarity ?? "?"}
                  </span>
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Polarite {item.stats.polarity ?? "?"}
                  </span>
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Max Lv {item.stats.maxLevel ?? "?"}
                  </span>
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Cout {item.stats.cost ?? "?"}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {filteredItems.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
          <button
            type="button"
            onClick={() => {
              const nextPage = Math.max(1, safeCurrentPage - 1);
              setCurrentPage(nextPage);
              saveFilters({ currentPage: nextPage });
            }}
            disabled={safeCurrentPage === 1}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Precedent
          </button>
          <span className="px-2 text-sm text-slate-300">
            Page {safeCurrentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextPage = Math.min(totalPages, safeCurrentPage + 1);
              setCurrentPage(nextPage);
              saveFilters({ currentPage: nextPage });
            }}
            disabled={safeCurrentPage === totalPages}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}

      {previewIcon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewIcon(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Apercu de l'icone MOD ${previewIcon.modId}`}
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
