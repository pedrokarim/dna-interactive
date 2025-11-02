"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAtom } from "jotai";
import dynamic from "next/dynamic";
import mapData from "@/data/mapData.json";
import Loading from "@/components/Loading";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExportModal from "@/components/ExportModal";
import ImportModal from "@/components/ImportModal";
import {
  selectedMapIdAtom,
  visibleCategoriesAtom,
  markedMarkersAtom,
  toggleMarkerMarkedAtom,
  toggleCategoryVisibilityAtom,
  resetAllMarkersAtom,
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
    <div className="w-full h-full bg-gray-900">
      <Loading mode="box" message="Chargement de la carte..." size={48} />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [, resetAllMarkers] = useAtom(resetAllMarkersAtom);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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

  // Filtrer les catégories selon la recherche
  const filteredCategories = allCategories.filter((category) => {
    if (!searchQuery.trim()) return true;
    return category.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim());
  });

  // Fonction pour exporter les marqueurs
  const handleExportMarkers = (format: "json" | "csv") => {
    const markersArray = Array.from(markedMarkers);

    let dataStr: string;
    let mimeType: string;
    let extension: string;

    if (format === "json") {
      dataStr = JSON.stringify({ markers: markersArray }, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else {
      // Format CSV
      const csvRows = ["Marqueur ID"];
      markersArray.forEach((marker) => {
        csvRows.push(marker);
      });
      dataStr = csvRows.join("\n");
      mimeType = "text/csv";
      extension = "csv";
    }

    const dataBlob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marqueurs-${
      new Date().toISOString().split("T")[0]
    }.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fonction pour importer les marqueurs
  const handleImportMarkers = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (data.markers && Array.isArray(data.markers)) {
          // Migration : convertir les anciens IDs (undefined-*) vers le nouveau format
          // Pour les anciens IDs, on ne peut pas les convertir automatiquement car on n'a pas le contexte
          // On les garde tels quels et les utilisateurs devront re-marquer les marqueurs
          const markers = data.markers
            .map((markerId: string) => {
              // Si c'est un ancien format (commence par "undefined-"), on peut essayer de le convertir
              // mais sans garantie car on n'a pas le contexte de la carte
              if (markerId.startsWith("undefined-")) {
                // Pour l'instant, on garde l'ancien format mais on pourrait essayer de deviner
                // basé sur la carte actuelle
                console.warn(
                  `Ancien format d'ID détecté : ${markerId}. Les marqueurs devront être re-marqués.`
                );
                return null; // On ignore les anciens IDs invalides
              }
              return markerId;
            })
            .filter((id: string | null) => id !== null);

          setMarkedMarkers(new Set(markers));

          if (markers.length < data.markers.length) {
            alert(
              `Import réussi : ${markers.length} marqueur(s) importé(s). ${
                data.markers.length - markers.length
              } ancien(s) format(s) ignoré(s) et nécessitent d'être re-marqué(s).`
            );
          }
        } else {
          alert("Format de fichier invalide");
        }
      } catch (error) {
        alert("Erreur lors de l'import : fichier invalide");
      }
    };
    reader.readAsText(file);
  };

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
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Zone de la carte - Plein écran */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapComponent
          selectedMap={selectedMap}
          visibleCategories={visibleCategories}
          markedMarkers={markedMarkers}
          onToggleMarker={toggleMarkerMarked}
          hideFoundMarkers={hideFoundMarkers}
          isSidebarOpen={!isMenuCollapsed}
          sidebarWidth={isMenuCollapsed ? 64 : 320}
        />
      </div>

      {/* Sidebar flottante */}
      <aside
        className={`absolute left-4 top-4 bottom-4 bg-slate-950/95 backdrop-blur-md flex flex-col z-[100] transition-all duration-300 ${
          isMenuCollapsed
            ? "w-0 overflow-hidden opacity-0 pointer-events-none border-0 shadow-none"
            : "w-80 rounded-3xl opacity-100 border border-indigo-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(99,102,241,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]"
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
              <div className="space-y-4">
                {/* En-tête avec logo */}
                <div className="flex items-center gap-3">
                  <img
                    src={ASSETS_PATHS.logo}
                    alt={`${SITE_CONFIG.name} Logo`}
                    className="h-8 w-auto"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      {SITE_CONFIG.name}
                    </h1>
                    <p className="text-xs text-gray-400">Carte Interactive</p>
                  </div>
                </div>

                {/* Barre de recherche */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Marqueurs dans la zone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800/50 backdrop-blur-sm border border-indigo-500/30 rounded-md px-3 py-2 pl-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                </div>

                {/* Sélecteur de région */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Région
                  </label>
                  <select
                    value={selectedMapId || ""}
                    onChange={(e) => setSelectedMapId(e.target.value)}
                    className="w-full bg-slate-800/50 backdrop-blur-sm border border-indigo-500/30 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
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

                {/* Toggle Masquer les marqueurs trouvés */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-300">
                    Masquer les marqueurs trouvés
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

        {/* Section Catégories - Grid */}
        {!isMenuCollapsed && (
          <div className="relative p-6 border-b border-indigo-500/20 flex-1 overflow-y-auto">
            {/* Arrière-plan avec effet Ken Burns */}
            <div className="absolute inset-0 overflow-hidden">
              {ASSETS_PATHS.worldview.map((imagePath, index) => (
                <img
                  key={imagePath}
                  src={imagePath}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentBgImage ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    animation: "kenBurns 12s ease-out infinite",
                  }}
                  loading="eager"
                />
              ))}
              {/* Dégradé depuis le bas */}
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/95 via-slate-950/60 to-transparent z-10" />
              {/* Overlay pour améliorer la lisibilité */}
              <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px] z-10" />
            </div>

            {/* Contenu des catégories en grid */}
            <div className="relative z-20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Catégories
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategoryVisibility(category.id)}
                    title={category.name}
                    className={`group relative flex flex-col items-center p-2.5 rounded-lg transition-all duration-300 border min-w-0 ${
                      visibleCategories[category.id] !== false
                        ? "bg-indigo-600/30 border-indigo-400/60 shadow-lg shadow-indigo-500/20 backdrop-blur-sm"
                        : "bg-slate-800/60 hover:bg-slate-700/70 border-indigo-500/30 hover:border-indigo-400/50 backdrop-blur-sm opacity-50"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-md overflow-hidden border border-indigo-500/40 shadow-sm mb-1.5 flex items-center justify-center bg-slate-600/50">
                      <img
                        src={category.icon}
                        alt={category.name}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <span className="text-xs text-white text-center truncate w-full font-medium mb-1 leading-tight">
                      {category.name}
                    </span>
                    {visibleCategories[category.id] !== false && (
                      <div className="text-xs font-semibold text-indigo-400">
                        {selectedMap?.legend
                          ?.find((cat) => cat.type === category.id)
                          ?.markers?.reduce(
                            (total, marker) =>
                              total + (marker.markers?.length || 0),
                            0
                          ) || 0}
                      </div>
                    )}
                    {/* Tooltip personnalisé */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-950/95 backdrop-blur-md text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 border border-indigo-500/40 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border border-indigo-500/30 bg-slate-700/60 flex items-center justify-center">
                          <img
                            src={category.icon}
                            alt={category.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="w-2 h-2 bg-slate-950 border-r border-b border-indigo-500/40 transform rotate-45"></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer du menu */}
        {!isMenuCollapsed && (
          <div className="mt-auto p-6 border-t border-indigo-500/20 space-y-4">
            {/* Bouton Réinitialiser */}
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-md text-sm text-gray-300 hover:text-white transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Réinitialiser
            </button>

            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-indigo-500/20">
              <Link
                href="/"
                className="hover:text-indigo-400 transition-colors"
              >
                ← Accueil
              </Link>
              <div className="flex space-x-3">
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

      {/* Bouton toggle sidebar - Toujours visible, positionné différemment selon l'état */}
      <button
        onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
        className={`absolute z-[110] bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700/90 rounded-lg p-2.5 transition-all duration-300 border border-indigo-500/30 shadow-lg top-1/2 -translate-y-1/2 ${
          isMenuCollapsed ? "left-4" : "left-[340px]"
        }`}
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

      {/* Contrôles en haut à droite */}
      <div className="absolute top-4 right-4 z-[90]">
        {/* Menu d'actions */}
        <div className="relative">
          <button
            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
            className="p-2.5 hover:bg-slate-700/50 rounded-lg transition-colors bg-slate-800/80 backdrop-blur-sm border border-indigo-500/20 shadow-lg"
            title="Menu d'actions"
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {/* Menu déroulant */}
          {isActionMenuOpen && (
            <>
              {/* Overlay pour fermer le menu en cliquant ailleurs */}
              <div
                className="fixed inset-0 z-[105]"
                onClick={() => setIsActionMenuOpen(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-950/95 backdrop-blur-md rounded-lg border border-indigo-500/40 shadow-[0_8px_24px_rgba(0,0,0,0.6)] z-[110] overflow-hidden">
                <div className="py-2">
                  {/* Exporter */}
                  <button
                    onClick={() => {
                      setShowExportModal(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-slate-800/70 transition-colors flex items-center gap-3"
                  >
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Exporter les marqueurs</span>
                  </button>

                  {/* Importer */}
                  <button
                    onClick={() => {
                      setShowImportModal(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-slate-800/70 transition-colors flex items-center gap-3"
                  >
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span>Importer les marqueurs</span>
                  </button>

                  <div className="h-px bg-indigo-500/20 my-1"></div>

                  {/* Réinitialiser */}
                  <button
                    onClick={() => {
                      setShowResetConfirm(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-slate-800/70 transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="text-red-400">
                      Réinitialiser tous les marqueurs
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialog de confirmation pour réinitialiser */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetAllMarkers();
        }}
        title="Réinitialiser tous les marqueurs"
        message="Êtes-vous sûr de vouloir réinitialiser tous les marqueurs ? Cette action supprimera tous les marqueurs que vous avez marqués comme vus."
        confirmText="Réinitialiser"
        cancelText="Annuler"
      />

      {/* Modale d'export */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportMarkers}
        markerCount={markedMarkers.size}
      />

      {/* Modale d'import */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportMarkers}
      />

      {/* Barre de statut en bas à gauche - Positionnée à droite de la sidebar */}
      {!isMenuCollapsed && (
        <div className="absolute bottom-6 left-[348px] bg-slate-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-3 z-[90] shadow-lg">
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
      )}
    </div>
  );
}
