"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [selectedMapId, setSelectedMapId] = useAtom(selectedMapIdAtom);
  const [visibleCategories, setVisibleCategories] = useAtom(visibleCategoriesAtom);
  const [markedMarkers, setMarkedMarkers] = useAtom(markedMarkersAtom);
  const [, toggleMarkerMarked] = useAtom(toggleMarkerMarkedAtom);
  const [, toggleCategoryVisibility] = useAtom(toggleCategoryVisibilityAtom);
  const [hideFoundMarkers, setHideFoundMarkers] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

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
    if (selectedMap?.categories) {
      const initialVisibility: Record<string, boolean> = {};
      selectedMap.categories.forEach((category: any) => {
        initialVisibility[category.id] = true;
      });
      setVisibleCategories(initialVisibility);
    }
  }, [selectedMap, setVisibleCategories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex">
      {/* Colonne latérale gauche - Menu */}
      <aside className={`bg-gray-900 border-r border-gray-700 flex flex-col min-h-screen transition-all duration-300 ${isMenuCollapsed ? 'w-16' : 'w-80'}`}>
        {/* Titre et sélection de région */}
        <div className={`p-6 border-b border-gray-700 ${isMenuCollapsed ? 'p-4' : ''}`}>
          {!isMenuCollapsed && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">STAR RESONANCE</h1>
                <p className="text-sm text-gray-400">Interactive Map</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Région</label>
                  <select
                    value={selectedMapId || ""}
                    onChange={(e) => setSelectedMapId(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {mapData.map((map) => (
                      <option key={map.id} value={map.id} className="bg-gray-800">
                        {map.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toggle Hide found markers */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Hide found markers</span>
                  <button
                    onClick={() => setHideFoundMarkers(!hideFoundMarkers)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      hideFoundMarkers ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hideFoundMarkers ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Section Locations */}
        {!isMenuCollapsed && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Locations</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm text-white">Teleporter</span>
              </button>
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">?</span>
                </div>
                <span className="text-sm text-white">Hidden Quest</span>
              </button>
            </div>
          </div>
        )}

        {/* Section Exploration */}
        {!isMenuCollapsed && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Exploration</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm text-white">Common Chest</span>
              </button>
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm text-white">Epic Chest</span>
              </button>
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm text-white">Legendary Chest</span>
              </button>
              <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx={12} cy={12} r={10} />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </div>
                <span className="text-sm text-white">Time Trial</span>
              </button>
            </div>
          </div>
        )}

        {/* Section Collectibles */}
        {!isMenuCollapsed && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Collectibles</h3>
            <button className="w-full flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-sm text-white">Book</span>
            </button>
          </div>
        )}

        {/* Footer du menu */}
        {!isMenuCollapsed && (
          <div className="mt-auto p-6 border-t border-gray-700">
            <div className="flex justify-between text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            </div>
          </div>
        )}
      </aside>

      {/* Zone principale - Carte */}
      <main className="flex-1 relative">
        {/* Bouton pour masquer le menu */}
        <button
          onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
          className="absolute top-4 left-4 z-50 bg-gray-800 hover:bg-gray-700 rounded-md p-2 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>

        {/* Bouton de recherche */}
        <button className="absolute top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 rounded-md p-2 transition-colors">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Zone de la carte */}
        <div className="h-screen">
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
          <button className="bg-gray-800 hover:bg-gray-700 rounded-md p-2 transition-colors">
            <span className="text-white font-bold">+</span>
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 rounded-md p-2 transition-colors">
            <span className="text-white font-bold">−</span>
          </button>
        </div>

        {/* Barre de statut */}
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 z-50">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Carte active</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-300">
                {selectedMap?.categories.reduce((total, cat) =>
                  total + (cat.markers?.reduce((sum, marker) => sum + (marker.instances?.length || 0), 0) || 0), 0
                ) || 0} marqueurs
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
