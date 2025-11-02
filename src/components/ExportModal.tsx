"use client";

import { useState, useEffect } from "react";

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
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <div
          className="bg-slate-950/95 backdrop-blur-md rounded-lg border border-indigo-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Exporter les marqueurs</h3>
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

          <p className="text-sm text-gray-300 mb-6">
            Vous allez exporter <span className="font-semibold text-indigo-400">{markerCount}</span> marqueur{markerCount > 1 ? "s" : ""} au format sélectionné.
          </p>

          {/* Format selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Format du fichier
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded-lg border border-indigo-500/30 bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={selectedFormat === "json"}
                  onChange={() => setSelectedFormat("json")}
                  className="mr-3 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">JSON</div>
                  <div className="text-xs text-gray-400">Format structuré, facile à réimporter</div>
                </div>
                <svg
                  className="w-5 h-5 text-indigo-400 ml-2"
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

              <label className="flex items-center p-3 rounded-lg border border-indigo-500/30 bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={selectedFormat === "csv"}
                  onChange={() => setSelectedFormat("csv")}
                  className="mr-3 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">CSV</div>
                  <div className="text-xs text-gray-400">Format tableur, compatible Excel</div>
                </div>
                <svg
                  className="w-5 h-5 text-indigo-400 ml-2"
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
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 hover:bg-slate-700/50 rounded-md transition-colors border border-indigo-500/20"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600/80 hover:bg-indigo-600 rounded-md transition-colors border border-indigo-500/50 flex items-center gap-2"
            >
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
              Exporter
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

