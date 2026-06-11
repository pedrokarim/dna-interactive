"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { CRS, DivIcon, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import Loading from "@/components/Loading";
import ImageZoomModal from "@/components/ImageZoomModal";
import { cn, DnaCornerBrackets } from "@/components/dna";

// Cache global des icônes (DivIcon synchrones, par URL + état trouvé/non trouvé).
// On utilise des DivIcon (HTML+CSS) au lieu d'un canvas->toDataURL asynchrone :
//  - création SYNCHRONE -> plus d'attente bloquante de toutes les images avant
//    d'afficher le moindre marqueur (les <img> se chargent en flux dans le DOM) ;
//  - même instance réutilisée pour tous les marqueurs d'une même icône/état
//    -> au clic (marqué/non marqué) seul le marqueur concerné est mis à jour.
const iconCache = new Map<string, DivIcon>();

const getMarkerIcon = (iconUrl: string, isFound: boolean): DivIcon => {
  const cacheKey = `${iconUrl}-${isFound}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  // Palette design system DNA : médaillon ink sombre, anneau or laiton (non vu)
  // ou cramoisi (vu), liseré interne + halo doux teinté.
  const src = iconUrl || "/marker-default.png";
  const ring = isFound ? "#ef4444" : "#c2a86a"; // crimson-bright / gold
  const ringHi = isFound ? "#f87171" : "#e3cd95";
  const glow = isFound ? "rgba(239,68,68,0.6)" : "rgba(194,168,106,0.45)";
  const fill = isFound
    ? "radial-gradient(circle at 50% 32%, rgba(96,20,20,0.96), rgba(20,8,8,0.97))"
    : "radial-gradient(circle at 50% 32%, rgba(46,38,24,0.96), rgba(13,11,8,0.97))";

  const html =
    `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;` +
    `border-radius:50%;background:${fill};border:1.5px solid ${ring};` +
    `box-shadow:inset 0 0 0 1px rgba(0,0,0,0.55),inset 0 1px 1px ${ringHi}45,` +
    `0 1px 3px rgba(0,0,0,0.6),0 0 9px -1px ${glow}">` +
    `<img src="${src}" alt="" draggable="false" ` +
    `style="width:20px;height:20px;object-fit:contain;pointer-events:none;` +
    `filter:drop-shadow(0 1px 1px rgba(0,0,0,0.7))${isFound ? ";opacity:0.82" : ""}" ` +
    `onerror="this.style.visibility='hidden'"/></span>`;

  const icon = new DivIcon({
    html,
    className: "dna-marker", // remplace .leaflet-div-icon (pas de cadre blanc par défaut)
    iconSize: [32, 32],
    iconAnchor: [16, 32], // ancrage bas-centre, identique à l'ancien
    popupAnchor: [0, -32],
  });

  iconCache.set(cacheKey, icon);
  return icon;
};

// Types
interface MapData {
  id: string;
  name: string;
  image: string;
  imageSize: { width: number; height: number };
  legend: any[];
}

interface MarkerInstance {
  id: number;
  position: { x: number; y: number };
}

interface MarkerData {
  id: number;
  name: string;
  icon: string;
  markers: MarkerInstance[];
}

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  markers: MarkerData[];
}

interface MapComponentProps {
  selectedMap: MapData | null;
  visibleCategories?: Record<string, boolean>;
  markedMarkers?: Set<string>;
  onToggleMarker?: (markerKey: string) => void;
  hideFoundMarkers?: boolean;
  isSidebarOpen?: boolean;
  sidebarWidth?: number;
}

function MapController({
  bounds,
}: {
  bounds: [[number, number], [number, number]];
}) {
  const map = useMap();

  useEffect(() => {
    if (map && bounds) {
      // Ne pas forcer fitBounds au chargement, laisser le zoom initial défini dans MapContainer
      // map.fitBounds(bounds, { animate: false });
    }
  }, [map, bounds]);

  return null;
}

function ImageOverlayWrapper({
  url,
  bounds,
}: {
  url: string;
  bounds: [[number, number], [number, number]];
}) {
  const map = useMap();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (map) {
      // Attendre que le conteneur DOM de la carte soit prêt
      const checkReady = () => {
        try {
          const container = map.getContainer();
          // Vérifier que le conteneur existe et a été initialisé par Leaflet
          if (container && container.querySelector(".leaflet-pane")) {
            setIsReady(true);
          } else {
            // Réessayer au prochain cycle
            setTimeout(checkReady, 10);
          }
        } catch (error) {
          // Si erreur, réessayer
          setTimeout(checkReady, 10);
        }
      };

      // Attendre un cycle pour que la carte soit montée
      const timer = setTimeout(checkReady, 0);
      return () => clearTimeout(timer);
    }
  }, [map]);

  if (!isReady) {
    return null;
  }

  return <ImageOverlay url={url} bounds={bounds} />;
}

export default function MapComponent({
  selectedMap,
  visibleCategories = {},
  markedMarkers = new Set(),
  onToggleMarker,
  hideFoundMarkers = false,
  isSidebarOpen = true,
  sidebarWidth = 320,
}: MapComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [markers, setMarkers] = useState<React.JSX.Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Données structurelles des marqueurs (positions STABLES entre rendus) :
  // ne dépend que de la carte + des catégories visibles, PAS de l'état trouvé.
  // -> cliquer un marqueur ne recalcule pas les positions de tous les autres.
  const markerData = useMemo(() => {
    const out: Array<{
      position: LatLngTuple;
      key: string;
      iconUrl: string;
      category: any;
      marker: any;
      instance: any;
    }> = [];

    if (!selectedMap?.legend) return out;

    for (const category of selectedMap.legend) {
      if (!category.markers) continue;
      for (const marker of category.markers) {
        const subCategoryKey = marker.name.toLowerCase().trim();
        if (visibleCategories[subCategoryKey] === false) continue;
        if (!marker.markers) continue;
        for (const instance of marker.markers) {
          out.push({
            // Y inversé car Leaflet a Y=0 en haut
            position: [
              selectedMap.imageSize.height - instance.position.y,
              instance.position.x,
            ],
            // selectedMap.id + category.type pour éviter les collisions de clé
            key: `${selectedMap.id}-${category.type}-${marker.id}-${instance.id}`,
            iconUrl: marker.icon,
            category,
            marker,
            instance,
          });
        }
      }
    }

    return out;
  }, [selectedMap, visibleCategories]);

  useEffect(() => {
    if (!selectedMap) return;

    const loadMarkers = () => {
      setLoading(true);

      // Construire les marqueurs depuis les données structurelles mémoïsées
      // (positions stables). L'état trouvé/non-trouvé est appliqué ici : seul le
      // marqueur basculé change d'icône/opacité, les autres gardent leurs refs.
      const newMarkers: React.JSX.Element[] = [];

      for (const data of markerData) {
        const isMarked = markedMarkers.has(data.key);

        // Ne pas afficher les marqueurs trouvés si l'option est activée
        if (hideFoundMarkers && isMarked) {
          continue;
        }

        const customIcon = getMarkerIcon(data.iconUrl, isMarked);

        newMarkers.push(
          <Marker
            key={data.key}
            position={data.position}
            icon={customIcon}
            opacity={isMarked ? 0.9 : 1}
          >
            <Popup>
              {/* Cadre du marqueur — design system DNA (coins nets, liseré or,
                  équerres ornementales). Les pins eux-mêmes ne sont pas touchés. */}
              <div className="relative min-w-[320px] border border-line/30 bg-ink/95 p-4 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                <DnaCornerBrackets size={14} />

                {/* En-tête : catégorie */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-line/30 bg-white/5">
                    <img
                      src={data.category.icon}
                      alt={`Icône ${data.category.name} - Catégorie de marqueurs sur la carte interactive Duet Night Abyss`}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-caps text-[0.52rem] uppercase tracking-[0.28em] text-gold/70">
                      Catégorie
                    </div>
                    <h3 className="truncate font-display text-lg leading-tight text-parch">
                      {data.category.name}
                    </h3>
                  </div>
                </div>

                <div className="mb-3 h-px bg-gradient-to-r from-line/30 to-transparent" />

                {/* Marqueur */}
                <div className="mb-3 flex items-center gap-3 border border-line/20 bg-panel/50 p-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-line/30 bg-white/5">
                    <img
                      src={data.marker.icon}
                      alt={`Icône ${data.marker.name} - Marqueur sur la carte interactive Duet Night Abyss`}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <p className="font-sans text-sm font-medium text-parch">
                    {data.marker.name}
                  </p>
                </div>

                {/* Position — ligne d'attribut (puce losange) */}
                <div className="mb-3 flex items-center justify-between border-b border-white/10 py-2 font-sans text-[0.84rem]">
                  <span className="flex items-center gap-2 text-muted">
                    <span className="h-1.5 w-1.5 rotate-45 bg-gold-deep" />
                    Position
                  </span>
                  <span className="tabular-nums text-parch">
                    {data.instance.position.x}, {data.instance.position.y}
                  </span>
                </div>

                {data.instance.image && (
                  <div className="mb-3 overflow-hidden border border-line/25 bg-panel/50">
                    <img
                      src={data.instance.image}
                      alt={`Guide visuel ${data.marker.name} - Localisation sur la carte interactive Duet Night Abyss`}
                      className="h-auto max-h-64 w-full cursor-zoom-in object-contain transition-opacity hover:opacity-90"
                      onClick={() => setZoomedImage(data.instance.image!)}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <p className="px-2 py-1 text-center font-caps text-[0.5rem] uppercase tracking-[0.18em] text-muted-2">
                      Cliquez pour agrandir
                    </p>
                  </div>
                )}

                {/* Action — bouton DS (or = non vu, cramoisi = vu) */}
                <button
                  onClick={() => onToggleMarker?.(data.key)}
                  className={cn(
                    "dna-shine inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 font-sans text-sm tracking-wide transition-all duration-200",
                    isMarked
                      ? "border border-crimson-bright bg-gradient-to-b from-crimson/40 to-ink/70 text-[#ffb3a6] hover:-translate-y-px hover:border-crimson-bright hover:text-[#ffd2c8]"
                      : "border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 text-gold-bright shadow-[inset_0_1px_0_rgba(227,205,149,0.22)] hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]",
                  )}
                >
                  {isMarked ? "Marquer comme non-vu" : "Marquer comme vu"}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      }

      setMarkers(newMarkers);
      setLoading(false);
    };

    loadMarkers();
  }, [
    selectedMap,
    markerData,
    markedMarkers,
    hideFoundMarkers,
    onToggleMarker,
  ]);

  if (!isClient || !selectedMap) {
    return (
      <div className="w-full h-screen bg-ink">
        <Loading mode="box" message="Chargement de la carte..." size={48} />
      </div>
    );
  }

  const bounds: [[number, number], [number, number]] = [
    [0, 0],
    [selectedMap.imageSize.height, selectedMap.imageSize.width],
  ];

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {loading && (
        <div className="absolute bottom-3 right-20 z-[90]">
          <Loading
            mode="withMessage"
            message="Chargement des marqueurs..."
            size={20}
            className="text-parch"
          />
        </div>
      )}
      <MapContainer
        crs={CRS.Simple}
        center={[
          selectedMap.imageSize.height / 2,
          selectedMap.imageSize.width / 2,
        ]}
        zoom={-2.5}
        maxBounds={bounds}
        maxBoundsViscosity={1.5}
        className="w-full h-full"
        zoomControl={false}
        scrollWheelZoom={true}
        minZoom={-2.5}
        maxZoom={4}
      >
        <MapController bounds={bounds} />
        <ImageOverlayWrapper url={selectedMap.image} bounds={bounds} />
        <ZoomControl position="bottomright" />
        {markers}
      </MapContainer>

      {/* Modal d'image zoomée */}
      <ImageZoomModal
        imageUrl={zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
}
