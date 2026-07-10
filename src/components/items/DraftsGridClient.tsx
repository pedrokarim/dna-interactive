"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
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
import FilterChips from "@/components/list/FilterChips";
import ViewModeToggle from "@/components/list/ViewModeToggle";
import { useListViewMode } from "@/components/list/useListViewMode";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaItemIcon, ITEM_FALLBACK_ICON } from "@/components/dna/ItemIcon";
import { useDialogA11y } from "@/components/dna/useDialogA11y";

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
  const t = useTranslations('drafts');
  const td = useTranslations('draftDetail');
  const tc = useTranslations('common');
  const normalizedDefaultLanguages = normalizeLanguageCodes(
    defaultLanguages,
    availableLanguages,
    ["FR", "EN"],
  );

  const [viewMode, setViewMode] = useListViewMode("drafts", "simplified");

  const [previewIcon, setPreviewIcon] = useState<{
    src: string;
    alt: string;
    draftId: number;
  } | null>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(previewPanelRef, {
    open: previewIcon !== null,
    onClose: () => setPreviewIcon(null),
  });

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
    <div className="space-y-4 md:space-y-8">
      <DnaPanel className="border-gold/30 p-4 md:p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/90">{t('headerLabel')}</p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl text-parch">{t('title')}</h1>
            <p className="mt-2 max-w-3xl text-sm text-parch/85">
              {t('description')}
            </p>
            <p className="mt-3 text-sm text-muted">
              {t('count', { filtered: filteredRecipes.length, total: recipes.length })}
            </p>
          </div>
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
            <Link
              href="/items"
              className="rounded-sm border border-white/10 px-4 py-2 text-sm text-parch transition-colors hover:border-gold/50 hover:text-parch"
            >
              {tc('backToCategories')}
            </Link>
          </div>
        </div>

        <div className="mt-4 md:mt-6 grid gap-3 md:gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-sm border border-white/10 bg-ink/60 px-3 py-2">
            <Search className="h-4 w-4 text-gold/90" />
            <input
              value={search}
              onChange={(event) => updateFilters({ q: event.target.value, page: 1 })}
              className="w-full bg-transparent text-sm text-parch outline-none placeholder:text-muted-2"
              placeholder={t('searchPlaceholder')}
            />
          </label>

          <div className="rounded-sm border border-white/10 bg-ink/60 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted">
              <Languages className="h-4 w-4 text-gold/90" />
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

        <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
          <FilterChips
            label={t('filterProductType')}
            icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/90" />}
            options={productTypeOptions.map((value) => ({ value, label: value }))}
            value={productTypeFilter}
            onChange={(value) => updateFilters({ ptype: value, page: 1 })}
            allLabel={tc('all')}
            accent="amber"
          />

          <FilterChips
            label={t('filterIngredientType')}
            icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/90" />}
            options={ingredientTypeOptions.map((value) => ({ value, label: value }))}
            value={ingredientTypeFilter}
            onChange={(value) => updateFilters({ itype: value, page: 1 })}
            allLabel={tc('all')}
            accent="amber"
          />

          <FilterChips
            label={tc('rarity')}
            icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/90" />}
            options={rarityOptions.map((value) => ({ value: String(value), label: String(value) }))}
            value={rarityFilter}
            onChange={(value) => updateFilters({ rarity: value, page: 1 })}
            allLabel={tc('allFeminine')}
            accent="amber"
          />

          <div className="rounded-sm border border-white/10 bg-ink/60 p-2 sm:max-w-xs">
            <div className="mb-1 text-xs text-muted">{tc('sort')}</div>
            <select
              value={sortMode}
              onChange={(event) => updateFilters({ sort: event.target.value as DraftSortMode, page: 1 })}
              aria-label={tc('sort')}
              className="w-full rounded-sm border border-white/10 bg-panel px-2 py-1.5 text-sm text-parch"
            >
              <option value="id">{t('sortById')}</option>
              <option value="rarityDesc">{t('sortRarityDesc')}</option>
              <option value="rarityAsc">{t('sortRarityAsc')}</option>
              <option value="durationAsc">{t('sortDurationAsc')}</option>
              <option value="durationDesc">{t('sortDurationDesc')}</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-ink/60 px-3 py-2 text-sm text-parch/85">
          <p>
            {tc('displayRange', { start: filteredRecipes.length === 0 ? 0 : pageStart + 1, end: Math.min(pageEnd, filteredRecipes.length), total: filteredRecipes.length })}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-sm border border-white/10 px-3 py-1 text-xs text-parch/85 transition-colors hover:border-gold/50 hover:text-parch"
          >
            {tc('resetFilters')}
          </button>
        </div>
      </DnaPanel>

      {filteredRecipes.length === 0 ? (
        <div className="rounded-sm border border-white/10 bg-panel/45 p-6 md:p-10 text-center">
          <p className="text-base md:text-lg text-parch">{t('noResults')}</p>
          <p className="mt-2 text-sm text-muted">{t('noResultsHint')}</p>
        </div>
      ) : (
        viewMode === "detailed" ? (
        <section className="grid gap-3 md:gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              ITEM_FALLBACK_ICON;
            const ingredientSlots = Array.from(
              { length: 4 },
              () => null as DraftRecipeSummary["ingredients"][number] | null,
            );
            const positions = slotPositionsForIngredients(recipe.ingredients.length);
            recipe.ingredients.slice(0, 4).forEach((ingredient, index) => {
              const slot = positions[index] ?? index;
              ingredientSlots[slot] = ingredient;
            });

            return (
              <Link
                key={recipe.id}
                href={`/items/drafts/${recipe.draftId}`}
                className="group relative border border-line/25 bg-panel/85 p-3 md:p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-panel/95"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-sm border border-gold/25 bg-ink/80 p-2">
                    <div className="relative h-full w-full">
                      <div className="h-full w-full overflow-hidden rounded-sm">
                        <DnaItemIcon
                          src={recipeIconSrc}
                          alt={`Draft ${recipe.draftId}`}
                          width={64}
                          height={64}
                          loading="lazy"
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
                        className="absolute -bottom-3 -right-3 z-10 rounded-full border border-white/10 bg-panel/95 p-1 text-parch shadow-sm transition-colors hover:border-gold/60 hover:bg-gold/80 hover:text-parch"
                        aria-label={t('zoomDraftIcon', { id: recipe.draftId })}
                      >
                        <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-gold/90">
                      DRAFT #{recipe.draftId}
                    </p>
                    <h2 className="truncate text-lg font-semibold text-parch transition-colors group-hover:text-gold">
                      {productNameLead}
                    </h2>
                    <p className="truncate text-xs text-muted">
                      {td('productLabel', { type: recipe.product.type, quantity: recipe.productQuantity })}
                    </p>
                  </div>

                  <ChevronRight className="mt-1 h-4 w-4 text-muted transition-colors group-hover:text-gold" />
                </div>

                <div className="mt-4 space-y-2">
                  {selectedLanguages.map((langCode) => {
                    const localizedName = resolveDraftItemName(recipe.product, langCode, availableLanguages);
                    return (
                      <div
                        key={`${recipe.id}-${langCode}`}
                        className="rounded-sm border border-white/10 bg-ink/55 px-3 py-2"
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                          {getLanguageLabel(langCode)}
                        </p>
                        <p className="truncate text-sm font-medium text-parch">{localizedName}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted">Recette</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ingredientSlots.map((ingredient, index) =>
                      ingredient ? (
                        <div
                          key={`${recipe.id}-ingredient-${ingredient.id}-${index}`}
                          className="relative rounded-sm border border-white/10 bg-ink/70 p-2"
                        >
                          <DnaItemIcon
                            src={ingredient.icon.publicPath ?? ingredient.icon.placeholderPath ?? ITEM_FALLBACK_ICON}
                            alt={resolveDraftItemName(ingredient, selectedLanguages[0], availableLanguages)}
                            width={32}
                            height={32}
                            loading="lazy"
                            className="mx-auto h-8 w-8 object-contain"
                          />
                          <span className="absolute bottom-1 right-1 rounded-sm bg-panel/90 px-1 text-[10px] font-medium text-gold">
                            {ingredient.quantity}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={`${recipe.id}-ingredient-empty-${index}`}
                          className="rounded-sm border border-panel bg-ink/35 p-2"
                        >
                          <div className="mx-auto h-8 w-8 rounded-sm border border-panel bg-panel/50" />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                    <Grid3X3 className="h-3.5 w-3.5 text-gold/90" />
                    {recipe.productType}
                  </span>
                  {typeof recipe.rarity === "number" ? (
                    <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                      {td('rarityLabel', { rarity: recipe.rarity })}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                    <Clock3 className="h-3.5 w-3.5 text-gold/90" />
                    {formatDuration(recipe.durationSec)}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
        ) : viewMode === "list" ? (
        <ul className="space-y-2">
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
              ITEM_FALLBACK_ICON;

            return (
              <li key={recipe.id}>
                <Link
                  href={`/items/drafts/${recipe.draftId}`}
                  className="group relative flex items-center gap-4 border border-line/25 bg-panel/85 p-3 backdrop-blur-sm transition-all duration-200 hover:border-gold/40 hover:bg-panel/95"
                >
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-sm border border-gold/25 bg-ink/80 p-2">
                    <DnaItemIcon
                      src={recipeIconSrc}
                      alt={productNameLead}
                      width={64}
                      height={64}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
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
                      className="absolute -bottom-2 -right-2 z-10 rounded-full border border-white/10 bg-panel/95 p-1 text-parch shadow-sm transition-colors hover:border-gold/60 hover:bg-gold/80 hover:text-parch"
                      aria-label={t('zoomDraftIcon', { id: recipe.draftId })}
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-gold/90">
                      DRAFT #{recipe.draftId}
                    </p>
                    <h2 className="truncate text-base font-semibold text-parch transition-colors group-hover:text-gold">
                      {productNameLead}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                        <Grid3X3 className="h-3 w-3 text-gold/90" />
                        {recipe.productType}
                      </span>
                      {typeof recipe.rarity === "number" ? (
                        <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                          {td('rarityLabel', { rarity: recipe.rarity })}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                        <Clock3 className="h-3 w-3 text-gold/90" />
                        {formatDuration(recipe.durationSec)}
                      </span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1 sm:flex">
                    {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                      <div
                        key={`${recipe.id}-ingredient-${ingredient.id}-${index}`}
                        className="relative h-10 w-10 rounded-sm border border-white/10 bg-ink/70 p-1"
                      >
                        <DnaItemIcon
                          src={ingredient.icon.publicPath ?? ingredient.icon.placeholderPath ?? ITEM_FALLBACK_ICON}
                          alt={resolveDraftItemName(ingredient, selectedLanguages[0], availableLanguages)}
                          width={40}
                          height={40}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                        <span className="absolute -bottom-1 -right-1 rounded-sm bg-panel/90 px-1 text-[9px] font-medium text-gold">
                          {ingredient.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-gold" />
                </Link>
              </li>
            );
          })}
        </ul>
        ) : (
        <section className="grid gap-2.5 md:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
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
              ITEM_FALLBACK_ICON;

            return (
              <Link
                key={recipe.id}
                href={`/items/drafts/${recipe.draftId}`}
                title={productNameLead}
                className="group relative flex aspect-square flex-col overflow-hidden rounded-sm border border-white/10 bg-ink/80 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40"
              >
                <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                  <DnaItemIcon
                    src={recipeIconSrc}
                    alt={productNameLead}
                    width={96}
                    height={96}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                  {typeof recipe.rarity === "number" ? (
                    <span className="absolute left-0 top-0 rounded-sm border border-gold/40 bg-ink/70 px-1.5 py-0.5 text-[10px] text-gold">
                      {recipe.rarity}
                    </span>
                  ) : null}
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
                    className="absolute right-0 top-0 z-10 rounded-full border border-white/10 bg-panel/90 p-1 text-parch opacity-0 shadow-sm transition-all hover:border-gold/60 hover:bg-gold/80 hover:text-parch group-hover:opacity-100"
                    aria-label={t('zoomDraftIcon', { id: recipe.draftId })}
                  >
                    <ZoomIn className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1">
                  <p className="truncate text-xs font-semibold text-parch">{productNameLead}</p>
                  <p className="flex items-center gap-1 text-[10px] text-muted">
                    <Clock3 className="h-3 w-3 text-gold/90" />
                    {formatDuration(recipe.durationSec)}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
        )
      )}

      {filteredRecipes.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-panel/50 p-3">
          <p className="text-sm text-parch/85">
            {tc('displayRange', { start: filteredRecipes.length === 0 ? 0 : pageStart + 1, end: Math.min(pageEnd, filteredRecipes.length), total: filteredRecipes.length })}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateFilters({ page: 1 })}
                disabled={safeCurrentPage === 1}
                className="rounded-sm border border-white/10 px-2 py-1 text-xs text-parch transition-colors hover:border-gold/40 hover:text-parch disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tc('paginationFirst')}
              >
                {"<<"}
              </button>
              <button
                type="button"
                onClick={() => updateFilters({ page: Math.max(1, safeCurrentPage - 1) })}
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
                    onClick={() => updateFilters({ page })}
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
                onClick={() => updateFilters({ page: Math.min(totalPages, safeCurrentPage + 1) })}
                disabled={safeCurrentPage === totalPages}
                className="rounded-sm border border-white/10 px-2 py-1 text-xs text-parch transition-colors hover:border-gold/40 hover:text-parch disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tc('paginationNext')}
              >
                {">"}
              </button>
              <button
                type="button"
                onClick={() => updateFilters({ page: totalPages })}
                disabled={safeCurrentPage === totalPages}
                className="rounded-sm border border-white/10 px-2 py-1 text-xs text-parch transition-colors hover:border-gold/40 hover:text-parch disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={tc('paginationLast')}
              >
                {">>"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-muted">Par page</span>
              <select
                value={pageSize}
                onChange={(event) => updateFilters({ size: Number(event.target.value), page: 1 })}
                aria-label="Par page"
                className="rounded-sm border border-white/10 bg-panel px-2 py-1 text-xs text-parch"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewIcon(null)}
        >
          <div
            ref={previewPanelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Apercu de l'icone draft ${previewIcon.draftId}`}
            className="w-full max-w-sm border border-gold/35 bg-panel/95 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-parch">{previewIcon.alt}</p>
              <button
                type="button"
                onClick={() => setPreviewIcon(null)}
                className="rounded-full p-1 text-parch/85 transition-colors hover:bg-panel hover:text-parch"
                aria-label={tc('close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex h-64 items-center justify-center rounded-sm border border-gold/25 bg-ink/80 p-4">
              <DnaItemIcon src={previewIcon.src} alt={previewIcon.alt} width={200} height={200} className="max-h-full max-w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

