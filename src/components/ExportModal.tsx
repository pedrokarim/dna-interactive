"use client";

import { useState } from "react";
import { DnaButton, DnaDialog } from "@/components/dna";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: "json" | "csv") => void;
  markerCount: number;
}

export default function ExportModal({ isOpen, onClose, onExport, markerCount }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"json" | "csv">("json");

  const handleExport = () => {
    onExport(selectedFormat);
    onClose();
  };

  return (
    <DnaDialog
      open={isOpen}
      onClose={onClose}
      title="Exporter les marqueurs"
      footer={
        <>
          <DnaButton variant="ghost" onClick={onClose} className="px-4 py-2">
            Annuler
          </DnaButton>
          <DnaButton
            variant="gold"
            onClick={handleExport}
            className="px-4 py-2"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
        </>
      }
    >
      <p className="mb-6 text-sm text-parch/85">
        Vous allez exporter <span className="font-semibold text-gold">{markerCount}</span> marqueur
        {markerCount > 1 ? "s" : ""} au format sélectionné.
      </p>

      <div className="mb-1">
        <label className="mb-3 block font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/80">
          Format du fichier
        </label>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center border border-line/25 bg-panel/50 p-3 transition-colors hover:border-gold/40 hover:bg-white/10">
            <input
              type="radio"
              name="format"
              value="json"
              checked={selectedFormat === "json"}
              onChange={() => setSelectedFormat("json")}
              className="mr-3 text-gold focus:ring-gold focus:ring-offset-ink"
            />
            <div className="flex-1">
              <div className="font-medium text-parch">JSON</div>
              <div className="text-xs text-muted">Format structuré, facile à réimporter</div>
            </div>
          </label>

          <label className="flex cursor-pointer items-center border border-line/25 bg-panel/50 p-3 transition-colors hover:border-gold/40 hover:bg-white/10">
            <input
              type="radio"
              name="format"
              value="csv"
              checked={selectedFormat === "csv"}
              onChange={() => setSelectedFormat("csv")}
              className="mr-3 text-gold focus:ring-gold focus:ring-offset-ink"
            />
            <div className="flex-1">
              <div className="font-medium text-parch">CSV</div>
              <div className="text-xs text-muted">Format tableur, compatible Excel</div>
            </div>
          </label>
        </div>
      </div>
    </DnaDialog>
  );
}
