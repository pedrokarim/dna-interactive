"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { CRS, Icon, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import Loading from "@/components/Loading";
import ImageZoomModal from "@/components/ImageZoomModal";

// Cache global pour les icônes générées (avec état trouvé/non trouvé)
const iconCache = new Map<string, Promise<Icon>>();

// Fonction pour créer une icône personnalisée avec cercle
const createCustomIcon = (
  iconUrl: string,
  size: [number, number] = [32, 32],
  isFound: boolean = false
) => {
  // Clé du cache inclut l'URL et l'état
  const cacheKey = `${iconUrl}-${isFound}`;

  // Vérifier le cache d'abord
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  // Créer la promesse et la mettre en cache
  const iconPromise = new Promise<Icon>((resolve) => {
    // Créer un canvas pour dessiner l'icône avec un cercle de fond
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = size[0];
    canvas.height = size[1];

    if (ctx) {
      // Cercle de fond avec couleur selon l'état du marqueur
      if (isFound) {
        // Marqueur trouvé : fond rouge/orange plus transparent
        ctx.fillStyle = "rgba(220, 38, 38, 0.7)"; // red-600
        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // red-500
      } else {
        // Marqueur actif : fond indigo/bleu vif pour contraste
        ctx.fillStyle = "rgba(67, 56, 202, 0.9)"; // indigo-700
        ctx.strokeStyle = "rgba(99, 102, 241, 1)"; // indigo-500
      }
      ctx.lineWidth = 2;

      // Cercle principal
      ctx.beginPath();
      ctx.arc(size[0] / 2, size[1] / 2, size[0] / 2 - 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Cercle intérieur plus clair pour créer un effet 3D
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(size[0] / 2, size[1] / 2, size[0] / 2 - 4, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Charger l'image de l'icône
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (ctx) {
        // Dessiner l'icône au centre du cercle
        const iconSize = size[0] - 8; // Laisser un peu d'espace autour
        const iconX = (size[0] - iconSize) / 2;
        const iconY = (size[1] - iconSize) / 2;

        ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
      }

      const dataUrl = canvas.toDataURL();

      const icon = new Icon({
        iconUrl: dataUrl,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]], // Point d'ancrage au centre bas
        popupAnchor: [0, -size[1]], // Popup au-dessus du marqueur
        className: "custom-marker-icon",
      });

      resolve(icon);
    };

    img.onerror = () => {
      // Fallback si l'image ne charge pas
      if (ctx) {
        ctx.fillStyle = "#ff6b6b";
        ctx.fillRect(0, 0, size[0], size[1]);
        ctx.fillStyle = "#000";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("?", size[0] / 2, size[1] / 2 + 6);
      }

      const dataUrl = canvas.toDataURL();

      const icon = new Icon({
        iconUrl: dataUrl,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]],
        popupAnchor: [0, -size[1]],
        className: "custom-marker-icon",
      });

      resolve(icon);
    };

    img.src = iconUrl || "/marker-default.png";
  });

  // Mettre en cache et retourner
  iconCache.set(cacheKey, iconPromise);
  return iconPromise;
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

  useEffect(() => {
    if (!selectedMap) return;

    const loadMarkers = async () => {
      setLoading(true);

      // Étape 1: Collecter tous les marqueurs visibles et leurs icônes nécessaires
      const markerData: Array<{
        position: LatLngTuple;
        key: string;
        iconUrl: string;
        isMarked: boolean;
        category: any;
        marker: any;
        instance: any;
      }> = [];

      if (selectedMap.legend) {
        for (const category of selectedMap.legend) {
          if (category.markers) {
            for (const marker of category.markers) {
              // Vérifier si cette sous-catégorie spécifique est visible
              // Utiliser le nom de la sous-catégorie comme clé (comme dans la page map)
              const subCategoryKey = marker.name.toLowerCase().trim();
              const isSubCategoryVisible =
                visibleCategories[subCategoryKey] !== false;

              if (isSubCategoryVisible && marker.markers) {
                for (const instance of marker.markers) {
                  // Convertir les coordonnées (Y inversé car Leaflet a Y=0 en haut)
                  const position: LatLngTuple = [
                    selectedMap.imageSize.height - instance.position.y,
                    instance.position.x,
                  ];

                  // Utiliser category.type au lieu de category.id, et inclure selectedMap.id pour éviter les collisions
                  const markerKey = `${selectedMap.id}-${category.type}-${marker.id}-${instance.id}`;
                  const isMarked = markedMarkers.has(markerKey);

                  // Ne pas afficher les marqueurs trouvés si l'option est activée
                  if (hideFoundMarkers && isMarked) {
                    continue;
                  }

                  // Collecter les données du marqueur
                  markerData.push({
                    position,
                    key: markerKey,
                    iconUrl: marker.icon,
                    isMarked,
                    category,
                    marker,
                    instance,
                  });
                }
              }
            }
          }
        }
      }

      // Étape 2: Collecter les URLs d'icônes uniques avec leurs états
      const iconStatesMap = new Map<string, Set<boolean>>();
      markerData.forEach((data) => {
        if (!iconStatesMap.has(data.iconUrl)) {
          iconStatesMap.set(data.iconUrl, new Set());
        }
        iconStatesMap.get(data.iconUrl)!.add(data.isMarked);
      });

      // Étape 3: Charger toutes les icônes nécessaires en parallèle (trouvé et non trouvé)
      const iconPromises: Promise<Icon>[] = [];
      const iconKeys: string[] = [];
      iconStatesMap.forEach((states, url) => {
        states.forEach((isFound) => {
          const key = `${url}-${isFound}`;
          iconKeys.push(key);
          iconPromises.push(createCustomIcon(url, [32, 32], isFound));
        });
      });
      const loadedIcons = await Promise.all(iconPromises);

      // Étape 4: Créer un mapping clé -> Icon
      const iconMap = new Map<string, Icon>();
      iconKeys.forEach((key, index) => {
        iconMap.set(key, loadedIcons[index]);
      });

      // Étape 5: Créer les marqueurs avec les icônes déjà chargées
      const newMarkers: React.JSX.Element[] = [];

      for (const data of markerData) {
        // Récupérer l'icône avec l'état approprié
        const iconKey = `${data.iconUrl}-${data.isMarked}`;
        const customIcon = iconMap.get(iconKey)!;

        newMarkers.push(
          <Marker
            key={data.key}
            position={data.position}
            icon={customIcon}
            opacity={data.isMarked ? 0.6 : 1}
          >
            <Popup>
              <div className="bg-slate-950/95 backdrop-blur-md rounded-lg p-4 min-w-[320px] border border-indigo-500/40 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-lg border border-indigo-500/40 shadow-sm bg-slate-700/60 flex items-center justify-center">
                    <img
                      src={data.category.icon}
                      alt={`Icône ${data.category.name} - Catégorie de marqueurs sur la carte interactive Duet Night Abyss`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <h3 className="font-bold text-white text-lg">
                    {data.category.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-3 mb-3 bg-slate-800/50 rounded-lg p-2 border border-indigo-500/20">
                  <div className="w-10 h-10 rounded-lg border border-indigo-500/40 shadow-sm bg-slate-700/60 flex items-center justify-center">
                    <img
                      src={data.marker.icon}
                      alt={`Icône ${data.marker.name} - Marqueur sur la carte interactive Duet Night Abyss`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <p className="font-semibold text-white">{data.marker.name}</p>
                </div>
                <div className="text-sm text-gray-300 mb-4 bg-slate-800/30 rounded-md p-2 border border-indigo-500/20">
                  <p>
                    <strong className="text-indigo-400">Position:</strong> (
                    {data.instance.position.x}, {data.instance.position.y})
                  </p>
                </div>
                {data.instance.image && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-indigo-500/30 bg-slate-800/50">
                    <img
                      src={data.instance.image}
                      alt={`Guide visuel ${data.marker.name} - Localisation sur la carte interactive Duet Night Abyss`}
                      className="w-full h-auto object-contain max-h-64 cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={() => setZoomedImage(data.instance.image!)}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <p className="text-xs text-gray-400 text-center mt-1 px-2">
                      Cliquez pour agrandir
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleMarker?.(data.key)}
                    className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors flex-1 ${
                      data.isMarked
                        ? "bg-red-600/80 hover:bg-red-600 border border-red-500/50"
                        : "bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/50"
                    }`}
                  >
                    {data.isMarked
                      ? "Marquer comme non-vu"
                      : "Marquer comme vu"}
                  </button>
                </div>
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
    visibleCategories,
    markedMarkers,
    hideFoundMarkers,
    onToggleMarker,
  ]);

  if (!isClient || !selectedMap) {
    return (
      <div className="w-full h-screen bg-gray-900">
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
            className="text-white"
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
