"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Languages, Search, SlidersHorizontal, X } from "lucide-react";
import {
  getItemTranslation,
  getLanguageLabel,
  normalizeLanguageCodes,
} from "@/lib/items/catalog";
import type { ItemCategory, ItemRecord } from "@/lib/items/types";

type ArchiveFilter = "all" | "withArchive" | "withoutArchive";
type SortMode = "id" | "rarityAsc" | "rarityDesc";

type ItemsGridClientProps = {
  category: ItemCategory;
  items: ItemRecord[];
};

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

export default function ItemsGridClient({ category, items }: ItemsGridClientProps) {
  const [search, setSearch] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() =>
    normalizeLanguageCodes(category.defaultGridLanguages, category.availableLanguages, [
      "FR",
      "EN",
    ]),
  );
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [polarityFilter, setPolarityFilter] = useState<string>("all");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("id");
  const [pageSize, setPageSize] = useState<number>(24);
  const [currentPage, setCurrentPage] = useState<number>(1);

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
        return numberOr(a.stats.rarity, Number.MAX_SAFE_INTEGER) - numberOr(b.stats.rarity, Number.MAX_SAFE_INTEGER);
      }
      if (sortMode === "rarityDesc") {
        return numberOr(b.stats.rarity, Number.MIN_SAFE_INTEGER) - numberOr(a.stats.rarity, Number.MIN_SAFE_INTEGER);
      }
      return a.modId - b.modId;
    });

    return filtered;
  }, [search, rarityFilter, polarityFilter, archiveFilter, sortMode, searchable]);

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
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev : normalizeLanguageCodes([...prev, code], category.availableLanguages, prev),
    );
    setCurrentPage(1);
  };

  const removeLanguage = (code: string) => {
    setSelectedLanguages((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((lang) => lang !== code);
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-300/20 bg-slate-900/55 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
              Category
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{category.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              {category.description}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              {filteredItems.length} / {items.length} items
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/items"
              className="rounded-lg border border-slate-600/70 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-amber-300/40 hover:text-white"
            >
              Back to categories
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2">
            <Search className="h-4 w-4 text-amber-300/80" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Search by id, MOD name, Demon Wedge name..."
            />
          </label>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              <Languages className="h-4 w-4 text-amber-300/80" />
              Visible languages
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedLanguages.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-xs text-amber-100"
                >
                  {getLanguageLabel(code)}
                  {selectedLanguages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(code)}
                      className="rounded-full p-0.5 text-amber-100/80 transition-colors hover:bg-amber-200/20 hover:text-white"
                      aria-label={`Remove language ${code}`}
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
                <option value="">Add language...</option>
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
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300/80" />
              Rarity
            </div>
            <select
              value={rarityFilter}
              onChange={(event) => {
                setRarityFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">All</option>
              {rarityOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300/80" />
              Polarity
            </div>
            <select
              value={polarityFilter}
              onChange={(event) => {
                setPolarityFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">All</option>
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
              }}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="withArchive">With archive entry</option>
              <option value="withoutArchive">Without archive entry</option>
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 text-xs text-slate-400">Sort</div>
            <select
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value as SortMode);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="id">By id</option>
              <option value="rarityAsc">Rarity ascending</option>
              <option value="rarityDesc">Rarity descending</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
          <p>
            Showing {filteredItems.length === 0 ? 0 : pageStart + 1}-
            {Math.min(pageEnd, filteredItems.length)} of {filteredItems.length}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Per page
            </span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
          </div>
        </div>
      </section>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/45 p-10 text-center">
          <p className="text-lg text-slate-200">No item matches your current filters.</p>
          <p className="mt-2 text-sm text-slate-400">
            Change language selection, remove filters, or try another search.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedItems.map((item) => {
            const lead = getItemTranslation(item, selectedLanguages[0], category.availableLanguages);
            const iconSrc = item.icon.publicPath ?? item.icon.placeholderPath ?? "/marker-default.svg";

            return (
              <Link
                key={item.id}
                href={`/items/${category.slug}/${item.id}`}
                className="group rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-slate-900/75"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-slate-950/80 p-2">
                    <img
                      src={iconSrc}
                      alt={`MOD ${item.modId}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-amber-300/80">
                      MOD #{item.modId}
                    </p>
                    <h3 className="truncate text-lg font-semibold text-white transition-colors group-hover:text-amber-100">
                      {lead.modName ?? `Mod ${item.modId}`}
                    </h3>
                    <p className="truncate text-xs text-slate-400">
                      {lead.functionLabel ?? "Demon Wedge"}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 text-slate-400 transition-colors group-hover:text-amber-200" />
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
                            : "No Demon Wedge name"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Rarity {item.stats.rarity ?? "?"}
                  </span>
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Polarity {item.stats.polarity ?? "?"}
                  </span>
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Max Lv {item.stats.maxLevel ?? "?"}
                  </span>
                  <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    Cost {item.stats.cost ?? "?"}
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
            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage === 1}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-amber-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-2 text-sm text-slate-300">
            Page {safeCurrentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
            disabled={safeCurrentPage === totalPages}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-amber-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
