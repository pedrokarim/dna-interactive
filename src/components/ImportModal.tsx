"use client";

import { useState, useEffect, useRef } from "react";

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
      setError("Le fichier doit être au format JSON (.json)");
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
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <div
          className="bg-slate-950/95 backdrop-blur-md rounded-lg border border-indigo-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Importer les marqueurs</h3>
            <button
              onClick={handleClose}
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
            Glissez-déposez un fichier JSON ou cliquez pour sélectionner un fichier.
          </p>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-indigo-500 bg-indigo-500/10 scale-105"
                : "border-indigo-500/30 bg-slate-800/30 hover:border-indigo-500/50 hover:bg-slate-800/50"
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
                  isDragging ? "text-indigo-400" : "text-indigo-500/50"
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
                <p className="text-indigo-400 font-medium">
                  Relâchez pour importer le fichier
                </p>
              ) : (
                <>
                  <p className="text-white font-medium mb-1">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="text-gray-400 text-sm">
                    ou cliquez pour parcourir
                  </p>
                </>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Format accepté : JSON (.json)
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 hover:bg-slate-700/50 rounded-md transition-colors border border-indigo-500/20"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

