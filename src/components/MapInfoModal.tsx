"use client";

import { useEffect } from "react";
import mapData from "@/data/mapData.json";

interface MapInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMapId: string | null;
}

export default function MapInfoModal({
  isOpen,
  onClose,
  selectedMapId,
}: MapInfoModalProps) {
  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculer les statistiques globales
  const totalMaps = mapData.length;
  const totalMarkers = mapData.reduce(
    (sum, map) =>
      sum +
      map.legend.reduce(
        (catSum, cat) =>
          catSum +
          cat.markers.reduce(
            (markerSum, marker) => markerSum + marker.markers.length,
            0
          ),
        0
      ),
    0
  );
  const totalImages = mapData.reduce(
    (sum, map) =>
      sum +
      map.legend.reduce(
        (catSum, cat) =>
          catSum +
          cat.markers.reduce(
            (markerSum, marker) =>
              markerSum +
              marker.markers.filter((m) => m.image && m.image !== "").length,
            0
          ),
        0
      ),
    0
  );

  // Statistiques de la map sélectionnée
  const selectedMap = selectedMapId
    ? mapData.find((m) => m.id === selectedMapId)
    : null;

  const selectedMapMarkers = selectedMap
    ? selectedMap.legend.reduce(
        (sum, cat) =>
          sum +
          cat.markers.reduce((s, mt) => s + mt.markers.length, 0),
        0
      )
    : 0;

  const selectedMapImages = selectedMap
    ? selectedMap.legend.reduce(
        (sum, cat) =>
          sum +
          cat.markers.reduce(
            (s, mt) =>
              s + mt.markers.filter((m) => m.image && m.image !== "").length,
            0
          ),
        0
      )
    : 0;

  const selectedMapCategories = selectedMap
    ? selectedMap.legend.length
    : 0;

  // Date de mise à jour (date actuelle ou dernière modification)
  const lastUpdateDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Version basée sur le nombre de maps et marqueurs
  const version = `1.${totalMaps}.${Math.floor(totalMarkers / 100)}`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-210 flex items-center justify-center p-4">
        <div
          className="bg-slate-950/95 backdrop-blur-md rounded-lg border border-indigo-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6 text-indigo-400"
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
              Informations sur les Maps
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Version et Date */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Version</div>
              <div className="text-lg font-bold text-indigo-400">{version}</div>
            </div>
            <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">
                Dernière mise à jour
              </div>
              <div className="text-lg font-bold text-white">
                {lastUpdateDate}
              </div>
            </div>
          </div>

          {/* Statistiques globales */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
              Statistiques Globales
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-400">
                  {totalMaps}
                </div>
                <div className="text-xs text-gray-400 mt-1">Maps</div>
              </div>
              <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {totalMarkers}
                </div>
                <div className="text-xs text-gray-400 mt-1">Marqueurs</div>
              </div>
              <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {totalImages}
                </div>
                <div className="text-xs text-gray-400 mt-1">Images</div>
              </div>
            </div>
          </div>

          {/* Statistiques de la map sélectionnée */}
          {selectedMap && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                Map Actuelle : {selectedMap.name}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-indigo-400">
                    {selectedMapCategories}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Catégories</div>
                </div>
                <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-green-400">
                    {selectedMapMarkers}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Marqueurs</div>
                </div>
                <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-purple-400">
                    {selectedMapImages}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Images</div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des maps */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
              Toutes les Maps
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mapData.map((map) => {
                const mapMarkers = map.legend.reduce(
                  (sum, cat) =>
                    sum +
                    cat.markers.reduce((s, mt) => s + mt.markers.length, 0),
                  0
                );
                const mapImages = map.legend.reduce(
                  (sum, cat) =>
                    sum +
                    cat.markers.reduce(
                      (s, mt) =>
                        s +
                        mt.markers.filter((m) => m.image && m.image !== "")
                          .length,
                      0
                    ),
                  0
                );

                return (
                  <div
                    key={map.id}
                    className={`bg-slate-800/50 border rounded-lg p-3 ${
                      map.id === selectedMapId
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-indigo-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {map.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {mapMarkers} marqueurs • {mapImages} images
                        </div>
                      </div>
                      {map.id === selectedMapId && (
                        <div className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/50 rounded text-xs text-indigo-400 font-medium">
                          Actuelle
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-800/30 border border-indigo-500/20 rounded-lg p-4 mb-6">
            <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">
              Disclaimer
            </div>
            <div className="text-xs text-gray-300 leading-relaxed space-y-2">
              <p>
                Cette carte intègre des données de localisation de base et des
                matériaux de référence provenant de contributions de la
                communauté CN. Ce site ne monétise à aucun cas. C'est un outil
                gratuit disponible aux joueurs pour faciliter leur exploration.
              </p>
              <p className="text-gray-400 italic">
                This map incorporates base location data and reference materials
                sourced from CN community contributions. This site does not
                monetize in any way. It is a free tool available to players to
                facilitate their exploration.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600/80 hover:bg-indigo-600 rounded-md transition-colors border border-indigo-500/50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

