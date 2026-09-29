"use client";

import { DnaPageMark } from "@/components/dna/PageMark";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { ChevronRight, EyeOff, Heart, Palette, Search, SlidersHorizontal, Users } from "lucide-react";
import { useAtom } from "jotai";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import type { CosmeticCharacterRef, CosmeticSummary } from "@/lib/cosmetics/catalog";
import type { ObtainMethod } from "@/lib/cosmetics/types";
import {
  cosmeticsFavoritesAtom,
  cosmeticsFiltersStorageAtom,
  toggleCosmeticFavoriteAtom,
} from "@/lib/store";
import FilterChips from "@/components/list/FilterChips";
import ViewModeToggle from "@/components/list/ViewModeToggle";
import { useListViewMode } from "@/components/list/useListViewMode";
import { DnaCornerBrackets } from "@/components/dna/CornerBrackets";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { DnaStars } from "@/components/dna/RarityStars";
import { rarityAttr, toRarityLevel } from "@/components/dna/rarity";
import { cn } from "@/components/dna/cn";
import { useFilterAnalytics } from "@/lib/use-filter-analytics";
import CosmeticsPagination from "./CosmeticsPagination";

const SORT_MODE_VALUES = ["default", "name", "rarity"] as const;
type SortMode = (typeof SORT_MODE_VALUES)[number];
const PAGE_SIZE_VALUES = [24, 48, 96] as const;
const DEFAULT_PAGE_SIZE = 48;

/** Ordre d'affichage des modes d'obtention dans les filtres. */
const OBTAIN_ORDER: ObtainMethod[] = [
  "banner",
  "prismExchange",
  "shop",
  "event",
  "impressionShop",
  "battlePass",
  "starterPack",
  "quest",
  "reputation",
  "default",
];

type CosmeticsGridClientProps = {
  category: { slug: string; title: string; description: string };
  subcategories: { id: string; label: string; count: number }[];
  items: CosmeticSummary[];
  characters: CosmeticCharacterRef[];
};

export default function CosmeticsGridClient({ category, subcategories, items, characters }: CosmeticsGridClientProps) {
  const t = useTranslations("cosmetics");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [persisted, setPersisted] = useAtom(cosmeticsFiltersStorageAtom);
  const [favorites] = useAtom(cosmeticsFavoritesAtom);
  const [, toggleFavorite] = useAtom(toggleCosmeticFavoriteAtom);
  const [viewMode, setViewMode] = useListViewMode(`cosmetics:${category.slug}`, "simplified");
  const saved = persisted[category.slug];

  const [query, setQuery] = useQueryStates({
    q: parseAsString,
    sub: parseAsString,
    rarity: parseAsString,
    obtain: parseAsString,
    char: parseAsString,
    sort: parseAsStringLiteral(SORT_MODE_VALUES),
    size: parseAsInteger,
    page: parseAsInteger,
  });
  const hasUrlFilters = Object.values(query).some((value) => value !== null);

  const search = query.q ?? (hasUrlFilters ? "" : saved?.search ?? "");
  const subcategoryFilter = query.sub ?? (hasUrlFilters ? "all" : saved?.subcategoryFilter ?? "all");
  const rarityFilter = query.rarity ?? (hasUrlFilters ? "all" : saved?.rarityFilter ?? "all");
  const obtainFilter = query.obtain ?? (hasUrlFilters ? "all" : saved?.obtainFilter ?? "all");
  const characterFilter = query.char ?? (hasUrlFilters ? "all" : saved?.characterFilter ?? "all");
  const rawSort = query.sort ?? (hasUrlFilters ? "default" : saved?.sortMode ?? "default");
  const sortMode: SortMode = (SORT_MODE_VALUES as readonly string[]).includes(rawSort) ? (rawSort as SortMode) : "default";
  const rawSize = query.size ?? (hasUrlFilters ? DEFAULT_PAGE_SIZE : saved?.pageSize ?? DEFAULT_PAGE_SIZE);
  const pageSize = (PAGE_SIZE_VALUES as readonly number[]).includes(rawSize) ? rawSize : DEFAULT_PAGE_SIZE;
  const rawPage = query.page ?? (hasUrlFilters ? 1 : saved?.currentPage ?? 1);
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const update = (overrides: Partial<Record<"q" | "sub" | "rarity" | "obtain" | "char", string>> & { sort?: SortMode; size?: number; page?: number }) => {
    void setQuery({
      q: search,
      sub: subcategoryFilter,
      rarity: rarityFilter,
      obtain: obtainFilter,
      char: characterFilter,
      sort: sortMode,
      size: pageSize,
      page: currentPage,
      ...overrides,
    });
  };

  // Options des filtres : seulement les valeurs présentes dans la catégorie.
  const rarityOptions = useMemo(
    () => [...new Set(items.map((item) => item.rarity).filter((r): r is number => r != null))].sort((a, b) => b - a),
    [items],
  );
  const obtainOptions = useMemo(() => {
    const present = new Set(items.flatMap((item) => item.obtain));
    return OBTAIN_ORDER.filter((method) => present.has(method));
  }, [items]);
  const characterOptions = useMemo(() => {
    const present = new Set(items.flatMap((item) => item.characters));
    return characters.filter((character) => present.has(character.charId)).sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [items, characters, locale]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const result = items.filter((item) => {
      if (needle && !item.searchText.includes(needle)) return false;
      if (subcategoryFilter !== "all" && item.subcategory !== subcategoryFilter) return false;
      if (rarityFilter !== "all" && String(item.rarity) !== rarityFilter) return false;
      if (obtainFilter === "hidden") {
        if (!item.hiddenUntilOwned) return false;
      } else if (obtainFilter !== "all" && !item.obtain.includes(obtainFilter as ObtainMethod)) return false;
      if (characterFilter !== "all" && !item.characters.includes(Number(characterFilter))) return false;
      return true;
    });
    if (sortMode === "name") result.sort((a, b) => a.name.localeCompare(b.name, locale));
    else if (sortMode === "rarity") result.sort((a, b) => (b.rarity ?? 0) - (a.rarity ?? 0) || a.name.localeCompare(b.name, locale));
    return result;
  }, [items, search, subcategoryFilter, rarityFilter, obtainFilter, characterFilter, sortMode, locale]);

  useFilterAnalytics(
    `cosmetics:${category.slug}`,
    {
      search: search.trim().length > 0,
      subcategory: subcategoryFilter,
      rarity: rarityFilter,
      obtain: obtainFilter,
      character: characterFilter,
      sort: sortMode,
    },
    filtered.length,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pageItems = filtered.slice(pageStart, pageEnd);
  const favoriteCount = useMemo(
    () => items.filter((item) => favorites.has(`${item.category}/${item.id}`)).length,
    [items, favorites],
  );

  useEffect(() => {
    const next = {
      search,
      subcategoryFilter,
      rarityFilter,
      obtainFilter,
      characterFilter,
      sortMode,
      pageSize,
      currentPage: safePage,
    };
    setPersisted((prev) => {
      const current = prev[category.slug];
      if (current && Object.entries(next).every(([key, value]) => current[key as keyof typeof next] === value)) return prev;
      return { ...prev, [category.slug]: next };
    });
  }, [category.slug, search, subcategoryFilter, rarityFilter, obtainFilter, characterFilter, sortMode, pageSize, safePage, setPersisted]);

  useEffect(() => {
    if (currentPage > totalPages) void setQuery({ page: totalPages });
  }, [currentPage, totalPages, setQuery]);

  const resetFilters = () =>
    update({ q: "", sub: "all", rarity: "all", obtain: "all", char: "all", sort: "default", size: DEFAULT_PAGE_SIZE, page: 1 });

  const renderFavorite = (item: CosmeticSummary, className: string) => {
    const key = `${item.category}/${item.id}`;
    const isFavorite = favorites.has(key);
    return (
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleFavorite(key);
        }}
        aria-label={isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
        aria-pressed={isFavorite}
        className={cn(
          "rounded-full bg-ink/60 p-1 backdrop-blur-sm transition-colors",
          isFavorite ? "text-crimson-bright" : "text-parch/85 hover:text-crimson-bright",
          className,
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-crimson-bright text-crimson-bright")} />
      </button>
    );
  };

  const subcategoryName = (id: string | null) => (id ? (subcategories.find((sub) => sub.id === id)?.label ?? null) : null);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* En-tête gabarit — eyebrow mono + titre + compteur en équerres */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link href="/cosmetics" className="inline-flex transition-opacity hover:opacity-80">
            <DnaPageMark>{t("headerLabel")}</DnaPageMark>
          </Link>
          <h1 className="mt-1 font-display text-4xl font-semibold text-parch md:text-5xl">{category.title}</h1>
          <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
          <p className="mt-3 max-w-2xl text-sm text-parch/75">{category.description}</p>
        </div>
        <div className="relative shrink-0 px-5 py-3">
          <DnaCornerBrackets size={16} />
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-semibold tabular-nums text-parch">{filtered.length}</span>
            <span className="font-caps text-[0.55rem] uppercase leading-tight tracking-[0.2em] text-muted">
              {t("countLabel")}
            </span>
          </div>
        </div>
      </div>

      {/* Barre d'outils + filtres */}
      <section className="border border-line/20 bg-panel/55 p-4 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{t("count", { filtered: filtered.length, total: items.length })}</p>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              labels={{
                simplified: tc("viewSimplified"),
                list: tc("viewList"),
                detailed: tc("viewDetailed"),
                group: tc("viewMode"),
              }}
            />
            <span className="inline-flex items-center gap-2 rounded-sm border border-crimson/40 bg-crimson/10 px-4 py-2 text-sm text-crimson-bright">
              <Heart className="h-4 w-4" />
              {tc("favorites")} ({favoriteCount})
            </span>
          </div>
        </div>

        <div className="mt-4 md:mt-6">
          <label className="flex items-center gap-3 rounded-sm border border-white/10 bg-ink/60 px-3 py-2">
            <Search className="h-4 w-4 text-gold/80" />
            <input
              value={search}
              onChange={(event) => update({ q: event.target.value, page: 1 })}
              className="w-full bg-transparent text-sm text-parch outline-none placeholder:text-muted-2"
              placeholder={t("searchPlaceholder")}
              aria-label={tc("search")}
            />
          </label>
        </div>

        <div className="mt-3 space-y-2 md:mt-4 md:space-y-3">
          {subcategories.length > 1 ? (
            <FilterChips
              label={t("filterSubcategory")}
              icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/80" />}
              options={subcategories.map((sub) => ({ value: sub.id, label: `${sub.label} (${sub.count})` }))}
              value={subcategoryFilter}
              onChange={(value) => update({ sub: value, page: 1 })}
              allLabel={tc("all")}
            />
          ) : null}
          {rarityOptions.length > 1 ? (
            <FilterChips
              label={tc("rarity")}
              icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/80" />}
              options={rarityOptions.map((rarity) => ({ value: String(rarity), label: "★".repeat(rarity) }))}
              value={rarityFilter}
              onChange={(value) => update({ rarity: value, page: 1 })}
              allLabel={tc("allFeminine")}
            />
          ) : null}
          {obtainOptions.length > 0 ? (
            <FilterChips
              label={t("filterObtain")}
              icon={<SlidersHorizontal className="h-3.5 w-3.5 text-gold/80" />}
              options={[
                ...obtainOptions.map((method) => ({ value: method, label: t(`obtain.${method}`) })),
                ...(items.some((item) => item.hiddenUntilOwned) ? [{ value: "hidden", label: t("hiddenFilter") }] : []),
              ]}
              value={obtainFilter}
              onChange={(value) => update({ obtain: value, page: 1 })}
              allLabel={tc("all")}
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            {characterOptions.length > 1 ? (
              <div className="rounded-sm border border-white/10 bg-ink/60 p-2 sm:w-64">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                  <Users className="h-3.5 w-3.5 text-gold/80" />
                  {t("filterCharacter")}
                </div>
                <select
                  value={characterFilter}
                  onChange={(event) => update({ char: event.target.value, page: 1 })}
                  aria-label={t("filterCharacter")}
                  className="w-full rounded-sm border border-white/10 bg-panel px-2 py-1.5 text-sm text-parch"
                >
                  <option value="all">{tc("all")}</option>
                  {characterOptions.map((character) => (
                    <option key={character.charId} value={String(character.charId)}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="rounded-sm border border-white/10 bg-ink/60 p-2 sm:w-64">
              <div className="mb-1 text-xs text-muted">{tc("sort")}</div>
              <select
                value={sortMode}
                onChange={(event) => update({ sort: event.target.value as SortMode, page: 1 })}
                aria-label={tc("sort")}
                className="w-full rounded-sm border border-white/10 bg-panel px-2 py-1.5 text-sm text-parch"
              >
                <option value="default">{t("sortDefault")}</option>
                <option value="name">{t("sortName")}</option>
                <option value="rarity">{t("sortRarity")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-white/10 bg-ink/60 px-3 py-2 text-sm text-parch/85">
          <p>
            {tc("displayRange", {
              start: filtered.length === 0 ? 0 : pageStart + 1,
              end: Math.min(pageEnd, filtered.length),
              total: filtered.length,
            })}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-sm border border-white/10 px-3 py-1 text-xs text-parch/85 transition-colors hover:border-gold/40 hover:text-parch"
          >
            {tc("resetFilters")}
          </button>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-sm border border-white/10 bg-panel/45 p-6 text-center md:p-10">
          <p className="text-base text-parch md:text-lg">{t("noResults")}</p>
          <p className="mt-2 text-sm text-muted">{t("noResultsHint")}</p>
        </div>
      ) : viewMode === "list" ? (
        <ul className="space-y-2">
          {pageItems.map((item) => (
            <li key={item.id}>
              <Link
                href={`/cosmetics/${item.category}/${item.id}`}
                data-rarity={rarityAttr(toRarityLevel(item.rarity))}
                className="group flex items-center gap-4 border border-white/10 bg-panel/55 p-3 transition-colors duration-200 hover:border-gold/40 hover:bg-panel/75"
              >
                <div className="dna-rarity-slot flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border p-1">
                  <DnaItemIcon src={item.icon} alt={item.name} width={64} height={64} loading="lazy" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="dna-rarity-name truncate font-display text-lg font-semibold">{item.name}</h3>
                    {item.rarity ? <DnaStars value={item.rarity} className="shrink-0" /> : null}
                  </div>
                  <CosmeticMeta item={item} subcategory={subcategoryName(item.subcategory)} />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {renderFavorite(item, "")}
                  <ChevronRight className="h-4 w-4 text-muted-2 transition-colors group-hover:text-gold" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : viewMode === "detailed" ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {pageItems.map((item) => (
            <Link
              key={item.id}
              href={`/cosmetics/${item.category}/${item.id}`}
              data-rarity={rarityAttr(toRarityLevel(item.rarity))}
              className="group relative overflow-hidden border border-white/10 bg-panel/55 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-panel/75"
            >
              <div className={cn("dna-rarity-slot relative flex items-center justify-center overflow-hidden border-b", item.portrait ? "aspect-[3/4]" : "aspect-square")}>
                {item.portrait ? (
                  // Portrait de bannière (bande 1:4, 256 px de large) : vignette 3:4 à l’échelle d’origine, tête et buste.
                  <img
                    src={item.portrait}
                    alt={item.name}
                    width={256}
                    height={1024}
                    loading="lazy"
                    className="h-full w-full object-cover object-[50%_8%] transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <DnaItemIcon
                    src={item.icon}
                    alt={item.name}
                    width={160}
                    height={160}
                    loading="lazy"
                    className="max-h-[70%] max-w-[70%] object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                {renderFavorite(item, "absolute right-2 top-2 z-10")}
                <CosmeticBadges item={item} className="absolute left-2 top-2" />
              </div>
              <div className="p-3">
                <h3 className="dna-rarity-name truncate font-display text-lg font-semibold">{item.name}</h3>
                {item.rarity ? <DnaStars value={item.rarity} className="mt-0.5" /> : null}
                <CosmeticMeta item={item} subcategory={subcategoryName(item.subcategory)} />
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 md:gap-3 xl:grid-cols-8 2xl:grid-cols-10">
          {pageItems.map((item) => (
            <Link
              key={item.id}
              href={`/cosmetics/${item.category}/${item.id}`}
              title={item.name}
              data-rarity={rarityAttr(toRarityLevel(item.rarity))}
              className="dna-rarity-tile group relative flex aspect-square flex-col overflow-hidden rounded-sm border bg-ink/80 p-2 hover:-translate-y-0.5"
            >
              <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                <DnaItemIcon
                  src={item.icon}
                  alt={item.name}
                  width={96}
                  height={96}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                />
                {renderFavorite(item, "absolute right-0 top-0 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100")}
                <CosmeticBadges item={item} className="absolute left-0 top-0" compact />
              </div>
              <p className="dna-rarity-name mt-1 truncate text-xs font-semibold">{item.name}</p>
            </Link>
          ))}
        </section>
      )}

      {filtered.length > 0 ? (
        <CosmeticsPagination
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizes={PAGE_SIZE_VALUES}
          rangeLabel={tc("displayRange", {
            start: pageStart + 1,
            end: Math.min(pageEnd, filtered.length),
            total: filtered.length,
          })}
          onPage={(page) => update({ page })}
          onPageSize={(size) => update({ size, page: 1 })}
        />
      ) : null}
    </div>
  );
}

/** Pastilles d'angle : secret (masqué tant que non possédé), Myriade, coloris. */
function CosmeticBadges({ item, className, compact = false }: { item: CosmeticSummary; className?: string; compact?: boolean }) {
  const t = useTranslations("cosmetics");
  if (!item.hiddenUntilOwned && !item.onBanner && item.variantCount < 2) return null;
  return (
    <span className={cn("z-10 flex flex-col items-start gap-1", className)}>
      {item.hiddenUntilOwned ? (
        <span
          title={t("hiddenHint")}
          className="inline-flex items-center gap-1 rounded-sm border border-white/15 bg-ink/80 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-parch/85 backdrop-blur-sm"
        >
          <EyeOff className="h-2.5 w-2.5" />
          {compact ? null : t("hiddenBadge")}
        </span>
      ) : null}
      {item.variantCount > 1 && !compact ? (
        <span className="inline-flex items-center gap-1 rounded-sm border border-white/15 bg-ink/80 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-parch/85 backdrop-blur-sm">
          <Palette className="h-2.5 w-2.5" />
          {t("variantsCount", { count: item.variantCount })}
        </span>
      ) : null}
    </span>
  );
}

function CosmeticMeta({ item, subcategory }: { item: CosmeticSummary; subcategory: string | null }) {
  const t = useTranslations("cosmetics");
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
      {subcategory ? <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">{subcategory}</span> : null}
      {item.obtain.slice(0, 2).map((method) => (
        <span key={method} className="rounded-sm border border-gold/25 bg-gold/10 px-2 py-0.5 text-gold">
          {t(`obtain.${method}`)}
        </span>
      ))}
      {item.characters.length > 1 ? (
        <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
          {t("characterCount", { count: item.characters.length })}
        </span>
      ) : null}
    </div>
  );
}
