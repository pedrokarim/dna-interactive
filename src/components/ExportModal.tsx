"use client";

import { useState, useEffect } from "react";
import { DnaPanel, DnaButton, DnaCornerBrackets } from "@/components/dna";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "json" | "csv") => void;
  markerCount: number;
}

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
  markerCount,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"json" | "csv">("json");

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

  const handleExport = () => {
    onExport(selectedFormat);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-[210] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
        <DnaPanel className="p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <DnaCornerBrackets size={16} />
          <div className="relative flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-parch">Exporter les marqueurs</h3>
            <button
              onClick={onClose}
              className="text-muted hover:text-gold-bright transition-colors"
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

          <p className="relative text-sm text-parch/85 mb-6">
            Vous allez exporter <span className="font-semibold text-gold">{markerCount}</span> marqueur{markerCount > 1 ? "s" : ""} au format sélectionné.
          </p>

          {/* Format selection */}
          <div className="relative mb-6">
            <label className="block font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/80 mb-3">
              Format du fichier
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-line/25 bg-panel/50 hover:bg-white/10 hover:border-gold/40 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={selectedFormat === "json"}
                  onChange={() => setSelectedFormat("json")}
                  className="mr-3 text-gold focus:ring-gold focus:ring-offset-ink"
                />
                <div className="flex-1">
                  <div className="text-parch font-medium">JSON</div>
                  <div className="text-xs text-muted">Format structuré, facile à réimporter</div>
                </div>
                <svg
                  className="w-5 h-5 text-gold ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </label>

              <label className="flex items-center p-3 border border-line/25 bg-panel/50 hover:bg-white/10 hover:border-gold/40 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={selectedFormat === "csv"}
                  onChange={() => setSelectedFormat("csv")}
                  className="mr-3 text-gold focus:ring-gold focus:ring-offset-ink"
                />
                <div className="flex-1">
                  <div className="text-parch font-medium">CSV</div>
                  <div className="text-xs text-muted">Format tableur, compatible Excel</div>
                </div>
                <svg
                  className="w-5 h-5 text-gold ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="relative flex gap-3 justify-end">
            <DnaButton variant="ghost" onClick={onClose} className="px-4 py-2">
              Annuler
            </DnaButton>
            <DnaButton
              variant="gold"
              onClick={handleExport}
              className="px-4 py-2"
              icon={
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            >
              Exporter
            </DnaButton>
          </div>
        </DnaPanel>
        </div>
      </div>
    </>
  );
}

