"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAtom } from "jotai";
import dynamic from "next/dynamic";
import mapData from "@/data/mapData.json";
import {
  selectedMapIdAtom,
  visibleCategoriesAtom,
  markedMarkersAtom,
  toggleMarkerMarkedAtom,
  toggleCategoryVisibilityAtom,
} from "@/lib/store";

// Import des constantes
import {
  SITE_CONFIG,
  ASSETS_PATHS,
  CONTACT_INFO,
  CREATOR_INFO,
  LEGAL_INFO,
  GAME_INFO,
} from "@/lib/constants";


// Import dynamique pour éviter les erreurs SSR avec Leaflet
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Chargement de la carte...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [selectedMapId, setSelectedMapId] = useAtom(selectedMapIdAtom);
  const [visibleCategories, setVisibleCategories] = useAtom(
    visibleCategoriesAtom
  );
  const [markedMarkers, setMarkedMarkers] = useAtom(markedMarkersAtom);
  const [, toggleMarkerMarked] = useAtom(toggleMarkerMarkedAtom);
  const [, toggleCategoryVisibility] = useAtom(toggleCategoryVisibilityAtom);
  const [hideFoundMarkers, setHideFoundMarkers] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [currentBgImage, setCurrentBgImage] = useState(0);

  // Fonction pour obtenir toutes les catégories uniques avec leurs icônes
  const getUniqueCategories = () => {
    const categoriesMap = new Map();

    mapData.forEach((map) => {
      if (map.legend) {
        map.legend.forEach((category) => {
          if (!categoriesMap.has(category.type)) {
            categoriesMap.set(category.type, {
              id: category.type,
              name: category.label,
              icon: category.icon,
            });
          }
        });
      }
    });

    return Array.from(categoriesMap.values());
  };

  const allCategories = getUniqueCategories();

  // Effet pour changer l'image de fond toutes les 2 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgImage((prev) => (prev + 1) % ASSETS_PATHS.worldview.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Trouver la carte sélectionnée
  const selectedMap = mapData.find((map) => map.id === selectedMapId) || null;

  // Sélectionner la première carte par défaut
  useEffect(() => {
    if (mapData.length > 0 && !selectedMapId) {
      setSelectedMapId(mapData[0].id);
    }
  }, [mapData, selectedMapId, setSelectedMapId]);

  // Initialiser la visibilité des catégories quand la carte change
  useEffect(() => {
    if (selectedMap?.legend) {
      const newVisibility: Record<string, boolean> = {};

      // On garde seulement les catégories de toutes les cartes vues récemment
      // Pour cette carte, on met toutes les catégories à true par défaut
      selectedMap.legend.forEach((category: any) => {
        newVisibility[category.type] = true;
      });

      // On garde aussi les catégories des autres cartes si elles existent déjà
      Object.keys(visibleCategories).forEach((categoryId) => {
        if (!newVisibility[categoryId]) {
          newVisibility[categoryId] = visibleCategories[categoryId];
        }
      });

      setVisibleCategories(newVisibility);
    }
  }, [selectedMap, setVisibleCategories]); // Retiré visibleCategories des dépendances pour éviter les boucles

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-950 via-slate-900 to-indigo-950 text-white flex">
      {/* Colonne latérale gauche - Menu */}
      <aside
        className={`bg-slate-950/90 backdrop-blur-sm border-r border-indigo-500/20 flex flex-col min-h-screen transition-all duration-300 ${
          isMenuCollapsed ? "w-16" : "w-80"
        }`}
      >
        {/* Titre et sélection de région */}
        <div
          className={`p-6 border-b border-indigo-500/20 ${
            isMenuCollapsed ? "p-4" : ""
          }`}
        >
          {!isMenuCollapsed && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={ASSETS_PATHS.logo}
                    alt={`${SITE_CONFIG.name} Logo`}
                    className="h-8 w-auto"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="text-indigo-400">✦</span>
                      {SITE_CONFIG.name}
                      <span className="text-indigo-400">✦</span>
                    </h1>
                    <p className="text-xs text-gray-400">Interactive Map</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Région
                  </label>
                  <select
                    value={selectedMapId || ""}
                    onChange={(e) => setSelectedMapId(e.target.value)}
                    className="w-full bg-slate-800/50 backdrop-blur-sm border border-indigo-500/30 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  >
                    {mapData.map((map) => (
                      <option
                        key={map.id}
                        value={map.id}
                        className="bg-slate-800"
                      >
                        {map.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggle Hide found markers */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    Hide found markers
                  </span>
                  <button
                    onClick={() => setHideFoundMarkers(!hideFoundMarkers)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      hideFoundMarkers ? "bg-indigo-600" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hideFoundMarkers ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Section Catégories */}
        {!isMenuCollapsed && (
          <div className="relative p-6 border-b border-indigo-500/20 flex-1 overflow-y-auto">
            {/* Arrière-plan avec effet Ken Burns */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-12000 ease-out"
                style={{
                  backgroundImage: `url(${ASSETS_PATHS.worldview[currentBgImage]})`,
                  animation: "kenBurns 12s ease-out infinite",
                }}
              />
              {/* Dégradé depuis le bas */}
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/95 via-slate-950/60 to-transparent" />
              {/* Overlay pour améliorer la lisibilité */}
              <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px]" />
            </div>

            {/* Contenu des catégories */}
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white mb-4">
                Catégories
              </h3>
              <div className="space-y-2">
                {allCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategoryVisibility(category.id)}
                    className={`w-full flex items-center space-x-3 rounded-lg p-3 transition-all duration-300 ${
                      visibleCategories[category.id] !== false
                        ? "bg-indigo-600/30 border border-indigo-400/60 shadow-lg shadow-indigo-500/20 backdrop-blur-sm"
                        : "bg-slate-800/60 hover:bg-slate-700/70 border border-indigo-500/30 hover:border-indigo-400/50 backdrop-blur-sm"
                    }`}
                  >
                    <div className="w-8 h-8 shrink-0 rounded-md overflow-hidden border border-indigo-500/40 shadow-sm">
                      <img
                        src={category.icon}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <span className="text-sm text-white flex-1 text-left truncate font-medium">
                      {category.name}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 transition-all duration-300 ${
                        visibleCategories[category.id] !== false
                          ? "bg-linear-to-br from-indigo-400 to-indigo-300 shadow-lg shadow-indigo-400/50 scale-110"
                          : "bg-slate-500 hover:bg-slate-400 border border-slate-400/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer du menu */}
        {!isMenuCollapsed && (
          <div className="mt-auto p-6 border-t border-indigo-500/20">
            <div className="flex justify-between text-sm text-gray-400">
              <Link
                href="/"
                className="hover:text-indigo-400 transition-colors"
              >
                ← Accueil
              </Link>
              <div className="flex space-x-4">
                <Link
                  href="/about"
                  className="hover:text-indigo-400 transition-colors"
                >
                  À propos
                </Link>
                <Link
                  href="/support"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Support
                </Link>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Zone principale - Carte */}
      <main className="flex-1 relative">
        {/* Bouton pour masquer le menu */}
        <button
          onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
          className="absolute top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700/80 rounded-md p-2 transition-colors border border-indigo-500/20"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
            />
          </svg>
        </button>

        {/* Bouton de recherche */}
        <button className="absolute top-4 right-4 z-50 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700/80 rounded-md p-2 transition-colors border border-indigo-500/20">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* Zone de la carte */}
        <div className="w-full h-full min-h-screen">
          <MapComponent
            selectedMap={selectedMap}
            visibleCategories={visibleCategories}
            markedMarkers={markedMarkers}
            onToggleMarker={toggleMarkerMarked}
            hideFoundMarkers={hideFoundMarkers}
          />
        </div>

        {/* Contrôles de zoom */}
        <div className="absolute bottom-4 right-4 z-50 flex flex-col space-y-2">
          <button className="bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700/80 rounded-md p-2 transition-colors border border-indigo-500/20">
            <span className="text-white font-bold">+</span>
          </button>
          <button className="bg-slate-800/80 backdrop-blur-sm hover:bg-slate-700/80 rounded-md p-2 transition-colors border border-indigo-500/20">
            <span className="text-white font-bold">−</span>
          </button>
        </div>

        {/* Barre de statut */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-3 z-50">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="text-gray-300">Carte active</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-gray-300">
                {selectedMap?.legend?.reduce(
                  (total, cat) =>
                    total +
                    (cat.markers?.reduce(
                      (sum, marker) => sum + (marker.markers?.length || 0),
                      0
                    ) || 0),
                  0
                ) || 0}{" "}
                marqueurs
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
