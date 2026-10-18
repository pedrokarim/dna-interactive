"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaButton, DnaChip, DnaDialog, cn } from "@/components/dna";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import {
  COMMISSION_FILTER_COOKIE,
  COMMISSION_FILTER_COOKIE_MAX_AGE,
  DEFAULT_COMMISSION_FILTER,
  isDefaultCommissionFilter,
  normalizeCommissionFilter,
  serializeCommissionFilter,
  type CommissionFilter,
} from "@/lib/commissions/preferences";
import {
  CATEGORIES,
  categoryLabel,
  isInfiniteObjective,
  isKnownObjective,
  objectiveLabel,
  REGION_LABELS,
  REGIONS,
  type Category,
  type Region,
  type RotationMeta,
  type RotationState,
} from "@/lib/commissions/types";
import { CountdownTimer } from "./CountdownTimer";
import { FreshnessBadge } from "./FreshnessBadge";
import { CATEGORY_ICON } from "./RegionCard";
import { useLiveRotation } from "./useLiveRotation";

const SAVE_DELAY_MS = 600;

type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Cookie du filtre, tenu à jour même connecté : il reprend la main à la déconnexion. */
function writeFilterCookie(filter: CommissionFilter) {
  try {
    document.cookie = isDefaultCommissionFilter(filter)
      ? `${COMMISSION_FILTER_COOKIE}=; path=/; max-age=0; samesite=lax`
      : `${COMMISSION_FILTER_COOKIE}=${serializeCommissionFilter(filter)}; path=/; max-age=${COMMISSION_FILTER_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {}
}

/**
 * Filtre des commissions de l'accueil : appliqué tout de suite, écrit dans le
 * cookie, et envoyé au compte après un court délai quand on est connecté.
 */
function useCommissionFilter(initial: CommissionFilter | null, isAuthenticated: boolean) {
  const [filter, setFilter] = useState<CommissionFilter>(initial ?? DEFAULT_COMMISSION_FILTER);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const update = useCallback(
    (next: CommissionFilter) => {
      const normalized = normalizeCommissionFilter(next);
      setFilter(normalized);
      writeFilterCookie(normalized);
      if (!isAuthenticated) return;
      if (timer.current) clearTimeout(timer.current);
      setStatus("saving");
      timer.current = setTimeout(() => {
        fetch("/api/account/commission-filter", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter: normalized }),
        })
          .then((r) => setStatus(r.ok ? "saved" : "error"))
          .catch(() => setStatus("error"));
      }, SAVE_DELAY_MS);
    },
    [isAuthenticated],
  );

  return { filter, update, status };
}

/* ----------------------------------------------------------------------- tableau */

/** Colonnes du tableau : nom de région, puis une colonne par catégorie retenue. */
const ROW_COLUMNS: Record<number, string> = {
  1: "md:grid-cols-[6.5rem_minmax(0,1fr)]",
  2: "md:grid-cols-[6.5rem_repeat(2,minmax(0,1fr))]",
  3: "md:grid-cols-[6.5rem_repeat(3,minmax(0,1fr))]",
};

/** Les trois objectifs d'une catégorie, en texte, séparés par des points. */
function ObjectiveList({ objectives, wedge }: { objectives: string[]; wedge: boolean }) {
  const t = useTranslations("commissions");
  const locale = useLocale();
  return (
    <span className="min-w-0 break-words text-[0.8rem] text-parch/85">
      {objectives.map((objective, i) => (
        <span key={i}>
          {i > 0 ? <span aria-hidden className="px-1.5 text-muted-2">·</span> : null}
          {objectiveLabel(objective, locale)}
          {isInfiniteObjective(objective) ? (
            <span title={t("infinite")} aria-label={t("infinite")} className={cn("ml-0.5", wedge ? "text-crimson-bright" : "text-gold-bright")}>
              ∞
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

function RegionRow({
  region,
  data,
  categories,
}: {
  region: Region;
  data: Record<Category, string[]> | undefined;
  categories: Category[];
}) {
  const t = useTranslations("commissions");
  const locale = useLocale();
  // Mêmes garde-fous que la page : seuls les vrais objectifs s'affichent (la
  // source écrit parfois un message d'erreur à la place d'une région).
  const objectives = (category: Category) => (data?.[category] ?? []).filter(isKnownObjective);
  const unavailable = categories.every((category) => objectives(category).length === 0);

  return (
    <div className={cn("grid grid-cols-1 gap-x-4 gap-y-1.5 px-4 py-2.5", ROW_COLUMNS[categories.length])}>
      <span className="font-caps text-[0.65rem] uppercase tracking-[0.24em] text-gold-bright md:pt-0.5">
        {REGION_LABELS[region]}
      </span>
      {unavailable ? (
        <span className="text-[0.8rem] text-parch/45 md:col-span-full md:col-start-2">{t("unavailable")}</span>
      ) : (
        categories.map((category) => {
          const Icon = CATEGORY_ICON[category];
          const wedge = category === "demon_wedge";
          return (
            <div key={category} className="flex min-w-0 items-start gap-2">
              {/* En colonnes, l'en-tête porte la catégorie ; empilé, chaque ligne la rappelle. */}
              <Icon
                aria-label={categoryLabel(category, locale)}
                className={cn("mt-0.5 h-3.5 w-3.5 md:hidden", wedge ? "text-crimson-bright" : "text-gold")}
              />
              <ObjectiveList objectives={objectives(category)} wedge={wedge} />
            </div>
          );
        })
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- réglage */

function FilterDialog({
  open,
  onClose,
  filter,
  onChange,
  isAuthenticated,
  status,
}: {
  open: boolean;
  onClose: () => void;
  filter: CommissionFilter;
  onChange: (next: CommissionFilter) => void;
  isAuthenticated: boolean;
  status: SaveStatus;
}) {
  const t = useTranslations("commissions.home");
  const locale = useLocale();
  // La dernière valeur d'une liste ne se retire pas : il reste toujours quelque chose à afficher.
  const toggleRegion = (region: Region) => {
    const has = filter.regions.includes(region);
    if (has && filter.regions.length === 1) return;
    onChange({ ...filter, regions: has ? filter.regions.filter((r) => r !== region) : [...filter.regions, region] });
  };
  const toggleCategory = (category: Category) => {
    const has = filter.categories.includes(category);
    if (has && filter.categories.length === 1) return;
    onChange({ ...filter, categories: has ? filter.categories.filter((c) => c !== category) : [...filter.categories, category] });
  };

  return (
    <DnaDialog
      open={open}
      onClose={onClose}
      title={t("dialogTitle")}
      footer={
        <>
          <DnaButton type="button" className="px-4 py-2 text-xs" disabled={isDefaultCommissionFilter(filter)} onClick={() => onChange(DEFAULT_COMMISSION_FILTER)}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {t("reset")}
          </DnaButton>
          <DnaButton type="button" variant="gold" className="px-4 py-2 text-xs" onClick={onClose}>{t("done")}</DnaButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-parch/75">{t("dialogIntro")}</p>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">{t("regions")}</legend>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <DnaChip key={region} selected={filter.regions.includes(region)} onClick={() => toggleRegion(region)}>
                {REGION_LABELS[region]}
              </DnaChip>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.22em] text-muted">{t("categories")}</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICON[category];
              return (
                <DnaChip key={category} selected={filter.categories.includes(category)} onClick={() => toggleCategory(category)}>
                  <Icon aria-hidden className="h-3.5 w-3.5" />
                  {categoryLabel(category, locale)}
                </DnaChip>
              );
            })}
          </div>
        </fieldset>
        <p className="text-[0.75rem] text-parch/55" role="status">
          {isAuthenticated ? (
            status === "error" ? (
              <span className="text-crimson-bright">{t("saveError")}</span>
            ) : status === "saving" ? (
              t("saving")
            ) : (
              t("storedAccount")
            )
          ) : (
            <>
              {t("storedBrowser")}{" "}
              <Link href="/login" className="text-gold underline-offset-2 hover:text-gold-bright hover:underline">
                {t("signInToSync")}
              </Link>
            </>
          )}
        </p>
      </div>
    </DnaDialog>
  );
}

/* ------------------------------------------------------------------------ section */

/**
 * Section « Mandats scellés » de l'accueil : la rotation en cours, limitée aux
 * régions et catégories choisies par le visiteur (tout, par défaut).
 */
export function HomeCommissions({
  initialState,
  initialMeta,
  initialFilter,
  isAuthenticated,
}: {
  initialState: RotationState;
  initialMeta: RotationMeta;
  initialFilter: CommissionFilter | null;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("commissions");
  const tHome = useTranslations("commissions.home");
  const { state, meta, freshness, live, syncing, handleComplete } = useLiveRotation(
    initialState,
    initialMeta,
  );
  const { filter, update, status } = useCommissionFilter(initialFilter, isAuthenticated);
  const [dialogOpen, setDialogOpen] = useState(false);
  const locale = useLocale();
  const customized = !isDefaultCommissionFilter(filter);

  return (
    <div className="rounded-sm border border-line/20 bg-panel/60">
      {/* En-tête : état, prochaine rotation, réglage */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line/15 px-4 py-2.5">
        <GlyphIcons.commissions className="h-4 w-4 text-gold" />
        <FreshnessBadge freshness={freshness} />
        {live ? (
          <span className="flex items-center gap-1.5 text-[0.75rem] text-parch/60">
            {t("nextRefresh")}
            <CountdownTimer
              target={meta.nextRefreshAt}
              onComplete={handleComplete}
              className="font-mono tabular-nums text-gold-bright"
            />
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gold/70" aria-label={t("syncing")} /> : null}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          aria-haspopup="dialog"
          className="ml-auto inline-flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-bright"
        >
          <GlyphIcons.filter className="h-3.5 w-3.5" />
          {tHome("customize")}
          {customized ? <span className="font-mono normal-case tracking-normal text-gold-bright">{filter.regions.length}/{REGIONS.length}</span> : null}
        </button>
      </div>

      {live ? (
        <>
          {/* Noms des catégories, au-dessus des colonnes (masqués quand tout s'empile). */}
          <div className={cn("hidden gap-x-4 border-b border-line/10 px-4 py-1.5 md:grid", ROW_COLUMNS[filter.categories.length])}>
            <span />
            {filter.categories.map((category) => {
              const Icon = CATEGORY_ICON[category];
              const wedge = category === "demon_wedge";
              return (
                <span key={category} className={cn("flex min-w-0 items-center gap-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em]", wedge ? "text-crimson-soft" : "text-gold")}>
                  <Icon aria-hidden className={cn("h-3.5 w-3.5", wedge ? "text-crimson-bright" : "text-gold")} />
                  <span className="truncate" title={categoryLabel(category, locale)}>{categoryLabel(category, locale)}</span>
                </span>
              );
            })}
          </div>
          <div className="divide-y divide-line/10">
            {filter.regions.map((region) => (
              <RegionRow key={region} region={region} data={state.regions[region]} categories={filter.categories} />
            ))}
          </div>
        </>
      ) : (
        <p className="flex items-center gap-2.5 px-4 py-3 text-[0.8rem] text-parch/70">
          {freshness === "syncing" ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" aria-hidden />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-crimson-bright" aria-hidden />
          )}
          {t(`empty.${freshness === "live" ? "none" : freshness}.title`)}
        </p>
      )}

      <FilterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        filter={filter}
        onChange={update}
        isAuthenticated={isAuthenticated}
        status={status}
      />
    </div>
  );
}
