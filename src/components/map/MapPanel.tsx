"use client";

import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { MAP_EASE } from "./ActiveTypesRail";
import { ArrowLeftRight, ChevronLeft, Cloud, CloudOff, ListChecks, LoaderCircle, RotateCcw, X } from "lucide-react";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import { Link } from "@/i18n/navigation";
import { ASSETS_PATHS } from "@/lib/constants";
import { cn, DnaCornerBrackets } from "@/components/dna";
import type { MapTypeGroup, NormalizedMap } from "@/lib/map/taxonomy";
import { formatPercent, mapProgress, percent } from "@/lib/map/progress";
import { getMapLocation } from "@/lib/map/world";
import { FiltersView } from "./FiltersView";
import { MapSeoFooter } from "./MapSeoFooter";
import { MarkedView } from "./MarkedView";
import { RegionSwitcher } from "./RegionSwitcher";
import { SearchView } from "./SearchView";
import { useMapLabels } from "./useMapLabels";
import type { SyncStatus } from "./useProgressSync";

export type PanelView = "filters" | "regions" | "search" | "marked";

/**
 * Panneau gauche de la carte. Une seule colonne de 380 px, sans chrome
 * superflu : en-tête de zone (56 px), ligne de recherche, puis le contenu du
 * mode courant sur toute la hauteur restante.
 */
export function MapPanel({
  view,
  onViewChange,
  mapId,
  map,
  marked,
  activeTypes,
  onSelectMap,
  onToggleType,
  onSetTypes,
  onResetTypes,
  onMarkType,
  onLocate,
  syncStatus,
  onCollapse,
}: {
  syncStatus: SyncStatus;
  /** Replier le panneau (bouton visible sur mobile seulement, ailleurs il est à côté). */
  onCollapse: () => void;
  view: PanelView;
  onViewChange: (view: PanelView) => void;
  mapId: string | null;
  map: NormalizedMap | null;
  marked: ReadonlySet<string>;
  activeTypes: ReadonlySet<string>;
  onSelectMap: (mapId: string) => void;
  onToggleType: (id: string) => void;
  onSetTypes: (ids: string[], active: boolean) => void;
  onResetTypes: () => void;
  onMarkType: (group: MapTypeGroup, found: boolean) => void;
  onLocate: (point: { x: number; y: number; key?: string; typeId?: string }) => void;
}) {
  const t = useTranslations("map");
  const tNav = useTranslations("nav");
  const { name, locale } = useMapLabels();
  const location = mapId ? getMapLocation(mapId) : undefined;
  const progress = map ? mapProgress(map, marked) : null;

  return (
    <div className="relative flex h-full flex-col border border-line/30 bg-ink/95 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-md">
      <DnaCornerBrackets size={14} className="z-20" />

      {/* En-tête : zone courante + changement de zone */}
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line/15 px-3">
        {/* Sortie de la carte : le logo ramène à l'accueil. Sans lui, la vue
            plein écran donnait l'impression d'être enfermé sur la page. */}
        <Link
          href="/"
          aria-label={tNav("home")}
          title={tNav("home")}
          className="group grid h-9 w-9 shrink-0 place-items-center border border-line/20 bg-ink-2/60 transition-colors hover:border-gold/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS_PATHS.logo} alt="" className="h-6 w-auto transition-transform duration-200 group-hover:scale-110" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* Vrai `h1` de la page : nom de la zone, préfixé du nom de la carte pour le référencement. */}
            <h1 className="truncate font-display text-[1.05rem] leading-tight text-parch">
              {location ? (
                <>
                  <span className="sr-only">{t("pageTitle")} – </span>
                  {name(location.map.name)}
                </>
              ) : (
                t("pageTitle")
              )}
            </h1>
            <button
              type="button"
              onClick={() => onViewChange(view === "regions" ? "filters" : "regions")}
              aria-expanded={view === "regions"}
              className={cn(
                "flex shrink-0 items-center gap-1 border px-1.5 py-0.5 font-sans text-[0.68rem] transition-colors",
                view === "regions"
                  ? "border-gold/60 bg-gold/15 text-gold-bright"
                  : "border-line/25 text-parch/75 hover:border-gold/50 hover:text-gold-bright",
              )}
            >
              <ArrowLeftRight className="h-3 w-3" aria-hidden />
              {t("changeRegion")}
            </button>
          </div>
          <p className="truncate font-sans text-[0.68rem] text-muted">
            {location && <>{name(location.nation.name)} · </>}
            {progress && t("exploration", { percent: formatPercent(percent(progress), locale) })}
          </p>
        </div>
        <SyncBadge status={syncStatus} />
        <button
          type="button"
          onClick={onCollapse}
          aria-label={t("closePanel")}
          className="grid h-8 w-8 shrink-0 place-items-center border border-line/25 text-parch/80 hover:text-gold-bright sm:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </header>

      {/* Ligne d'outils : recherche + liste « Marqué ». Masquée en mode recherche,
          qui porte son propre champ. */}
      {view !== "search" && (
        <div className="flex shrink-0 gap-2 px-2.5 py-2">
          <button
            type="button"
            onClick={() => onViewChange("search")}
            className="flex h-8 min-w-0 flex-1 items-center gap-2 border border-line/25 bg-ink-2/80 px-2.5 text-left font-sans text-[0.8rem] text-muted-2 transition-colors hover:border-gold/50"
          >
            <GlyphIcons.search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{t("searchPlaceholder")}</span>
          </button>
          <button
            type="button"
            onClick={() => onViewChange(view === "marked" ? "filters" : "marked")}
            aria-pressed={view === "marked"}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 border px-2.5 font-sans text-[0.78rem] transition-colors",
              view === "marked"
                ? "border-gold/60 bg-gold/15 text-gold-bright"
                : "border-line/25 bg-ink-2/80 text-parch/85 hover:border-gold/50",
            )}
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            {t("shownList")}
            <span className="font-mono text-[0.65rem] text-gold/80">
              {map ? map.types.filter((g) => activeTypes.has(g.id)).length : 0}
            </span>
          </button>
        </div>
      )}

      {/* Titre de sous-vue, avec retour */}
      {(view === "regions" || view === "marked") && (
        <div className="flex shrink-0 items-center justify-between border-y border-line/10 bg-ink-2/40 px-3 py-1.5">
          <h2 className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold/85">
            {view === "regions" ? t("selectRegion") : t("shownList")}
          </h2>
          <button type="button" onClick={() => onViewChange("filters")} aria-label={t("close")} className="text-muted hover:text-parch">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={map ? view : "loading"}
        className="flex min-h-0 flex-1 flex-col"
        initial={{ opacity: 0, x: view === "filters" ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: view === "filters" ? 10 : -10 }}
        transition={{ duration: 0.16, ease: MAP_EASE }}
      >
      {view === "regions" ? (
        <RegionSwitcher
          currentMapId={mapId}
          marked={marked}
          onSelect={(id) => {
            onSelectMap(id);
            onViewChange("filters");
          }}
        />
      ) : !map ? (
        // Avant le chargement de la carte (et donc dans le HTML serveur) : le texte et les liens de région.
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <MapSeoFooter />
        </div>
      ) : view === "search" ? (
        <SearchView
          map={map}
          marked={marked}
          activeTypes={activeTypes}
          onToggleType={onToggleType}
          onClose={() => onViewChange("filters")}
          onLocate={onLocate}
        />
      ) : view === "marked" ? (
        <MarkedView map={map} marked={marked} activeTypes={activeTypes} onToggleType={onToggleType} onMarkType={onMarkType} />
      ) : (
        <FiltersView map={map} marked={marked} activeTypes={activeTypes} onToggleType={onToggleType} onSetCategory={onSetTypes} onLocate={onLocate} />
      )}
      </motion.div>
      </AnimatePresence>

      {view === "filters" && (
        <footer className="shrink-0 border-t border-line/15 p-2">
          <button
            type="button"
            onClick={onResetTypes}
            className="flex h-8 w-full items-center justify-center gap-2 border border-gold/40 bg-gold/10 font-sans text-[0.8rem] text-gold-bright transition-colors hover:bg-gold/20"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {t("resetShownTypes")}
          </button>
        </footer>
      )}
    </div>
  );
}

/**
 * État de la sauvegarde de la progression. Anonyme : lien de connexion, la
 * progression ne vit alors que dans ce navigateur.
 */
function SyncBadge({ status }: { status: SyncStatus }) {
  const t = useTranslations("map");
  if (status === "anonymous")
    return (
      <Link
        href="/login"
        title={t("syncAnonymous")}
        className="flex shrink-0 items-center gap-1 border border-line/20 px-1.5 py-1 font-sans text-[0.65rem] text-muted transition-colors hover:border-gold/50 hover:text-gold-bright"
      >
        <CloudOff className="h-3.5 w-3.5" aria-hidden />
        {t("syncSignIn")}
      </Link>
    );
  const busy = status === "loading" || status === "saving";
  const label = busy ? t("syncSaving") : status === "error" ? t("syncError") : t("syncSynced");
  return (
    <span role="status" title={label} aria-label={label} className="grid h-7 w-7 shrink-0 place-items-center">
      {busy ? (
        <LoaderCircle className="h-4 w-4 animate-spin text-muted" aria-hidden />
      ) : status === "error" ? (
        <CloudOff className="h-4 w-4 text-crimson-soft" aria-hidden />
      ) : (
        <Cloud className="h-4 w-4 text-ok" aria-hidden />
      )}
    </span>
  );
}
