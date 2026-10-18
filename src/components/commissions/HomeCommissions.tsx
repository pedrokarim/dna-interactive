"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaButton, DnaChip, DnaCornerBrackets, DnaDialog, cn } from "@/components/dna";
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
  objectiveArt,
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
import { CATEGORY_ICON, ObjectiveThumb } from "./RegionCard";
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

/* ------------------------------------------------------------------ disposition */

/**
 * Grille du bento sur 6 colonnes en `xl` : les tuiles se partagent chaque rangée
 * sans laisser de trou (5 régions = 3 + 2, 4 = 2 + 2). En `md`, 2 colonnes, et
 * une dernière tuile seule prend toute la largeur.
 */
function tileSpan(index: number, count: number): string {
  const lastAlone = count % 2 === 1 && index === count - 1;
  const md = count === 1 || lastAlone ? "md:col-span-2" : "md:col-span-1";
  let xl = "xl:col-span-6";
  if (count === 2 || count === 4) xl = "xl:col-span-3";
  else if (count === 3) xl = "xl:col-span-2";
  else if (count === 5) xl = index < 3 ? "xl:col-span-2" : "xl:col-span-3";
  return cn(md, xl);
}

/** Colonnes de catégories une fois la tuile assez large (requête de conteneur). */
const CATEGORY_COLUMNS: Record<number, string> = {
  1: "@min-[30rem]:grid-cols-1",
  2: "@min-[30rem]:grid-cols-2",
  3: "@min-[30rem]:grid-cols-3",
};

/* ----------------------------------------------------------------------- tuiles */

function ObjectiveCard({ objective, wedge }: { objective: string; wedge: boolean }) {
  const t = useTranslations("commissions");
  const locale = useLocale();
  const label = objectiveLabel(objective, locale);
  const infinite = isInfiniteObjective(objective);
  const art = objectiveArt(objective);
  return (
    <li className="min-w-0">
      {/* Petite tuile : vignette carrée + libellé, sur une ligne. */}
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 border py-1 pl-1 pr-2.5 text-[0.8rem] @5xl:hidden",
          wedge ? "border-crimson-bright/25 bg-crimson/10 text-parch" : "border-line/15 bg-ink-2/60 text-parch/90",
        )}
      >
        <ObjectiveThumb objective={objective} className="h-7 w-7" />
        <span className="min-w-0 truncate" title={label}>{label}</span>
        {infinite ? (
          <span title={t("infinite")} aria-label={t("infinite")} className={cn("ml-auto shrink-0 font-display text-lg leading-none", wedge ? "text-crimson-bright" : "text-gold-bright")}>
            ∞
          </span>
        ) : null}
      </div>
      {/* Grande tuile : la carte du mandat telle que le jeu la montre. */}
      <div
        className={cn(
          "dna-force-dark relative hidden aspect-[3/4] overflow-hidden border bg-ink bg-cover bg-center @5xl:block",
          wedge ? "border-crimson-bright/40" : "border-line/25",
        )}
        style={art ? { backgroundImage: `url(${art})` } : undefined}
      >
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        {infinite ? (
          <span title={t("infinite")} aria-label={t("infinite")} className={cn("absolute right-1.5 top-1.5 rounded-sm bg-ink/75 px-1 font-display text-lg leading-tight", wedge ? "text-crimson-bright" : "text-gold-bright")}>
            ∞
          </span>
        ) : null}
        <span className="absolute inset-x-0 bottom-0 truncate px-2 pb-1.5 text-center font-display text-sm text-parch" title={label}>
          {label}
        </span>
      </div>
    </li>
  );
}

function RegionTile({
  region,
  data,
  categories,
  className,
}: {
  region: Region;
  data: Record<Category, string[]> | undefined;
  categories: Category[];
  className?: string;
}) {
  const t = useTranslations("commissions");
  const locale = useLocale();
  // Mêmes garde-fous que la page : seuls les vrais objectifs s'affichent (la
  // source écrit parfois un message d'erreur à la place d'une région).
  const objectives = (category: Category) => (data?.[category] ?? []).filter(isKnownObjective);
  const unavailable = categories.every((category) => objectives(category).length === 0);

  return (
    <div className={cn("@container relative min-w-0 rounded-sm border border-line/20 bg-panel/70 p-4", className)}>
      <DnaCornerBrackets size={10} className="opacity-50" />
      <h3 className="mb-3 flex min-w-0 items-center gap-2.5 font-caps text-[0.72rem] uppercase tracking-[0.3em] text-gold-bright">
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
        <span className="truncate">{REGION_LABELS[region]}</span>
        <span aria-hidden className="h-px min-w-4 flex-1 bg-gradient-to-r from-line/30 to-transparent" />
      </h3>
      {unavailable ? (
        <p className="flex items-center justify-center gap-2.5 border border-line/15 bg-ink-2/40 px-4 py-5 text-center text-[0.82rem] text-parch/55">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold/60" aria-hidden />
          {t("unavailable")}
        </p>
      ) : (
        <div className={cn("grid grid-cols-1 gap-x-4 gap-y-3", CATEGORY_COLUMNS[categories.length])}>
          {categories.map((category) => {
            const Icon = CATEGORY_ICON[category];
            const wedge = category === "demon_wedge";
            return (
              <div key={category} className="flex min-w-0 flex-col gap-2">
                <p className={cn("flex min-w-0 items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.12em]", wedge ? "text-crimson-soft" : "text-gold")}>
                  <Icon aria-hidden className={cn("h-3.5 w-3.5", wedge ? "text-crimson-bright" : "text-gold")} />
                  <span className="truncate">{categoryLabel(category, locale)}</span>
                </p>
                <ul className="grid grid-cols-1 gap-1.5 @5xl:grid-cols-[repeat(3,minmax(0,9rem))] @5xl:gap-2">
                  {objectives(category).map((objective, i) => (
                    <ObjectiveCard key={`${category}-${i}`} objective={objective} wedge={wedge} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
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
  const { state, meta, freshness, live, syncing, nextLabel, updatedLabel, handleComplete } = useLiveRotation(
    initialState,
    initialMeta,
  );
  const { filter, update, status } = useCommissionFilter(initialFilter, isAuthenticated);
  const [dialogOpen, setDialogOpen] = useState(false);
  const customized = !isDefaultCommissionFilter(filter);
  const count = filter.regions.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Bandeau : état, prochaine rotation, réglage */}
      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-3 rounded-sm border border-line/20 bg-panel/60 px-4 py-3">
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-gold/30 bg-gold/10 text-gold">
            <GlyphIcons.commissions className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <FreshnessBadge freshness={freshness} />
            <p className="mt-0.5 break-words text-[0.75rem] text-parch/65">
              {live && nextLabel
                ? `${t("nextRefresh")} ${t("nextAt", { time: nextLabel })}`
                : updatedLabel
                  ? t("lastCollected", { time: updatedLabel })
                  : t("empty.none.title")}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
          {syncing && live ? <Loader2 className="h-4 w-4 animate-spin text-gold/70" aria-label={t("syncing")} /> : null}
          {live ? (
            <CountdownTimer
              target={meta.nextRefreshAt}
              onComplete={handleComplete}
              className="font-display text-3xl tabular-nums text-gold-bright"
            />
          ) : null}
          <DnaButton type="button" className="px-4 py-2 text-xs" onClick={() => setDialogOpen(true)} aria-haspopup="dialog">
            <GlyphIcons.filter className="h-3.5 w-3.5" />
            {tHome("customize")}
            {customized ? (
              <span className="rounded-sm border border-gold/40 bg-gold/10 px-1.5 font-mono text-[0.6rem] text-gold-bright">
                {filter.regions.length}/{REGIONS.length}
              </span>
            ) : null}
          </DnaButton>
        </div>
      </div>

      {live ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          {filter.regions.map((region, index) => (
            <RegionTile
              key={region}
              region={region}
              data={state.regions[region]}
              categories={filter.categories}
              className={tileSpan(index, count)}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-3 rounded-sm border border-dashed px-4 py-5",
            freshness === "syncing" ? "border-gold/30" : "border-crimson-bright/40",
          )}
        >
          {freshness === "syncing" ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gold" aria-hidden />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-crimson-bright" aria-hidden />
          )}
          <p className="min-w-0 text-sm text-parch/75">
            {t(`empty.${freshness === "live" ? "none" : freshness}.title`)}
          </p>
        </div>
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
