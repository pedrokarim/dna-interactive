"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Clock3,
  Grid3X3,
  Languages,
  Search,
  SlidersHorizontal,
  X,
  ZoomIn,
} from "lucide-react";
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { getLanguageLabel, normalizeLanguageCodes } from "@/lib/items/catalog";
import type { DraftRecipeSummary } from "@/lib/items/drafts";
import { resolveDraftItemName } from "@/lib/items/drafts";

const SORT_VALUES = ["id", "rarityDesc", "rarityAsc", "durationAsc", "durationDesc"] as const;
const PAGE_SIZE_VALUES = [12, 24, 48, 96] as const;

type DraftSortMode = (typeof SORT_VALUES)[number];

type DraftsGridClientProps = {
  recipes: DraftRecipeSummary[];
  availableLanguages: string[];
  defaultLanguages: string[];
};

function isAllowedPageSize(value: number): value is (typeof PAGE_SIZE_VALUES)[number] {
  return PAGE_SIZE_VALUES.includes(value as (typeof PAGE_SIZE_VALUES)[number]);
}

function numberOr(value: number | null, fallback: number): number {
  return typeof value === "number" ? value : fallback;
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

function recipeSearchText(recipe: DraftRecipeSummary, availableLanguages: string[]): string {
  const values: string[] = [
    `${recipe.draftId}`,
    `${recipe.productId}`,
    recipe.productType,
    recipe.product.type,
    `${recipe.ingredients.length}`,
  ];

  for (const langCode of availableLanguages) {
    const productName = recipe.product.names[langCode];
    if (productName) {
      values.push(productName);
    }
    const productDescription = recipe.product.descriptions[langCode];
    if (productDescription) {
      values.push(productDescription);
    }
    for (const ingredient of recipe.ingredients) {
      const ingredientName = ingredient.names[langCode];
      if (ingredientName) {
        values.push(ingredientName);
      }
      const ingredientDescription = ingredient.descriptions[langCode];
      if (ingredientDescription) {
        values.push(ingredientDescription);
      }
    }
  }

  return values.join(" ").toLowerCase();
}

function formatDuration(seconds: number | null): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return "N/A";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function slotPositionsForIngredients(count: number): number[] {
  if (count <= 1) {
    return [1];
  }
  if (count === 2) {
    return [1, 2];
  }
  if (count === 3) {
    return [0, 1, 2];
  }
  return [0, 1, 2, 3];
}

export default function DraftsGridClient({
  recipes,
  availableLanguages,
  defaultLanguages,
}: DraftsGridClientProps) {
  const normalizedDefaultLanguages = normalizeLanguageCodes(
    defaultLanguages,
    availableLanguages,
    ["FR", "EN"],
  );

  const [previewIcon, setPreviewIcon] = useState<{
    src: string;
    alt: string;
    draftId: number;
  } | null>(null);

  const [queryFilters, setQueryFilters] = useQueryStates({
    q: parseAsString,
    langs: parseAsArrayOf(parseAsString),
    ptype: parseAsString,
    itype: parseAsString,
    rarity: parseAsString,
    sort: parseAsStringLiteral(SORT_VALUES),
    size: parseAsInteger,
    page: parseAsInteger,
  });

  const search = queryFilters.q ?? "";
  const selectedLanguages = normalizeLanguageCodes(
    queryFilters.langs ?? normalizedDefaultLanguages,
    availableLanguages,
    normalizedDefaultLanguages,
  );
  const productTypeFilter = queryFilters.ptype ?? "all";
  const ingredientTypeFilter = queryFilters.itype ?? "all";
  const rarityFilter = queryFilters.rarity ?? "all";
  const sortMode: DraftSortMode = queryFilters.sort ?? "id";
  const rawPageSize = queryFilters.size ?? 24;
  const pageSize = isAllowedPageSize(rawPageSize) ? rawPageSize : 24;
  const rawCurrentPage = queryFilters.page ?? 1;
  const currentPage = Number.isFinite(rawCurrentPage) && rawCurrentPage > 0 ? rawCurrentPage : 1;

  const searchable = useMemo(
    () =>
      recipes.map((recipe) => ({
        recipe,
        searchText: recipeSearchText(recipe, availableLanguages),
      })),
    [recipes, availableLanguages],
  );

  const rarityOptions = useMemo(() => {
    const values = new Set<number>();
    for (const recipe of recipes) {
      if (typeof recipe.rarity === "number") {
        values.add(recipe.rarity);
      }
    }
    return Array.from(values).sort((a, b) => a - b);
  }, [recipes]);

  const productTypeOptions = useMemo(() => {
    const values = new Set<string>();
    for (const recipe of recipes) {
      values.add(recipe.productType);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const ingredientTypeOptions = useMemo(() => {
    const values = new Set<string>();
    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        values.add(ingredient.type);
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = searchable
      .filter(({ recipe, searchText }) => {
        if (normalizedSearch.length > 0 && !searchText.includes(normalizedSearch)) {
          return false;
        }
        if (productTypeFilter !== "all" && recipe.productType !== productTypeFilter) {
          return false;
        }
        if (
          ingredientTypeFilter !== "all" &&
          !recipe.ingredients.some((ingredient) => ingredient.type === ingredientTypeFilter)
        ) {
          return false;
        }
        if (rarityFilter !== "all" && `${recipe.rarity ?? ""}` !== rarityFilter) {
          return false;
        }
        return true;
      })
      .map(({ recipe }) => recipe);

    filtered.sort((a, b) => {
      if (sortMode === "rarityAsc") {
        return numberOr(a.rarity, Number.MAX_SAFE_INTEGER) - numberOr(b.rarity, Number.MAX_SAFE_INTEGER);
      }
      if (sortMode === "rarityDesc") {
        return numberOr(b.rarity, Number.MIN_SAFE_INTEGER) - numberOr(a.rarity, Number.MIN_SAFE_INTEGER);
      }
      if (sortMode === "durationAsc") {
        return (
          numberOr(a.durationSec, Number.MAX_SAFE_INTEGER) - numberOr(b.durationSec, Number.MAX_SAFE_INTEGER)
        );
      }
      if (sortMode === "durationDesc") {
        return (
          numberOr(b.durationSec, Number.MIN_SAFE_INTEGER) - numberOr(a.durationSec, Number.MIN_SAFE_INTEGER)
        );
      }
      return a.draftId - b.draftId;
    });

    return filtered;
  }, [search, productTypeFilter, ingredientTypeFilter, rarityFilter, sortMode, searchable]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const paginatedRecipes = filteredRecipes.slice(pageStart, pageEnd);
  const paginationItems = useMemo(
    () => buildPaginationItems(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages],
  );

  const unselectedLanguages = availableLanguages.filter((code) => !selectedLanguages.includes(code));

  const updateFilters = (overrides: {
    q?: string;
    langs?: string[];
    ptype?: string;
    itype?: string;
    rarity?: string;
    sort?: DraftSortMode;
    size?: number;
    page?: number;
  }) => {
    const next = {
      q: search,
      langs: selectedLanguages,
      ptype: productTypeFilter,
      itype: ingredientTypeFilter,
      rarity: rarityFilter,
      sort: sortMode,
      size: pageSize,
      page: safeCurrentPage,
      ...overrides,
    };

    void setQueryFilters({
      q: next.q,
      langs: next.langs,
      ptype: next.ptype,
      itype: next.itype,
      rarity: next.rarity,
      sort: next.sort,
      size: next.size,
      page: next.page,
    });
  };

  const addLanguage = (code: string) => {
    if (!code) {
      return;
    }
    const next = selectedLanguages.includes(code)
      ? selectedLanguages
      : normalizeLanguageCodes([...selectedLanguages, code], availableLanguages, selectedLanguages);
    updateFilters({ langs: next, page: 1 });
  };

  const removeLanguage = (code: string) => {
    if (selectedLanguages.length <= 1) {
      return;
    }
    updateFilters(
      { langs: selectedLanguages.filter((lang) => lang !== code), page: 1 },
    );
  };

  const resetFilters = () => {
    updateFilters({
      q: "",
      langs: normalizedDefaultLanguages,
      ptype: "all",
      itype: "all",
      rarity: "all",
      sort: "id",
      size: 24,
      page: 1,
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/90">Forge Drafts</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Plans de fabrication</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Explore les recettes de forge: item final, composants requis, rarete et temps.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              {filteredRecipes.length} / {recipes.length} plans
            </p>
          </div>
          <Link
            href="/items"
            className="rounded-lg border border-slate-600/80 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-amber-400/50 hover:text-white"
          >
            Retour categories
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2">
            <Search className="h-4 w-4 text-amber-300/90" />
            <input
              value={search}
              onChange={(event) => updateFilters({ q: event.target.value, page: 1 })}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              placeholder="Rechercher par id draft, nom produit, ingredient..."
            />
          </label>

          <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              <Languages className="h-4 w-4 text-amber-300/90" />
              Langues affichees
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedLanguages.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs text-amber-100"
                >
                  {getLanguageLabel(code)}
                  {selectedLanguages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(code)}
                      className="rounded-full p-0.5 text-amber-100/80 transition-colors hover:bg-amber-400/20 hover:text-white"
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
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300/90" />
              Type produit
            </div>
            <select
              value={productTypeFilter}
              onChange={(event) => updateFilters({ ptype: event.target.value, page: 1 })}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">Tous</option>
              {productTypeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 text-xs text-slate-400">Ingredient requis</div>
            <select
              value={ingredientTypeFilter}
              onChange={(event) => updateFilters({ itype: event.target.value, page: 1 })}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="all">Tous</option>
              {ingredientTypeOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/60 bg-slate-950/60 p-2">
            <div className="mb-1 text-xs text-slate-400">Rarete</div>
            <select
              value={rarityFilter}
              onChange={(event) => updateFilters({ rarity: event.target.value, page: 1 })}
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
            <div className="mb-1 text-xs text-slate-400">Tri</div>
            <select
              value={sortMode}
              onChange={(event) => updateFilters({ sort: event.target.value as DraftSortMode, page: 1 })}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="id">Par id</option>
              <option value="rarityDesc">Rarete decroissante</option>
              <option value="rarityAsc">Rarete croissante</option>
              <option value="durationAsc">Temps croissant</option>
              <option value="durationDesc">Temps decroissant</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
          <p>
            Affichage {filteredRecipes.length === 0 ? 0 : pageStart + 1}-
            {Math.min(pageEnd, filteredRecipes.length)} sur {filteredRecipes.length}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-400/50 hover:text-white"
          >
            Reinitialiser filtres
          </button>
        </div>
      </section>

      {filteredRecipes.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/45 p-10 text-center">
          <p className="text-lg text-slate-200">Aucun plan ne correspond aux filtres actuels.</p>
          <p className="mt-2 text-sm text-slate-400">Ajuste les filtres ou la recherche.</p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedRecipes.map((recipe) => {
            const productNameLead = resolveDraftItemName(
              recipe.product,
              selectedLanguages[0],
              availableLanguages,
            );
            const recipeIconSrc =
              recipe.icon.publicPath ??
              recipe.product.icon.publicPath ??
              recipe.icon.placeholderPath ??
              recipe.product.icon.placeholderPath ??
              "/marker-default.svg";
            const ingredientSlots = Array.from({ length: 4 }, () => null as DraftRecipeSummary["ingredients"][number] | null);
            const positions = slotPositionsForIngredients(recipe.ingredients.length);
            recipe.ingredients.slice(0, 4).forEach((ingredient, index) => {
              const slot = positions[index] ?? index;
              ingredientSlots[slot] = ingredient;
            });

            return (
              <Link
                key={recipe.id}
                href={`/items/drafts/${recipe.draftId}`}
                className="group rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-slate-900/75"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-slate-950/80 p-2">
                    <div className="relative h-full w-full">
                      <div className="h-full w-full overflow-hidden rounded-lg">
                        <img
                          src={recipeIconSrc}
                          alt={`Draft ${recipe.draftId}`}
                          className="max-h-full max-w-full object-contain transition-transform duration-200 hover:scale-110"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setPreviewIcon({
                            src: recipeIconSrc,
                            alt: productNameLead,
                            draftId: recipe.draftId,
                          });
                        }}
                        className="absolute -bottom-3 -right-3 z-10 rounded-full border border-slate-700 bg-slate-900/95 p-1 text-slate-200 shadow-sm transition-colors hover:border-amber-400/60 hover:bg-amber-500/80 hover:text-white"
                        aria-label={`Agrandir l'icone du draft ${recipe.draftId}`}
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-amber-300/90">
                      DRAFT #{recipe.draftId}
                    </p>
                    <h2 className="truncate text-lg font-semibold text-white transition-colors group-hover:text-amber-100">
                      {productNameLead}
                    </h2>
                    <p className="truncate text-xs text-slate-400">
                      Produit {recipe.product.type} x{recipe.productQuantity}
                    </p>
                  </div>

                  <ChevronRight className="mt-1 h-4 w-4 text-slate-400 transition-colors group-hover:text-amber-300" />
                </div>

                <div className="mt-4 space-y-2">
                  {selectedLanguages.map((langCode) => {
                    const localizedName = resolveDraftItemName(recipe.product, langCode, availableLanguages);
                    return (
                      <div
                        key={`${recipe.id}-${langCode}`}
                        className="rounded-lg border border-slate-700/60 bg-slate-950/55 px-3 py-2"
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          {getLanguageLabel(langCode)}
                        </p>
                        <p className="truncate text-sm font-medium text-slate-100">{localizedName}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Recette</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ingredientSlots.map((ingredient, index) =>
                      ingredient ? (
                        <div
                          key={`${recipe.id}-ingredient-${ingredient.id}-${index}`}
                          className="relative rounded-lg border border-slate-700/70 bg-slate-950/70 p-2"
                        >
                          <img
                            src={ingredient.icon.publicPath ?? ingredient.icon.placeholderPath ?? "/marker-default.svg"}
                            alt={resolveDraftItemName(ingredient, selectedLanguages[0], availableLanguages)}
                            className="mx-auto h-8 w-8 object-contain"
                          />
                          <span className="absolute bottom-1 right-1 rounded bg-slate-900/90 px-1 text-[10px] font-medium text-amber-100">
                            {ingredient.quantity}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={`${recipe.id}-ingredient-empty-${index}`}
                          className="rounded-lg border border-slate-800 bg-slate-950/35 p-2"
                        >
                          <div className="mx-auto h-8 w-8 rounded-md border border-slate-800 bg-slate-900/50" />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    <Grid3X3 className="h-3.5 w-3.5 text-amber-300/90" />
                    {recipe.productType}
                  </span>
                  {typeof recipe.rarity === "number" ? (
                    <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                      Rarete {recipe.rarity}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                    <Clock3 className="h-3.5 w-3.5 text-amber-300/90" />
                    {formatDuration(recipe.durationSec)}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {filteredRecipes.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
          <p className="text-sm text-slate-300">
            Affichage {filteredRecipes.length === 0 ? 0 : pageStart + 1}-
            {Math.min(pageEnd, filteredRecipes.length)} sur {filteredRecipes.length}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateFilters({ page: 1 })}
                disabled={safeCurrentPage === 1}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition-colors hover:border-amber-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Premiere page"
              >
                {"<<"}
              </button>
              <button
                type="button"
                onClick={() => updateFilters({ page: Math.max(1, safeCurrentPage - 1) })}
                disabled={safeCurrentPage === 1}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition-colors hover:border-amber-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                    onClick={() => updateFilters({ page })}
                    className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                      page === safeCurrentPage
                        ? "border-amber-400/70 bg-amber-500/25 text-amber-100"
                        : "border-slate-700 text-slate-200 hover:border-amber-400/40 hover:text-white"
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
                onClick={() => updateFilters({ page: Math.min(totalPages, safeCurrentPage + 1) })}
                disabled={safeCurrentPage === totalPages}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition-colors hover:border-amber-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Page suivante"
              >
                {">"}
              </button>
              <button
                type="button"
                onClick={() => updateFilters({ page: totalPages })}
                disabled={safeCurrentPage === totalPages}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 transition-colors hover:border-amber-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Derniere page"
              >
                {">>"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Par page</span>
              <select
                value={pageSize}
                onChange={(event) => updateFilters({ size: Number(event.target.value), page: 1 })}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
              >
                {PAGE_SIZE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {previewIcon ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewIcon(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Apercu de l'icone draft ${previewIcon.draftId}`}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-amber-500/35 bg-slate-900/95 p-4 shadow-[0_25px_60px_rgba(2,6,23,0.65)]"
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
            <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-amber-500/25 bg-slate-950/80 p-4">
              <img src={previewIcon.src} alt={previewIcon.alt} className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

