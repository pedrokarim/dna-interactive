"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { DnaButton, DnaDialog } from "@/components/dna";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const t = useTranslations("import");
  const tCommon = useTranslations("common");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <DnaDialog
      open={isOpen}
      onClose={handleClose}
      title={t("title")}
      footer={
        <DnaButton variant="ghost" onClick={handleClose} className="px-4 py-2">
          {tCommon("cancel")}
        </DnaButton>
      }
    >
      <p className="mb-6 text-sm text-parch/85">{t("description")}</p>

      <div
        role="button"
        tabIndex={0}
        aria-label={t("dropHere")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`cursor-pointer border-2 border-dashed p-8 text-center transition-[border-color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 ${
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
          aria-label={t("title")}
        />

        <div className="flex flex-col items-center">
          <svg
            className={`mb-4 h-12 w-12 transition-colors ${isDragging ? "text-gold" : "text-gold/50"}`}
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
            <p className="font-medium text-gold">{t("releaseToImport")}</p>
          ) : (
            <>
              <p className="mb-1 font-medium text-parch">{t("dropHere")}</p>
              <p className="text-sm text-muted">{t("orBrowse")}</p>
            </>
          )}

          <div className="mt-4 text-xs text-muted-2">{t("acceptedFormat")}</div>
        </div>
      </div>

      {error && (
        <div className="mt-4 border border-crimson-bright/30 bg-crimson/10 p-3">
          <p className="text-sm text-crimson-bright">{error}</p>
        </div>
      )}
    </DnaDialog>
  );
}
