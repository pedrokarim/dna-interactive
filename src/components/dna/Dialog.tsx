"use client";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { DnaButton } from "./Button";

/**
 * Modale du design system — coque réutilisable (overlay + panneau aux coins
 * nets, liseré doré/cramoisi, fermeture ESC + clic backdrop). Remplace les
 * dialogues natifs du navigateur. `DnaConfirmDialog` ajoute confirmer/annuler.
 */
export type DnaDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Accent cramoisi (action destructive) au lieu du doré. */
  danger?: boolean;
  className?: string;
};

export function DnaDialog({ open, onClose, title, children, footer, danger, className }: DnaDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  const accent = danger ? "#e0685a" : "#c2a86a";

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn("relative w-full max-w-md border bg-[#0b0e14] shadow-[0_24px_60px_rgba(0,0,0,0.6)]", className)}
        style={{ borderColor: `${accent}66` }}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ backgroundColor: accent }} />
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-3.5">
          {title ? <h2 className="font-display text-lg leading-tight text-parch">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-7 w-7 shrink-0 place-items-center text-muted transition-colors hover:text-parch"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children != null ? <div className="px-5 py-4 font-sans text-sm leading-relaxed text-parch/85">{children}</div> : null}
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-3.5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export type DnaConfirmDialogProps = {
  open: boolean;
  title?: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** false = mode alerte (un seul bouton). */
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DnaConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Annuler",
  danger = false,
  showCancel = true,
  onConfirm,
  onCancel,
}: DnaConfirmDialogProps) {
  return (
    <DnaDialog
      open={open}
      onClose={onCancel}
      title={title}
      danger={danger}
      footer={
        <>
          {showCancel ? (
            <DnaButton variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </DnaButton>
          ) : null}
          <DnaButton variant={danger ? "danger" : "gold"} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </DnaButton>
        </>
      }
    >
      {message}
    </DnaDialog>
  );
}
