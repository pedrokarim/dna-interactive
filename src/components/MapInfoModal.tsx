"use client";

import mapIndex from "@/data/mapIndex.json";
import type { GameMapSummary } from "@/types/map";
import { useTranslations } from "next-intl";
import { DnaButton, DnaDialog, DnaSectionLabel } from "@/components/dna";

interface MapInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMapId: string | null;
}

export default function MapInfoModal({ isOpen, onClose, selectedMapId }: MapInfoModalProps) {
  const t = useTranslations("mapInfo");
  const tCommon = useTranslations("common");

  const index = mapIndex as GameMapSummary[];

  const totalMaps = index.length;
  const totalMarkers = index.reduce((sum, m) => sum + m.markerCount, 0);
  const totalImages = index.reduce((sum, m) => sum + m.imageCount, 0);

  const selectedMap = selectedMapId ? index.find((m) => m.id === selectedMapId) : null;
  const selectedMapMarkers = selectedMap?.markerCount ?? 0;
  const selectedMapImages = selectedMap?.imageCount ?? 0;
  const selectedMapCategories = selectedMap?.legend.length ?? 0;

  const lastUpdateDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const version = `1.${totalMaps}.${Math.floor(totalMarkers / 100)}`;

  return (
    <DnaDialog
      open={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        <span className="flex items-center gap-2.5">
          <svg className="h-6 w-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t("title")}
        </span>
      }
      footer={
        <DnaButton variant="gold" onClick={onClose}>
          {tCommon("close")}
        </DnaButton>
      }
    >
      {/* Version et Date */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="border border-line/25 bg-panel/50 p-4">
          <div className="mb-1 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70">{tCommon("version")}</div>
          <div className="font-display text-xl text-gold-bright">{version}</div>
        </div>
        <div className="border border-line/25 bg-panel/50 p-4">
          <div className="mb-1 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70">{t("lastUpdate")}</div>
          <div className="font-display text-xl text-parch">{lastUpdateDate}</div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="mb-6">
        <DnaSectionLabel className="mb-3">{t("globalStats")}</DnaSectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-line/25 bg-panel/50 p-4 text-center">
            <div className="font-display text-3xl text-gold-bright">{totalMaps}</div>
            <div className="mt-1 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">{t("maps")}</div>
          </div>
          <div className="border border-line/25 bg-panel/50 p-4 text-center">
            <div className="font-display text-3xl text-anemo">{totalMarkers}</div>
            <div className="mt-1 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">{t("markers")}</div>
          </div>
          <div className="border border-line/25 bg-panel/50 p-4 text-center">
            <div className="font-display text-3xl text-electro">{totalImages}</div>
            <div className="mt-1 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">{t("images")}</div>
          </div>
        </div>
      </div>

      {/* Statistiques de la map sélectionnée */}
      {selectedMap && (
        <div className="mb-6">
          <DnaSectionLabel className="mb-3">{t("currentMap", { name: selectedMap.name })}</DnaSectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-line/25 bg-panel/50 p-4 text-center">
              <div className="font-display text-2xl text-gold-bright">{selectedMapCategories}</div>
              <div className="mt-1 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">{t("categoriesCount")}</div>
            </div>
            <div className="border border-line/25 bg-panel/50 p-4 text-center">
              <div className="font-display text-2xl text-anemo">{selectedMapMarkers}</div>
              <div className="mt-1 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">{t("markers")}</div>
            </div>
            <div className="border border-line/25 bg-panel/50 p-4 text-center">
              <div className="font-display text-2xl text-electro">{selectedMapImages}</div>
              <div className="mt-1 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted">{t("images")}</div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des maps */}
      <div className="mb-6">
        <DnaSectionLabel className="mb-3">{t("allMaps")}</DnaSectionLabel>
        <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto">
          {index.map((map) => (
            <div
              key={map.id}
              className={`border p-3 ${map.id === selectedMapId ? "border-gold bg-gold/10" : "border-line/25 bg-panel/50"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-sans text-sm font-medium text-parch">{map.name}</div>
                  <div className="mt-1 text-xs text-muted">
                    {t("markerCount", { markers: map.markerCount, images: map.imageCount })}
                  </div>
                </div>
                {map.id === selectedMapId && (
                  <div className="border border-gold/50 bg-gold/20 px-2 py-1 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-gold">
                    {t("current")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border border-line/20 bg-panel/30 p-4">
        <div className="mb-2 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70">{tCommon("disclaimer")}</div>
        <div className="space-y-2 text-xs leading-relaxed text-parch/85">
          <p>{t("disclaimerFr")}</p>
          <p className="italic text-muted">{t("disclaimerEn")}</p>
        </div>
      </div>
    </DnaDialog>
  );
}
