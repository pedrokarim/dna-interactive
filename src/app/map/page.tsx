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
import MapInfoModal from "@/components/MapInfoModal";
import ChangelogModal from "@/components/ChangelogModal";
import {
  selectedMapIdWithPersistenceAtom,
  visibleCategoriesAtom,
  expandedCategoriesAtom,
  sidebarWidthAtom,
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
  const [selectedMapId, setSelectedMapId] = useAtom(selectedMapIdWithPersistenceAtom);
  const [visibleCategories, setVisibleCategories] = useAtom(
    visibleCategoriesAtom
  );
  const [expandedCategories, setExpandedCategories] = useAtom(
    expandedCategoriesAtom
  );
  const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom);
  const [markedMarkers, setMarkedMarkers] = useAtom(markedMarkersAtom);
  const [, toggleMarkerMarked] = useAtom(toggleMarkerMarkedAtom);
  const [, toggleCategoryVisibility] = useAtom(toggleCategoryVisibilityAtom);

  // Fonction pour reset la taille de la sidebar
  const resetSidebarWidth = () => {
    setSidebarWidth(320); // Taille par défaut
  };

  // Fonctions pour gérer la sélection/désélection de groupes
  const selectAllInGroup = (group: (typeof groupedCategories)[0]) => {
    const updates: Record<string, boolean> = {};
    group.items.forEach((item) => {
      updates[item.name.toLowerCase().trim()] = true;
    });
    setVisibleCategories((prev) => ({ ...prev, ...updates }));
  };

  const deselectAllInGroup = (group: (typeof groupedCategories)[0]) => {
    const updates: Record<string, boolean> = {};
    group.items.forEach((item) => {
      updates[item.name.toLowerCase().trim()] = false;
    });
    setVisibleCategories((prev) => ({ ...prev, ...updates }));
  };

  const isGroupFullySelected = (group: (typeof groupedCategories)[0]) => {
    return group.items.every(
      (item) => visibleCategories[item.name.toLowerCase().trim()] !== false
    );
  };

  const isGroupFullyDeselected = (group: (typeof groupedCategories)[0]) => {
    return group.items.every(
      (item) => visibleCategories[item.name.toLowerCase().trim()] === false
    );
  };
  const [hideFoundMarkers, setHideFoundMarkers] = useState(false);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [currentBgImage, setCurrentBgImage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [, resetAllMarkers] = useAtom(resetAllMarkersAtom);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMapInfoModal, setShowMapInfoModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [hasInitializedMap, setHasInitializedMap] = useState(false);

  // Gestionnaires pour le redimensionnement de la sidebar
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMenuCollapsed) return;
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(
      200,
      Math.min(window.innerWidth / 2, startWidth + deltaX)
    );
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    if (!isResizing) return;
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  // Effets pour les événements de souris globaux
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, startX, startWidth]);

  // Fonction pour regrouper les sous-catégories dans des catégories principales
  const getGroupedCategories = () => {
    const allSubCategories: Array<{
      id: string;
      name: string;
      icon: string;
      parentType: string;
      parentLabel: string;
      parentIcon: string;
      mapId: string;
    }> = [];

    // Utiliser un Map pour éviter les doublons par nom
    const uniqueSubCategories = new Map<string, (typeof allSubCategories)[0]>();

    // Collecter toutes les sous-catégories en évitant les doublons
    mapData.forEach((map) => {
      if (map.legend) {
        map.legend.forEach((category) => {
          if (category.markers) {
            category.markers.forEach((subCategory) => {
              const uniqueId = `${map.id}-${category.type}-${subCategory.id}`;
              const nameKey = subCategory.name.toLowerCase().trim();

              // Si cette sous-catégorie n'existe pas encore, l'ajouter
              if (!uniqueSubCategories.has(nameKey)) {
                uniqueSubCategories.set(nameKey, {
                  id: uniqueId, // Garder l'ID original pour la logique existante
                  name: subCategory.name,
                  icon: subCategory.icon,
                  parentType: category.type,
                  parentLabel: category.label,
                  parentIcon: category.icon,
                  mapId: map.id,
                });
              }
            });
          }
        });
      }
    });

    // Convertir le Map en Array
    allSubCategories.push(...uniqueSubCategories.values());

    // Définir les groupes logiques avec des icônes appropriées
    const categoryGroups = {
      collectibles: {
        name: "Collectibles",
        icon: "https://herobox-img.yingxiong.com/map/1749672600072455391.png", // Icône collectibles originale
        items: [] as typeof allSubCategories,
      },
      chests: {
        name: "Coffres",
        icon: "https://herobox-img.yingxiong.com/map/1749672743841364457.png", // Icône coffre originale
        items: [] as typeof allSubCategories,
      },
      books: {
        name: "Livres & Documents",
        icon: "https://herobox-img.yingxiong.com/map/1749555921415533794.png", // Icône livre temporaire
        items: [] as typeof allSubCategories,
      },
      locations: {
        name: "Lieux & PNJ",
        icon: "https://herobox-img.yingxiong.com/map/1749555783038694078.png", // Icône lieu temporaire
        items: [] as typeof allSubCategories,
      },
      challenges: {
        name: "Événements & Défis",
        icon: "https://herobox-img.yingxiong.com/map/1749556012460864902.png", // Icône défi temporaire
        items: [] as typeof allSubCategories,
      },
      others: {
        name: "Autres",
        icon: "https://herobox-img.yingxiong.com/map/1749672734516496170.png", // Icône autres
        items: [] as typeof allSubCategories,
      },
    };

    // Regrouper les éléments dans les bonnes catégories
    allSubCategories.forEach((item) => {
      const name = item.name.toLowerCase();

      // Collectibles
      if (
        name.includes("spring") ||
        name.includes("shell") ||
        name.includes("mushroom") ||
        name.includes("flower") ||
        name.includes("butterfly") ||
        name.includes("egg") ||
        name.includes("sap") ||
        name.includes("grass") ||
        name.includes("stone") ||
        name.includes("lily") ||
        name.includes("snowcap") ||
        name.includes("cracks")
      ) {
        categoryGroups.collectibles.items.push(item);
      }
      // Coffres
      else if (name.includes("chest") || name.includes("coffre")) {
        categoryGroups.chests.items.push(item);
      }
      // Livres et documents
      else if (
        name.includes("diary") ||
        name.includes("part ") ||
        name.includes("letter") ||
        name.includes("book") ||
        name.includes("file") ||
        name.includes("hymn") ||
        name.includes("excerpt") ||
        name.includes("newspaper") ||
        name.includes("note") ||
        name.includes("bill") ||
        name.includes("label") ||
        name.includes("medal") ||
        name.includes("log ") ||
        name.includes("candle") ||
        name.includes("alliance") ||
        name.includes("drink") ||
        name.includes("branches") ||
        name.includes("command") ||
        name.includes("farewell") ||
        name.includes("success") ||
        name.includes("poverty")
      ) {
        categoryGroups.books.items.push(item);
      }
      // Lieux et PNJ
      else if (
        name.includes("npc") ||
        name.includes("shop") ||
        name.includes("house") ||
        name.includes("hospital") ||
        name.includes("temple") ||
        name.includes("barrel")
      ) {
        categoryGroups.locations.items.push(item);
      }
      // Événements et défis
      else if (
        name.includes("challenge") ||
        name.includes("event") ||
        name.includes("shooting") ||
        name.includes("parkour") ||
        name.includes("equipment") ||
        name.includes("protect") ||
        name.includes("explorer") ||
        name.includes("检定")
      ) {
        categoryGroups.challenges.items.push(item);
      }
      // Autres (points de téléportation, démons, pêche, etc.)
      else {
        categoryGroups.others.items.push(item);
      }
    });

    // Retourner seulement les groupes qui ont des éléments
    return Object.entries(categoryGroups)
      .filter(([_, group]) => group.items.length > 0)
      .map(([key, group]) => ({
        id: key,
        name: group.name,
        icon: group.icon,
        items: group.items,
      }));
  };

  const groupedCategories = getGroupedCategories();

  // Filtrer les groupes selon la recherche
  const filteredGroups = groupedCategories.filter((group) => {
    if (!searchQuery.trim()) return true;
    // Vérifier si le nom du groupe correspond
    if (group.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      return true;
    // Vérifier si un élément du groupe correspond
    return group.items.some((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  });

  // Fonction pour basculer l'état d'un accordéon
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

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


  // Charger la carte persistée au montage du composant
  useEffect(() => {
    if (typeof window !== 'undefined' && mapData.length > 0 && !hasInitializedMap) {
      setHasInitializedMap(true);

      // Récupérer la valeur persistée directement depuis localStorage
      const persistedMapId = localStorage.getItem('selected-map');
      console.log('🔍 Chargement initial - Valeur localStorage:', persistedMapId);

      if (persistedMapId) {
        // Vérifier que cette carte existe dans les données actuelles
        const persistedMap = mapData.find((map) => map.id === persistedMapId);
        if (persistedMap) {
          console.log('🔍 Chargement carte persistée:', persistedMapId);
          setSelectedMapId(persistedMapId);
          return;
        } else {
          console.log('🔍 Carte persistée non trouvée, suppression');
          localStorage.removeItem('selected-map');
        }
      }

      // Si pas de carte persistée valide, utiliser la première carte
      console.log('🔍 Utilisation première carte:', mapData[0].id);
      setSelectedMapId(mapData[0].id);
    }
  }, [mapData, hasInitializedMap, setSelectedMapId]);

  // Initialiser la visibilité des catégories quand la carte change
  useEffect(() => {
    if (selectedMap?.legend) {
      const newVisibility: Record<string, boolean> = {};

      // On garde seulement les catégories de toutes les cartes vues récemment
      // Pour cette carte, on met toutes les sous-catégories à true par défaut
      selectedMap.legend.forEach((category: any) => {
        if (category.markers) {
          category.markers.forEach((subCategory: any) => {
            const subCategoryId = `${selectedMap.id}-${category.type}-${subCategory.id}`;
            newVisibility[subCategoryId] = true;
          });
        }
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

  // Masquer le badge reCAPTCHA sur la page de la carte
  useEffect(() => {
    const hideRecaptchaBadge = () => {
      const badge = document.querySelector('.grecaptcha-badge') as HTMLElement;
      if (badge) {
        badge.style.visibility = 'hidden';
        badge.style.opacity = '0';
        badge.style.display = 'none';
      }
    };

    // Masquer immédiatement
    hideRecaptchaBadge();

    // Observer les changements du DOM au cas où le badge serait ajouté plus tard
    const observer = new MutationObserver(hideRecaptchaBadge);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Vérifier périodiquement (au cas où)
    const interval = setInterval(hideRecaptchaBadge, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      // Restaurer le badge quand on quitte la page (optionnel)
      const badge = document.querySelector('.grecaptcha-badge') as HTMLElement;
      if (badge) {
        badge.style.visibility = '';
        badge.style.opacity = '';
        badge.style.display = '';
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden map-page">
      {/* Zone de la carte - Plein écran */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapComponent
          selectedMap={selectedMap}
          visibleCategories={visibleCategories}
          markedMarkers={markedMarkers}
          onToggleMarker={toggleMarkerMarked}
          hideFoundMarkers={hideFoundMarkers}
          isSidebarOpen={!isMenuCollapsed}
          sidebarWidth={isMenuCollapsed ? 64 : sidebarWidth}
        />
      </div>

      {/* Sidebar flottante */}
      <aside
        className={`absolute left-4 top-4 bottom-4 bg-slate-950/95 backdrop-blur-md flex flex-col z-[100] transition-all duration-300 ${
          isMenuCollapsed
            ? "w-0 overflow-hidden opacity-0 pointer-events-none border-0 shadow-none"
            : "rounded-3xl opacity-100 border border-indigo-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(99,102,241,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]"
        }`}
        style={{
          width: isMenuCollapsed ? 0 : sidebarWidth,
        }}
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
                    <div className="text-xl font-bold text-white flex items-center gap-2">
                      {SITE_CONFIG.name}
                    </div>
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
                    value={selectedMap?.id || ""}
                    onChange={(e) => {
                      const newMapId = e.target.value;
                      console.log('🔄 Changement de région vers:', newMapId);
                      setSelectedMapId(newMapId);
                    }}
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
          <div className="relative p-2 border-b border-indigo-500/20 flex-1 overflow-y-auto custom-scrollbar">
            {/* Arrière-plan avec effet Ken Burns */}
            <div className="absolute inset-0 overflow-hidden">
              {ASSETS_PATHS.worldview.map((imagePath, index) => (
                <img
                  key={imagePath}
                  src={imagePath}
                  alt={`Carte interactive de la région ${selectedMap?.name || 'Duet Night Abyss'} montrant tous les marqueurs, coffres et points d'intérêt pour ${SITE_CONFIG.name}`}
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

            {/* Contenu des catégories avec accordéons */}
            <div className="relative z-20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Catégories
              </h3>
              <div className="space-y-2">
                {filteredGroups.map((group) => {
                  const isExpanded = expandedCategories[group.id] || false;
                  const visibleItems = group.items.filter(
                    (item) =>
                      visibleCategories[item.name.toLowerCase().trim()] !==
                      false
                  );
                  const totalMarkers = group.items.reduce((total, item) => {
                    const [mapId, categoryType, subCategoryIdStr] =
                      item.id.split("-");
                    const subCategoryId = parseInt(subCategoryIdStr);
                    if (selectedMap?.id === mapId) {
                      for (const cat of selectedMap.legend || []) {
                        if (cat.type === categoryType) {
                          const subCat = cat.markers?.find(
                            (m) => m.id === subCategoryId
                          );
                          return total + (subCat?.markers?.length || 0);
                        }
                      }
                    }
                    return total;
                  }, 0);

                  return (
                    <div
                      key={group.id}
                      className="bg-slate-800/30 rounded-lg border border-indigo-500/20 overflow-hidden"
                    >
                      {/* En-tête de la catégorie */}
                      <button
                        onClick={() => toggleCategoryExpansion(group.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded border border-indigo-500/30 bg-slate-700/60 flex items-center justify-center">
                            <img
                              src={group.icon}
                              alt={`Icône ${group.name} - Catégorie de marqueurs pour la carte interactive Duet Night Abyss`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-medium text-white">
                              {group.name}
                            </span>
                            <div className="text-xs text-gray-400">
                              {group.items.length} types • {totalMarkers}{" "}
                              marqueurs
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-indigo-400 font-semibold">
                            {visibleItems.length}/{group.items.length}
                          </span>
                          {/* Boutons Tout sélectionner/Désélectionner */}
                          <div className="flex gap-1">
                            {!isGroupFullySelected(group) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllInGroup(group);
                                }}
                                className="text-xs px-2 py-1 bg-indigo-600/80 hover:bg-indigo-600 rounded text-white transition-colors"
                                title="Tout sélectionner"
                              >
                                ✓
                              </button>
                            )}
                            {!isGroupFullyDeselected(group) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deselectAllInGroup(group);
                                }}
                                className="text-xs px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-white transition-colors"
                                title="Tout désélectionner"
                              >
                                ✗
                              </button>
                            )}
                          </div>
                          <svg
                            className={`w-4 h-4 text-indigo-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {/* Contenu de l'accordéon */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isExpanded
                            ? "max-h-[800px] opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="p-3 pt-0">
                          <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
                            {group.items.map((item) => {
                              const [mapId, categoryType, subCategoryIdStr] =
                                item.id.split("-");
                              const subCategoryId = parseInt(subCategoryIdStr);
                              let markerCount = 0;

                              if (selectedMap?.id === mapId) {
                                for (const cat of selectedMap.legend || []) {
                                  if (cat.type === categoryType) {
                                    const subCat = cat.markers?.find(
                                      (m) => m.id === subCategoryId
                                    );
                                    markerCount = subCat?.markers?.length || 0;
                                    break;
                                  }
                                }
                              }

                              return (
                                <button
                                  key={item.id}
                                  onClick={() =>
                                    toggleCategoryVisibility(
                                      item.name.toLowerCase().trim()
                                    )
                                  }
                                  title={item.name}
                                  className={`group relative flex flex-col items-center p-2 rounded-md transition-all duration-300 border min-w-0 ${
                                    visibleCategories[
                                      item.name.toLowerCase().trim()
                                    ] !== false
                                      ? "bg-indigo-600/20 border-indigo-400/50 shadow-sm"
                                      : "bg-slate-700/40 hover:bg-slate-600/50 border-indigo-500/20 hover:border-indigo-400/30 opacity-50"
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded overflow-hidden border border-indigo-500/30 shadow-sm mb-1 flex items-center justify-center bg-slate-600/50">
                                    <img
                                      src={item.icon}
                                      alt={`Icône ${item.name} - Marqueur pour la carte interactive Duet Night Abyss`}
                                      className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-110"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-white text-center truncate w-full font-medium mb-0.5 leading-tight">
                                    {item.name}
                                  </span>
                                  {visibleCategories[item.id] !== false &&
                                    markerCount > 0 && (
                                      <div className="text-xs font-semibold text-indigo-400">
                                        {markerCount}
                                      </div>
                                    )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  href="/changelog"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Changelog
                </Link>
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

      {/* Handle de redimensionnement */}
      {!isMenuCollapsed && (
        <div
          className="absolute top-10 bottom-10 z-[105] w-1 bg-indigo-500/20 hover:bg-indigo-500/40 cursor-ew-resize transition-colors duration-200 rounded-full"
          style={{ left: 16 + sidebarWidth }}
          onMouseDown={handleMouseDown}
          title="Redimensionner la sidebar"
        />
      )}

      {/* Bouton toggle sidebar - Toujours visible, positionné différemment selon l'état */}
      <button
        onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
        className="absolute z-[110] bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700/90 rounded-lg p-2.5 transition-all duration-300 border border-indigo-500/30 shadow-lg top-1/2 -translate-y-1/2"
        style={{
          left: isMenuCollapsed ? 16 : 20 + sidebarWidth,
        }}
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

                  {/* Changelog */}
                  <button
                    onClick={() => {
                      setShowChangelogModal(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-slate-800/70 transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    <span>Changelog</span>
                  </button>

                  <div className="h-px bg-indigo-500/20 my-1"></div>

                  {/* Informations sur la map */}
                  <button
                    onClick={() => {
                      setShowMapInfoModal(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-slate-800/70 transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Informations sur la map</span>
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

                  <div className="h-px bg-indigo-500/20 my-1"></div>

                  {/* Reset sidebar */}
                  <button
                    onClick={() => {
                      resetSidebarWidth();
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-slate-800/70 transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5"
                      />
                    </svg>
                    <span className="text-blue-400">
                      Réinitialiser la taille du panneau
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

      {/* Modal d'informations sur la map */}
      <MapInfoModal
        isOpen={showMapInfoModal}
        onClose={() => setShowMapInfoModal(false)}
        selectedMapId={selectedMapId}
      />

      {/* Modal Changelog */}
      <ChangelogModal
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
      />

      {/* Barre de statut en bas à gauche - Positionnée à droite de la sidebar */}
      {!isMenuCollapsed && (
        <div
          className="absolute bottom-6 bg-slate-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-3 z-[90] shadow-lg"
          style={{ left: 20 + sidebarWidth }}
        >
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
