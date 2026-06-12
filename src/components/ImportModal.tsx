"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { DnaPanel, DnaButton, DnaCornerBrackets } from "@/components/dna";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
}: ImportModalProps) {
  const t = useTranslations("import");
  const tCommon = useTranslations("common");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    setIsDragging(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith(".json")) {
      setError(t("errorJsonRequired"));
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) return;
    onImport(file);
    handleClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-[210] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div
          className="max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
        <DnaPanel className="p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <DnaCornerBrackets size={16} />
          <div className="relative flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-parch">{t("title")}</h3>
            <button
              onClick={handleClose}
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
            {t("description")}
          </p>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`relative border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-gold bg-gold/10 scale-[1.02]"
                : "border-line/30 bg-panel/30 hover:border-gold/50 hover:bg-panel/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center">
              <svg
                className={`w-12 h-12 mb-4 transition-colors ${
                  isDragging ? "text-gold" : "text-gold/50"
                }`}
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

              {isDragging ? (
                <p className="text-gold font-medium">
                  {t("releaseToImport")}
                </p>
              ) : (
                <>
                  <p className="text-parch font-medium mb-1">
                    {t("dropHere")}
                  </p>
                  <p className="text-muted text-sm">
                    {t("orBrowse")}
                  </p>
                </>
              )}

              <div className="mt-4 text-xs text-muted-2">
                {t("acceptedFormat")}
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="relative mt-4 p-3 bg-crimson/10 border border-crimson-bright/30">
              <p className="text-crimson-bright text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="relative flex gap-3 justify-end mt-6">
            <DnaButton variant="ghost" onClick={handleClose} className="px-4 py-2">
              {tCommon("cancel")}
            </DnaButton>
          </div>
        </DnaPanel>
        </div>
      </div>
    </>
  );
}

