"use client";

import { useEffect } from "react";

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
  confirmText = "Confirmer",
  cancelText = "Annuler",
  confirmButtonColor = "bg-red-600/80 hover:bg-red-600",
}: ConfirmDialogProps) {
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
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <div
          className="bg-slate-950/95 backdrop-blur-md rounded-lg border border-indigo-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
          <p className="text-sm text-gray-300 mb-6">{message}</p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 hover:bg-slate-700/50 rounded-md transition-colors border border-indigo-500/20"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors border ${confirmButtonColor} border-red-500/50`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
