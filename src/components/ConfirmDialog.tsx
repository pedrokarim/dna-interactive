"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn, DnaPanel, DnaButton, DnaCornerBrackets } from "@/components/dna";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonColor = "",
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  const resolvedConfirmText = confirmText ?? t("confirm");
  const resolvedCancelText = cancelText ?? t("cancel");
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

  const handleConfirm = () => {
    onConfirm();
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
            <h3 className="relative font-display text-xl text-parch mb-3">{title}</h3>
            <p className="relative text-sm text-parch/85 mb-6">{message}</p>

            <div className="relative flex gap-3 justify-end">
              <DnaButton variant="ghost" onClick={onClose} className="px-4 py-2">
                {resolvedCancelText}
              </DnaButton>
              <button
                onClick={handleConfirm}
                className={cn(
                  "dna-shine inline-flex items-center justify-center gap-2 rounded-md px-6 py-2.5 font-sans text-sm tracking-wide transition-all duration-200 border border-crimson-bright bg-gradient-to-b from-crimson/40 to-ink/70 text-[#ffb3a6] hover:-translate-y-px hover:border-crimson-bright hover:text-[#ffd2c8]",
                  confirmButtonColor,
                )}
              >
                {resolvedConfirmText}
              </button>
            </div>
          </DnaPanel>
        </div>
      </div>
    </>
  );
}
