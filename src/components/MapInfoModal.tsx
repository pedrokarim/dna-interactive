"use client";

import { useEffect } from "react";
import mapIndex from "@/data/mapIndex.json";
import type { GameMapSummary } from "@/types/map";
import { useTranslations } from "next-intl";
import {
  DnaPanel,
  DnaButton,
  DnaSectionLabel,
  DnaCornerBrackets,
} from "@/components/dna";

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
  const t = useTranslations("mapInfo");
  const tCommon = useTranslations("common");
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

  const index = mapIndex as GameMapSummary[];

  // Calculer les statistiques globales depuis l'index (pre-computed)
  const totalMaps = index.length;
  const totalMarkers = index.reduce((sum, m) => sum + m.markerCount, 0);
  const totalImages = index.reduce((sum, m) => sum + m.imageCount, 0);

  // Statistiques de la map sélectionnée
  const selectedMap = selectedMapId
    ? index.find((m) => m.id === selectedMapId)
    : null;

  const selectedMapMarkers = selectedMap?.markerCount ?? 0;
  const selectedMapImages = selectedMap?.imageCount ?? 0;
  const selectedMapCategories = selectedMap?.legend.length ?? 0;

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
      <div
        className="fixed inset-0 z-210 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="max-w-2xl w-full max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
        <DnaPanel className="p-6 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <DnaCornerBrackets size={18} />

          <div className="relative flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl text-parch flex items-center gap-2.5">
              <svg
                className="w-6 h-6 text-gold"
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
              {t("title")}
            </h3>
            <button
              onClick={onClose}
              className="text-muted hover:text-gold-bright transition-colors"
              aria-label={tCommon("close")}
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
          <div className="relative grid grid-cols-2 gap-4 mb-6">
            <div className="bg-panel/50 border border-line/25 p-4">
              <div className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70 mb-1">{tCommon("version")}</div>
              <div className="font-display text-xl text-gold-bright">{version}</div>
            </div>
            <div className="bg-panel/50 border border-line/25 p-4">
              <div className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70 mb-1">
                {t("lastUpdate")}
              </div>
              <div className="font-display text-xl text-parch">
                {lastUpdateDate}
              </div>
            </div>
          </div>

          {/* Statistiques globales */}
          <div className="relative mb-6">
            <DnaSectionLabel className="mb-3">{t("globalStats")}</DnaSectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-panel/50 border border-line/25 p-4 text-center">
                <div className="font-display text-3xl text-gold-bright">
                  {totalMaps}
                </div>
                <div className="font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted mt-1">{t("maps")}</div>
              </div>
              <div className="bg-panel/50 border border-line/25 p-4 text-center">
                <div className="font-display text-3xl text-anemo">
                  {totalMarkers}
                </div>
                <div className="font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted mt-1">{t("markers")}</div>
              </div>
              <div className="bg-panel/50 border border-line/25 p-4 text-center">
                <div className="font-display text-3xl text-electro">
                  {totalImages}
                </div>
                <div className="font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted mt-1">{t("images")}</div>
              </div>
            </div>
          </div>

          {/* Statistiques de la map sélectionnée */}
          {selectedMap && (
            <div className="relative mb-6">
              <DnaSectionLabel className="mb-3">
                {t("currentMap", { name: selectedMap.name })}
              </DnaSectionLabel>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-panel/50 border border-line/25 p-4 text-center">
                  <div className="font-display text-2xl text-gold-bright">
                    {selectedMapCategories}
                  </div>
                  <div className="font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted mt-1">{t("categoriesCount")}</div>
                </div>
                <div className="bg-panel/50 border border-line/25 p-4 text-center">
                  <div className="font-display text-2xl text-anemo">
                    {selectedMapMarkers}
                  </div>
                  <div className="font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted mt-1">{t("markers")}</div>
                </div>
                <div className="bg-panel/50 border border-line/25 p-4 text-center">
                  <div className="font-display text-2xl text-electro">
                    {selectedMapImages}
                  </div>
                  <div className="font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted mt-1">{t("images")}</div>
                </div>
              </div>
            </div>
          )}

          {/* Liste des maps */}
          <div className="relative mb-6">
            <DnaSectionLabel className="mb-3">{t("allMaps")}</DnaSectionLabel>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {index.map((map) => (
                <div
                  key={map.id}
                  className={`border p-3 ${
                    map.id === selectedMapId
                      ? "border-gold bg-gold/10"
                      : "border-line/25 bg-panel/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-sans text-sm font-medium text-parch">
                        {map.name}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {t("markerCount", { markers: map.markerCount, images: map.imageCount })}
                      </div>
                    </div>
                    {map.id === selectedMapId && (
                      <div className="px-2 py-1 bg-gold/20 border border-gold/50 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-gold">
                        {t("current")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="relative bg-panel/30 border border-line/20 p-4 mb-6">
            <div className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70 mb-2">
              {tCommon("disclaimer")}
            </div>
            <div className="text-xs text-parch/85 leading-relaxed space-y-2">
              <p>
                {t("disclaimerFr")}
              </p>
              <p className="text-muted italic">
                {t("disclaimerEn")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="relative flex gap-3 justify-end">
            <DnaButton variant="gold" onClick={onClose}>
              {tCommon("close")}
            </DnaButton>
          </div>
        </DnaPanel>
        </div>
      </div>
    </>
  );
}
