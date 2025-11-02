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

// Cache global pour les icônes générées
const iconCache = new Map<string, Promise<Icon>>();

// Fonction pour créer une icône personnalisée avec cercle
const createCustomIcon = (
  iconUrl: string,
  size: [number, number] = [32, 32]
) => {
  // Vérifier le cache d'abord
  if (iconCache.has(iconUrl)) {
    return iconCache.get(iconUrl)!;
  }

  // Créer la promesse et la mettre en cache
  const iconPromise = new Promise<Icon>((resolve) => {
    // Créer un canvas pour dessiner l'icône avec un cercle de fond
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = size[0];
    canvas.height = size[1];

    if (ctx) {
      // Cercle de fond blanc avec bordure
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.lineWidth = 2;

      // Cercle principal
      ctx.beginPath();
      ctx.arc(size[0] / 2, size[1] / 2, size[0] / 2 - 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Cercle intérieur plus sombre pour créer un effet 3D
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
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
  iconCache.set(iconUrl, iconPromise);
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

export default function MapComponent({
  selectedMap,
  visibleCategories = {},
  markedMarkers = new Set(),
  onToggleMarker,
  hideFoundMarkers = false,
}: MapComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [markers, setMarkers] = useState<React.JSX.Element[]>([]);
  const [loading, setLoading] = useState(true);

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
          // Vérifier si la catégorie est visible (par défaut true)
          const isCategoryVisible = visibleCategories[category.type] !== false;

          if (isCategoryVisible && category.markers) {
            for (const marker of category.markers) {
              if (marker.markers) {
                for (const instance of marker.markers) {
                  // Convertir les coordonnées (Y inversé car Leaflet a Y=0 en haut)
                  const position: LatLngTuple = [
                    selectedMap.imageSize.height - instance.position.y,
                    instance.position.x,
                  ];

                  const markerKey = `${category.id}-${marker.id}-${instance.id}`;
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

      // Étape 2: Collecter les URLs d'icônes uniques
      const uniqueIconUrls = [
        ...new Set(markerData.map((data) => data.iconUrl)),
      ];

      // Étape 3: Charger toutes les icônes en parallèle
      const iconPromises = uniqueIconUrls.map((url) => createCustomIcon(url));
      const loadedIcons = await Promise.all(iconPromises);

      // Étape 4: Créer un mapping URL -> Icon
      const iconMap = new Map<string, Icon>();
      uniqueIconUrls.forEach((url, index) => {
        iconMap.set(url, loadedIcons[index]);
      });

      // Étape 5: Créer les marqueurs avec les icônes déjà chargées
      const newMarkers: React.JSX.Element[] = [];

      for (const data of markerData) {
        const customIcon = iconMap.get(data.iconUrl)!;

        newMarkers.push(
          <Marker
            key={data.key}
            position={data.position}
            icon={customIcon}
            opacity={data.isMarked ? 0.5 : 1}
          >
            <Popup>
              <div className="bg-white rounded-lg shadow-lg p-4 min-w-[280px] border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={data.category.icon}
                    alt={data.category.name}
                    className="w-8 h-8 rounded border border-gray-300"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <h3 className="font-bold text-gray-800 text-lg">
                    {data.category.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <img
                    src={data.marker.icon}
                    alt={data.marker.name}
                    className="w-6 h-6 rounded border border-gray-300"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <p className="font-semibold text-gray-700">
                    {data.marker.name}
                  </p>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <p>
                    <strong>Position:</strong> ({data.instance.position.x},{" "}
                    {data.instance.position.y})
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleMarker?.(data.key)}
                    className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors flex-1 ${
                      data.isMarked
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {data.isMarked
                      ? "Marquer comme non-vu"
                      : "Marquer comme vu"}
                  </button>
                </div>
                {data.isMarked && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Marqué comme vu
                    </p>
                  </div>
                )}
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
    <div className="w-full h-screen border-2 border-gray-600 rounded-lg overflow-hidden relative">
      {loading && (
        <div className="absolute top-5 left-16 z-[1000]">
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
        <ImageOverlay url={selectedMap.image} bounds={bounds} />
        <ZoomControl position="bottomright" />
        {markers}
      </MapContainer>
    </div>
  );
}
