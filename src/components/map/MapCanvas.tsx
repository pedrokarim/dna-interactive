"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { ImageOverlay, MapContainer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { CRS, DivIcon, DomEvent, type LatLngBoundsExpression, type LatLngTuple, type Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, Minus, Plus } from "lucide-react";
import ImageZoomModal from "@/components/ImageZoomModal";
import { cn, DnaCornerBrackets } from "@/components/dna";
import { captureAnalytics } from "@/lib/analytics";
import { flyToAtom, refitAtom, type MapSettings } from "@/lib/map/state";
import type { MapPlace, MapPoint, MapTypeGroup, NormalizedMap } from "@/lib/map/taxonomy";
import { PersonalLayer } from "./PersonalLayer";
import { RouteLayer } from "./RouteLayer";
import { useMapLabels } from "./useMapLabels";

const MIN_ZOOM = -2.5;
const MAX_ZOOM = 3;
const SIZES = { s: 26, m: 32, l: 38 } as const;

// Cache des icônes : une instance par (icône, état, taille), partagée par tous
// les points du même type. Au basculement « trouvé », seul le point concerné
// change d'icône.
const iconCache = new Map<string, DivIcon>();
function markerIcon(src: string, found: boolean, size: number): DivIcon {
  const key = `${src}|${found}|${size}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const img = Math.round(size * 0.62);
  const html =
    `<span class="dna-pin${found ? " is-found" : ""}" style="--pin:${size}px">` +
    `<img src="${src}" alt="" draggable="false" style="width:${img}px;height:${img}px" onerror="this.style.visibility='hidden'"/>` +
    (found ? `<span class="dna-pin-check"></span>` : "") +
    `</span>`;
  const icon = new DivIcon({
    html,
    className: "dna-marker",
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -(size + 4)],
  });
  iconCache.set(key, icon);
  return icon;
}

const placeIconCache = new Map<string, DivIcon>();
function placeIcon(title: string, linked: boolean): DivIcon {
  const key = `${title}|${linked}`;
  const cached = placeIconCache.get(key);
  if (cached) return cached;
  const safe = title.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const icon = new DivIcon({
    html: `<span class="dna-place${linked ? " is-linked" : ""}">${safe}</span>`,
    className: "dna-place-wrap",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
  placeIconCache.set(key, icon);
  return icon;
}

export interface CanvasProps {
  map: NormalizedMap;
  activeTypes: ReadonlySet<string>;
  marked: ReadonlySet<string>;
  settings: MapSettings;
  onToggleFound: (key: string) => void;
  onSelectMap: (mapId: string) => void;
  /** Décalage à gauche occupé par le panneau, pour centrer dans la zone libre. */
  leftInset: number;
  /** Mode pose d'un marqueur personnel. */
  placing: boolean;
  onPlaced: () => void;
}

export default function MapCanvas(props: CanvasProps) {
  const { map } = props;
  const bounds: LatLngBoundsExpression = [
    [0, 0],
    [map.imageSize.height, map.imageSize.width],
  ];
  return (
    <MapContainer
      // Nouvelle instance par carte : le cadrage, les limites et la vue repartent à neuf.
      key={map.id}
      crs={CRS.Simple}
      center={[map.imageSize.height / 2, map.imageSize.width / 2]}
      zoom={MIN_ZOOM}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      zoomSnap={0.25}
      zoomDelta={0.5}
      wheelPxPerZoomLevel={90}
      maxBounds={bounds}
      maxBoundsViscosity={1}
      zoomControl={false}
      // Pas de mention « Leaflet » en bas de carte : l'image est la nôtre et
      // la bibliothèque est créditée dans les mentions du site.
      attributionControl={false}
      className="h-full w-full"
    >
      <ImageOverlay url={map.image} bounds={bounds} />
      <FitToFreeArea bounds={bounds} leftInset={props.leftInset} />
      <RouteLayer height={map.imageSize.height} leftInset={props.leftInset} />
      <MapLayers {...props} />
      <PersonalLayer mapId={map.id} height={map.imageSize.height} placing={props.placing} onPlaced={props.onPlaced} />
      <ZoomRail />
    </MapContainer>
  );
}

function MapLayers({ map, activeTypes, marked, settings, onToggleFound, onSelectMap, leftInset }: CanvasProps) {
  const leaflet = useMap();
  const flyTo = useAtomValue(flyToAtom);
  const markerRefs = useRef(new Map<string, LeafletMarker>());
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const height = map.imageSize.height;
  const toLatLng = (x: number, y: number): LatLngTuple => [height - y, x];

  // Centrage demandé depuis la recherche / la liste : on vole jusqu'au point en
  // tenant compte du panneau, puis on ouvre sa popup si le point est affiché.
  useEffect(() => {
    if (!flyTo) return;
    const target = toLatLng(flyTo.x, flyTo.y);
    const zoom = Math.max(leaflet.getZoom(), 0.5);
    const inset = usableInset(leaflet.getSize().x, leftInset);
    const shifted = leaflet.unproject(leaflet.project(target, zoom).subtract([inset / 2, 0]), zoom);
    leaflet.flyTo(shifted, zoom, { duration: 0.6 });
    const open = () => {
      if (flyTo.key) markerRefs.current.get(flyTo.key)?.openPopup();
    };
    leaflet.once("moveend", open);
    return () => {
      leaflet.off("moveend", open);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seul le nonce déclenche
  }, [flyTo?.nonce]);

  const size = SIZES[settings.markerSize];
  const visible = useMemo(() => map.types.filter((g) => activeTypes.has(g.id)), [map, activeTypes]);

  return (
    <>
      {visible.map((group) =>
        group.points.map((point) => {
          const found = marked.has(point.key);
          if (found && settings.hideFound) return null;
          return (
            <PointMarker
              key={point.key}
              group={group}
              point={point}
              found={found}
              size={size}
              position={toLatLng(point.x, point.y)}
              mapId={map.id}
              onToggleFound={onToggleFound}
              onZoomImage={setZoomedImage}
              markerRefs={markerRefs}
            />
          );
        }),
      )}
      {settings.showPlaces &&
        map.places.map((place, i) => (
          <PlaceLabel key={`${place.title}-${i}`} place={place} position={toLatLng(place.x, place.y)} onSelectMap={onSelectMap} />
        ))}
      <ImageZoomModal imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />
    </>
  );
}

const PointMarker = memo(function PointMarker({
  group,
  point,
  found,
  size,
  position,
  mapId,
  onToggleFound,
  onZoomImage,
  markerRefs,
}: {
  group: MapTypeGroup;
  point: MapPoint;
  found: boolean;
  size: number;
  position: LatLngTuple;
  mapId: string;
  onToggleFound: (key: string) => void;
  onZoomImage: (src: string) => void;
  markerRefs: React.RefObject<Map<string, LeafletMarker>>;
}) {
  const t = useTranslations("map");
  const { typeName, categoryName } = useMapLabels();
  const name = typeName(group);

  return (
    <Marker
      ref={(m) => {
        if (m) markerRefs.current.set(point.key, m);
        else markerRefs.current.delete(point.key);
      }}
      position={position}
      icon={markerIcon(group.icon, found, size)}
      title={point.title ?? name}
      eventHandlers={{
        // Clic droit = trouvé / pas trouvé, sans ouvrir la popup (comme HoYoLAB).
        contextmenu: (e) => {
          DomEvent.preventDefault(e.originalEvent);
          if (group.tracked) onToggleFound(point.key);
        },
        popupopen: () => captureAnalytics("map_marker_opened", { map: mapId, category: group.id }),
      }}
    >
      <Popup minWidth={280} maxWidth={320}>
        <div className="relative w-[300px] border border-line/30 bg-ink/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <DnaCornerBrackets size={12} />
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center border border-line/30 bg-ink-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={group.icon} alt="" className="max-h-[80%] max-w-[80%] object-contain" />
            </span>
            <div className="min-w-0">
              <p className="font-caps text-[0.5rem] uppercase tracking-[0.24em] text-gold/70">{categoryName(group.category)}</p>
              <h3 className="font-display text-[1rem] leading-tight text-parch">{point.title ?? name}</h3>
              {point.title && <p className="truncate font-sans text-[0.72rem] text-muted">{name}</p>}
            </div>
          </div>

          {point.image && (
            <button
              type="button"
              onClick={() => onZoomImage(point.image!)}
              className="mt-3 block w-full cursor-zoom-in overflow-hidden border border-line/25 bg-ink-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={point.image}
                alt={t("pointImageAlt", { name: point.title ?? name })}
                loading="lazy"
                className="max-h-48 w-full object-contain"
              />
            </button>
          )}

          {group.tracked && (
            <button
              type="button"
              onClick={() => onToggleFound(point.key)}
              className={cn(
                "mt-3 flex h-8 w-full items-center justify-center gap-2 border font-sans text-[0.8rem] transition-colors",
                found
                  ? "border-ok/50 bg-ok/10 text-ok hover:bg-ok/20"
                  : "border-gold/50 bg-gold/10 text-gold-bright hover:bg-gold/20",
              )}
            >
              {found && <Check className="h-3.5 w-3.5" aria-hidden />}
              {found ? t("foundUndo") : t("markFound")}
            </button>
          )}
          {group.tracked && <p className="mt-1.5 text-center font-sans text-[0.62rem] text-muted-2">{t("rightClickHint")}</p>}
        </div>
      </Popup>
    </Marker>
  );
});

function PlaceLabel({ place, position, onSelectMap }: { place: MapPlace; position: LatLngTuple; onSelectMap: (id: string) => void }) {
  const { name } = useMapLabels();
  return (
    <Marker
      position={position}
      icon={placeIcon(place.name ? name(place.name) : place.title, Boolean(place.targetMapId))}
      interactive={Boolean(place.targetMapId)}
      keyboard={false}
      eventHandlers={place.targetMapId ? { click: () => onSelectMap(place.targetMapId!) } : undefined}
    />
  );
}

/**
 * Largeur réellement réservée au panneau. Sur mobile, le panneau ouvert couvre
 * tout l'écran : réserver sa place ne laisserait aucune zone utile (et donnait
 * un cadrage au zoom maximal) — on cadre alors sur l'écran entier.
 */
function usableInset(containerWidth: number, leftInset: number): number {
  return containerWidth - leftInset >= 320 ? leftInset : 0;
}

/**
 * Cadrage initial : la carte entière dans la zone laissée libre par le panneau,
 * et pas de dézoom au-delà (on ne gagne rien à voir la carte en timbre-poste).
 */
function FitToFreeArea({ bounds, leftInset }: { bounds: LatLngBoundsExpression; leftInset: number }) {
  const leaflet = useMap();
  const refit = useAtomValue(refitAtom);
  const first = useRef(true);
  useEffect(() => {
    const inset = usableInset(leaflet.getSize().x, leftInset);
    const options = { paddingTopLeft: [inset + 24, 24] as [number, number], paddingBottomRight: [72, 24] as [number, number] };
    if (first.current) {
      first.current = false;
      leaflet.fitBounds(bounds, { ...options, animate: false });
      leaflet.setMinZoom(Math.min(leaflet.getZoom() - 0.5, 0));
    } else {
      // Bouton « recentrer » : même cadrage, animé.
      leaflet.flyToBounds(bounds, { ...options, duration: 0.5 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- au montage (un conteneur par carte), puis à chaque demande
  }, [refit]);
  return null;
}

/** Zoom vertical façon HoYoLAB : +, glissière, –. */
function ZoomRail() {
  const t = useTranslations("map");
  const leaflet = useMap();
  const [zoom, setZoom] = useState(leaflet.getZoom());
  const [minZoom, setMinZoom] = useState(leaflet.getMinZoom());
  const ref = useRef<HTMLDivElement>(null);
  useMapEvents({
    zoomend: () => {
      setZoom(leaflet.getZoom());
      setMinZoom(leaflet.getMinZoom());
    },
  });

  useEffect(() => {
    if (!ref.current) return;
    DomEvent.disableClickPropagation(ref.current);
    DomEvent.disableScrollPropagation(ref.current);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute bottom-6 right-4 z-[1000] flex flex-col items-center gap-1 border border-line/25 bg-ink/85 py-1.5 backdrop-blur-sm"
    >
      <button type="button" onClick={() => leaflet.zoomIn(0.5)} aria-label={t("zoomIn")} className="grid h-7 w-8 place-items-center text-parch/80 hover:text-gold">
        <Plus className="h-4 w-4" />
      </button>
      <input
        type="range"
        min={minZoom}
        max={MAX_ZOOM}
        step={0.25}
        value={zoom}
        onChange={(e) => leaflet.setZoom(Number(e.target.value))}
        aria-label={t("zoom")}
        className="dna-zoom-range h-28 w-8"
      />
      <button type="button" onClick={() => leaflet.zoomOut(0.5)} aria-label={t("zoomOut")} className="grid h-7 w-8 place-items-center text-parch/80 hover:text-gold">
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}
