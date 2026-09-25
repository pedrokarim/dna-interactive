"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useAtom, useSetAtom } from "jotai";
import { parseAsString, useQueryState } from "nuqs";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, House, Route } from "lucide-react";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import { Link } from "@/i18n/navigation";
import Loading from "@/components/Loading";
import ExportModal from "@/components/ExportModal";
import ImportModal from "@/components/ImportModal";
import MapInfoModal from "@/components/MapInfoModal";
import ChangelogModal from "@/components/ChangelogModal";
import { cn, useConfirm } from "@/components/dna";
import { useMapData } from "@/hooks/useMapData";
import { markedMarkersAtom, toggleMarkerMarkedAtom } from "@/lib/store";
import {
  DEFAULT_ACTIVE_TYPES,
  activeTypesAtom,
  flyToAtom,
  mapSettingsAtom,
  panelCollapsedAtom,
} from "@/lib/map/state";
import { normalizeMap, type MapTypeGroup } from "@/lib/map/taxonomy";
import { ORDERED_MAP_IDS, getMapLocation } from "@/lib/map/world";
import { ActiveTypesRail, MAP_EASE } from "./ActiveTypesRail";
import { MapPanel, type PanelView } from "./MapPanel";
import { MapToolbar, ToolButton, type ToolbarAction } from "./MapToolbar";
import { PersonalEditor } from "./PersonalEditor";
import { RoutesPanel } from "./RoutesPanel";
import { drawingAtom } from "@/lib/map/routes";
import { useProgressSync } from "./useProgressSync";

function CanvasFallback() {
  const t = useTranslations("map");
  return (
    <div className="h-full w-full bg-ink">
      <Loading mode="box" message={t("loadingMap")} size={48} />
    </div>
  );
}

const MapCanvas = dynamic(() => import("./MapCanvas"), { ssr: false, loading: () => <CanvasFallback /> });

const PANEL_WIDTH = 380;
const EDGE = 16;
const LAST_MAP_KEY = "selected-map";

export default function InteractiveMap() {
  const t = useTranslations("map");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const { confirm, alert } = useConfirm();

  // Carte courante : `?mapId=` fait foi (liens des pages de région), puis la
  // dernière carte ouverte, puis la première du monde.
  const [urlMapId, setUrlMapId] = useQueryState("mapId", parseAsString);
  const [fallbackMapId, setFallbackMapId] = useState<string | null>(null);
  useEffect(() => {
    if (urlMapId) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LAST_MAP_KEY);
    } catch {}
    setFallbackMapId(stored && getMapLocation(stored) ? stored : ORDERED_MAP_IDS[0]);
  }, [urlMapId]);
  const mapId = urlMapId && getMapLocation(urlMapId) ? urlMapId : fallbackMapId;

  const selectMap = useCallback(
    (id: string) => {
      void setUrlMapId(id);
      try {
        localStorage.setItem(LAST_MAP_KEY, id);
      } catch {}
    },
    [setUrlMapId],
  );

  const { selectedMap } = useMapData(mapId);
  const map = useMemo(() => (selectedMap ? normalizeMap(selectedMap) : null), [selectedMap]);

  const [marked, setMarked] = useAtom(markedMarkersAtom);
  const toggleFound = useSetAtom(toggleMarkerMarkedAtom);
  const [activeList, setActiveList] = useAtom(activeTypesAtom);
  const activeTypes = useMemo(() => new Set(activeList), [activeList]);
  const [settings] = useAtom(mapSettingsAtom);
  const [collapsed, setCollapsed] = useAtom(panelCollapsedAtom);
  const setFlyTo = useSetAtom(flyToAtom);
  const [view, setView] = useState<PanelView>("filters");
  const [modal, setModal] = useState<ToolbarAction | null>(null);
  const [placing, setPlacing] = useState(false);
  // Lien partagé vers un itinéraire : `?mapId=…&route=<id>` ouvre le panneau et le cadre.
  const [urlRouteId] = useQueryState("route", parseAsString);
  const [routesOpen, setRoutesOpen] = useState(false);
  useEffect(() => {
    if (urlRouteId) setRoutesOpen(true);
  }, [urlRouteId]);
  const setDrawing = useSetAtom(drawingAtom);

  // Changer de carte abandonne un tracé en cours : il n'aurait plus de sens.
  useEffect(() => setDrawing(null), [mapId, setDrawing]);
  const syncStatus = useProgressSync();

  // Échap annule la pose d'un marqueur.
  useEffect(() => {
    if (!placing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPlacing(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [placing]);

  const toggleType = useCallback(
    (id: string) => setActiveList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setActiveList],
  );
  const setTypes = useCallback(
    (ids: string[], on: boolean) =>
      setActiveList((prev) => (on ? [...new Set([...prev, ...ids])] : prev.filter((x) => !ids.includes(x)))),
    [setActiveList],
  );

  const markType = useCallback(
    (group: MapTypeGroup, found: boolean) => {
      const next = new Set(marked);
      for (const p of group.points) {
        if (found) next.add(p.key);
        else next.delete(p.key);
      }
      setMarked(next);
    },
    [marked, setMarked],
  );

  const locate = useCallback(
    (point: { x: number; y: number; key?: string; typeId?: string }) => {
      if (point.typeId && !activeTypes.has(point.typeId)) setTypes([point.typeId], true);
      // Sur mobile le panneau couvre la carte : on le replie pour montrer le point.
      if (window.matchMedia("(max-width: 639px)").matches) setCollapsed(true);
      setFlyTo({ x: point.x, y: point.y, key: point.key, nonce: Date.now() });
    },
    [activeTypes, setTypes, setFlyTo, setCollapsed],
  );

  const onAction = async (action: ToolbarAction) => {
    if (action !== "resetProgress") return setModal(action);
    const ok = await confirm({
      title: t("resetAllMarkers"),
      message: t("resetAllMarkersConfirm"),
      confirmLabel: t("resetAllMarkersAction"),
      cancelLabel: tCommon("cancel"),
      danger: true,
    });
    if (ok) setMarked(new Set());
  };

  const exportMarkers = (format: "json" | "csv") => {
    const keys = [...marked];
    const [body, mime] =
      format === "json"
        ? [JSON.stringify({ markers: keys }, null, 2), "application/json"]
        : [["marker_id", ...keys].join("\n"), "text/csv"];
    const url = URL.createObjectURL(new Blob([body], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `dna-map-progress-${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMarkers = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data?.markers)) throw new Error("format");
        // Les très anciens exports portaient des clés `undefined-…`, sans carte :
        // impossibles à rattacher, on les ignore.
        const keys = (data.markers as unknown[]).filter(
          (k): k is string => typeof k === "string" && !k.startsWith("undefined-"),
        );
        setMarked(new Set([...marked, ...keys]));
        void alert({
          message: t("importSuccess", { imported: keys.length, ignored: data.markers.length - keys.length }),
          confirmLabel: tCommon("close"),
        });
      } catch {
        void alert({ message: t("importInvalidFormat"), confirmLabel: tCommon("close") });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="map-page relative h-dvh w-screen overflow-hidden bg-ink">
      <div className="absolute inset-0 z-0">
        {map ? (
          <MapCanvas
            map={map}
            activeTypes={activeTypes}
            marked={marked}
            settings={settings}
            onToggleFound={toggleFound}
            onSelectMap={selectMap}
            leftInset={collapsed ? 0 : PANEL_WIDTH + EDGE}
            placing={placing}
            onPlaced={() => setPlacing(false)}
          />
        ) : (
          <CanvasFallback />
        )}
      </div>

      {/* Panneau + rail des types affichés */}
      {/* Au-dessus de la colonne d'outils : sur mobile, le panneau ouvert prend toute la largeur. */}
      <div className="pointer-events-none absolute bottom-4 left-4 top-4 z-[1150] flex gap-2">
        {/* Le panneau glisse depuis la gauche ; la colonne voisine (repli + rail)
            suit le mouvement grâce à `layout`, au lieu de sauter d'un coup. */}
        <AnimatePresence initial={false} mode="popLayout">
        {!collapsed && (
          <motion.aside
            key="panel"
            aria-label={t("filtersPanel")}
            className="pointer-events-auto h-full"
            style={{ width: `min(${PANEL_WIDTH}px, calc(100vw - 32px))` }}
            initial={{ x: -32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -32, opacity: 0 }}
            transition={{ duration: 0.26, ease: MAP_EASE }}
          >
            <MapPanel
              view={view}
              onViewChange={setView}
              mapId={mapId}
              map={map}
              marked={marked}
              activeTypes={activeTypes}
              onSelectMap={selectMap}
              onToggleType={toggleType}
              onSetTypes={setTypes}
              onResetTypes={() => setActiveList(DEFAULT_ACTIVE_TYPES)}
              onMarkType={markType}
              onLocate={locate}
              syncStatus={syncStatus}
              onCollapse={() => setCollapsed(true)}
            />
          </motion.aside>
        )}
        </AnimatePresence>
        <motion.div
          layout="position"
          transition={{ duration: 0.26, ease: MAP_EASE }}
          className={cn("flex min-h-0 flex-col items-start gap-2", !collapsed && "max-sm:hidden")}
        >
          {/* Panneau replié : son logo n'est plus visible, on garde une sortie vers l'accueil. */}
          <AnimatePresence initial={false}>
            {collapsed && (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18, ease: MAP_EASE }}
              >
                <Link
                  href="/"
                  aria-label={tNav("home")}
                  title={tNav("home")}
                  className="pointer-events-auto grid h-11 w-11 place-items-center border border-line/25 bg-ink/85 text-parch/85 backdrop-blur-sm transition-colors hover:border-gold/50 hover:text-gold-bright"
                >
                  <House className="h-[18px] w-[18px]" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? t("openPanel") : t("closePanel")}
            aria-expanded={!collapsed}
            className="pointer-events-auto grid h-11 w-11 place-items-center border border-line/25 bg-ink/85 text-parch/85 backdrop-blur-sm transition-colors hover:border-gold/50 hover:text-gold-bright"
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.26, ease: MAP_EASE }}
              className="grid place-items-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.span>
          </button>
          {map && (
            <div className="flex min-h-0 flex-1 flex-col">
              <ActiveTypesRail map={map} activeTypes={activeTypes} onRemove={toggleType} />
            </div>
          )}
        </motion.div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-[1100]">
        <MapToolbar
          onAction={onAction}
          extra={
            <>
              <ToolButton label={t("addPersonalMarker")} active={placing} onClick={() => setPlacing((p) => !p)}>
                <GlyphIcons.pin className="h-[18px] w-[18px]" />
              </ToolButton>
              <ToolButton label={t("routes")} active={routesOpen} onClick={() => setRoutesOpen((o) => !o)}>
                <Route className="h-[18px] w-[18px]" />
              </ToolButton>
            </>
          }
        />
      </div>

      {/* Fiche d'édition d'un marqueur personnel, à gauche de la colonne d'outils. */}
      <div className="pointer-events-none absolute right-[4.25rem] top-4 z-[1100] flex flex-col items-end gap-2">
        <PersonalEditor />
        <AnimatePresence>
          {routesOpen && map && (
            <FloatIn key="routes">
              <RoutesPanel
                map={map}
                initialRouteId={urlRouteId}
                onClose={() => {
                  setRoutesOpen(false);
                  setDrawing(null);
                }}
              />
            </FloatIn>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {placing && (
          <motion.div
            key="placing"
            role="status"
            className="pointer-events-none absolute left-1/2 top-4 z-[1100] border border-gold/50 bg-ink/90 px-4 py-2 font-sans text-[0.82rem] text-gold-bright backdrop-blur-sm"
            initial={{ opacity: 0, y: -12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -12, x: "-50%" }}
            transition={{ duration: 0.2, ease: MAP_EASE }}
          >
            {t("placingHint")}
          </motion.div>
        )}
      </AnimatePresence>

      <ExportModal isOpen={modal === "export"} onClose={() => setModal(null)} onExport={exportMarkers} markerCount={marked.size} />
      <ImportModal isOpen={modal === "import"} onClose={() => setModal(null)} onImport={importMarkers} />
      <MapInfoModal isOpen={modal === "info"} onClose={() => setModal(null)} selectedMapId={mapId} />
      <ChangelogModal isOpen={modal === "changelog"} onClose={() => setModal(null)} />
    </div>
  );
}

/** Entrée des volets flottants de droite : glissent depuis la colonne d'outils. */
export function FloatIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.22, ease: MAP_EASE }}
    >
      {children}
    </motion.div>
  );
}
